import { ethers } from "ethers";
import { getReferrer } from "../../lib/waitlist";
import TokenICO from "../../web3/artifacts/contracts/TokenICO.sol/TokenICO.json";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

// Simple rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // Lower limit for voucher endpoint

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  rateLimitMap.set(ip, userLimit);
  return true;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user } = req.body || {};
    console.log(`[api/voucher] request user=${user}`);
    if (!user) {
      return res.status(400).json({ error: "Missing user" });
    }

    const referrer = getReferrer(user);
    if (!referrer) {
      console.log(`[api/voucher] ${user} not in waitlist`);
      return res.status(403).json({ error: "Not whitelisted" });
    }

    const signerKey =
      process.env.VOUCHER_SIGNER_KEY || process.env.VOUCHER_PRIVATE_KEY;
    if (!signerKey) {
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const chainId = Number(
      process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || 0
    );
    const verifyingContract =
      process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS ||
      process.env.TOKEN_ICO_ADDRESS;
    if (!chainId || !verifyingContract) {
      return res.status(500).json({ error: "Missing domain parameters" });
    }

    // Check if user already has an on-chain referrer
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
      if (rpcUrl) {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(
          verifyingContract,
          TokenICO.abi,
          provider
        );
        const onchainReferrer = await contract.referrers(user);
        console.log(
          `[api/voucher] on-chain referrer for ${user} = ${onchainReferrer}`
        );
        if (onchainReferrer && onchainReferrer !== ethers.constants.AddressZero) {
          return res.status(200).json({
            voucher: null,
            signature: null,
            boundReferrer: onchainReferrer,
          });
        }
      } else {
        console.warn("[api/voucher] RPC URL not configured, skipping on-chain check");
      }
    } catch (err) {
      console.error("[api/voucher] on-chain referrer check failed", err);
    }

    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        error: "No storage backend available",
        hint: "Set MONGODB_URI (+ MONGODB_DB) and restart the server.",
      });
    }

    let nonce = 1;
    try {
      const { default: clientPromise } = await import("../../lib/mongo");
      const client = await clientPromise;
      const dbName = process.env.MONGODB_DB || "kycdb";
      const col = client.db(dbName).collection("voucher_nonces");
      const result = await col.findOneAndUpdate(
        { _id: user.toLowerCase() },
        { $inc: { nonce: 1 } },
        { upsert: true, returnDocument: "after" }
      );
      nonce = result.value?.nonce || nonce;
      console.log(`[api/voucher] nonce for ${user} = ${nonce}`);
    } catch (err) {
      console.error("MongoDB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const deadline = Math.floor(Date.now() / 1000) + 600;
    const voucher = { user, referrer, nonce, deadline };
    console.log("[api/voucher] voucher payload", voucher);

    const domain = {
      name: "TokenICO",
      version: "1",
      chainId,
      verifyingContract,
    };

    const types = {
      WhitelistRef: [
        { name: "user", type: "address" },
        { name: "referrer", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const wallet = new ethers.Wallet(signerKey);
    const signature = await wallet._signTypedData(domain, types, voucher);
    console.log(`[api/voucher] issued voucher for ${user}`);

    return res.status(200).json({ voucher, signature });
  } catch (err) {
    console.error("Voucher API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
