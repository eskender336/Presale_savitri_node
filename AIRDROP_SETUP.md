# Airdrop Setup Instructions

## Adding Addresses from Image

The image you provided shows addresses and balances, but the addresses appear to be truncated in the description. You need to provide the **full addresses** (42 characters: `0x` + 40 hex characters).

### Option 1: Using the import script (Recommended)

1. Edit `data/airdrop-addresses.txt` with your addresses in this format:
   ```
   address,balance
   0x1234567890123456789012345678901234567890,20
   0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,12.5
   0x9876543210987654321098765432109876543210,6
   ```

2. Run the import script:
   ```bash
   node web3/scripts/import-airdrop-data.js
   ```

### Option 2: Using the quick-add script

1. Edit `web3/scripts/quick-add-addresses.js`
2. Add your addresses to the `ADDRESS_DATA` array
3. Run: `node web3/scripts/quick-add-addresses.js`

### Balance Format

Balances can be:
- Whole numbers: `20`, `6`, `5`
- Decimals: `12.5`, `3.5` (use period or comma)

The script automatically converts them to wei (smallest unit with 18 decimals).

## Starting the Airdrop Scheduler with PM2

Once addresses are added to `data/token-balances.csv`:

```bash
# Start the airdrop scheduler
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs airdrop-scheduler

# Stop the scheduler
pm2 stop airdrop-scheduler

# Restart the scheduler
pm2 restart airdrop-scheduler
```

## PM2 Management Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs airdrop-scheduler

# Monitor
pm2 monit

# Save PM2 process list (for auto-start on reboot)
pm2 save
pm2 startup  # Follow the instructions to enable auto-start

# Stop and delete
pm2 stop airdrop-scheduler
pm2 delete airdrop-scheduler
```

## Configuration

The airdrop scheduler reads configuration from `web3/.env`. Key variables:
- `NETWORK_RPC_URL` or `RPC_WS_URL` - RPC endpoint (required)
- `PRIVATE_KEY_PASSPHRASE` - Passphrase for encrypted private key (required)
- `PRIVATE_KEY` - Fallback: plaintext private key (not recommended)
- `SALE_TOKEN_ADDRESS` or `ICO_ADDRESS` - Token contract address
- `CSV_PATH` - Path to CSV (default: `../../data/token-balances.csv`)
- `DRY_RUN=1` - Test mode (no real transfers)

**Important**: Before starting the scheduler, ensure:
1. `web3/.env` is configured with required variables
2. Private key is set up (encrypted with passphrase or plaintext)
3. Addresses are added to `data/token-balances.csv`

See `web3/scripts/airdrop-scheduler.js` for full configuration options.

## Current Status

✅ PM2 ecosystem config created: `ecosystem.config.js`
✅ Logs directory created: `logs/`
✅ Import scripts ready: `web3/scripts/import-airdrop-data.js`
⏳ **Action needed**: Add full addresses from image to CSV
⏳ **Action needed**: Configure `web3/.env` with required variables

Once addresses are added and env is configured, start with:
```bash
pm2 start ecosystem.config.js
```

