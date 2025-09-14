// scripts/ws-test.js
// Minimal WebSocket RPC tester (independent from the Telegram notifier)
// Usage examples:
//   RPC_WS_URL=ws://127.0.0.1:8545 node scripts/ws-test.js
//   RPC_WS_URL=wss://<provider> CONTRACT_ADDRESS=0x... node scripts/ws-test.js
//   NETWORK_RPC_URL=wss://<provider> node scripts/ws-test.js
//
// Behavior:
// - Connects via WebSocket and logs new blocks
// - If CONTRACT_ADDRESS is provided, also subscribes to TokenICO TokensPurchased events

require('dotenv').config({ path: __dirname + '/../.env' });
const { ethers } = require('ethers');

const RPC_WS_URL = process.env.RPC_WS_URL || '';
const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL || '';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.CONTRACT_ADDRESS || '';

function isWs(u) { return typeof u === 'string' && (u.startsWith('ws://') || u.startsWith('wss://')); }

async function main() {
  const wsUrl = isWs(RPC_WS_URL) ? RPC_WS_URL : (isWs(NETWORK_RPC_URL) ? NETWORK_RPC_URL : '');
  if (!wsUrl) {
    throw new Error('Please set RPC_WS_URL or NETWORK_RPC_URL to a ws:// or wss:// endpoint');
  }

  console.log('[ws-test] Connecting to', wsUrl);
  const provider = new ethers.providers.WebSocketProvider(wsUrl);

  // Attach low-level listeners for troubleshooting
  const ws = provider._websocket;
  if (ws) {
    ws.on('open', () => console.log('[ws-test] WebSocket open'));
    ws.on('close', (code) => console.log('[ws-test] WebSocket close:', code));
    ws.on('error', (err) => console.error('[ws-test] WebSocket error:', err && err.message || err));
  }

  // Verify provider works by querying chainId and latest block
  const net = await provider.getNetwork();
  const bn = await provider.getBlockNumber();
  console.log('[ws-test] Connected. chainId=', net.chainId, 'blockNumber=', bn);

  // Subscribe to new blocks
  provider.on('block', (n) => {
    console.log('[ws-test] New block:', n);
  });

  // Optional: subscribe to TokensPurchased if address provided
  if (CONTRACT_ADDRESS && ethers.utils.isAddress(CONTRACT_ADDRESS)) {
    let abi;
    try {
      abi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
    } catch (e) {
      console.warn('[ws-test] Could not load TokenICO ABI from artifacts:', e.message);
    }
    if (abi) {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      const filter = contract.filters.TokensPurchased();
      console.log('[ws-test] Subscribing to TokensPurchased for', CONTRACT_ADDRESS);
      contract.on(filter, (buyer, paymentMethod, amountPaid, tokensBought, timestamp, event) => {
        const t = timestamp && timestamp.toNumber ? new Date(timestamp.toNumber() * 1000).toISOString() : 'n/a';
        console.log('[ws-test][TokensPurchased]', {
          tx: event.transactionHash,
          block: event.blockNumber,
          buyer,
          paymentMethod,
          amountPaid: amountPaid.toString(),
          tokensBought: tokensBought.toString(),
          time: t,
        });
      });
    }
  } else {
    console.log('[ws-test] No CONTRACT_ADDRESS provided; skipping event subscription');
  }

  console.log('[ws-test] Listening... Press Ctrl+C to exit');
}

main().catch((e) => {
  console.error('[ws-test] Error:', e && e.message || e);
  process.exit(1);
});

