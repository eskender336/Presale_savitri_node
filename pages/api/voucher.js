import { ethers } from "ethers";
import { getReferrer } from "../../lib/waitlist";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

export default async function handler(req, res) {
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
