import { ethers } from "ethers";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { user, referrer } = body;

      if (!user || !referrer) {
        return res.status(400).json({ error: "Missing user or referrer" });
      }
      if (!ethers.utils.isAddress(user) || !ethers.utils.isAddress(referrer)) {
        return res.status(400).json({ error: "Invalid address" });
      }

      if (
        !process.env.MONGODB_URI ||
        !process.env.BACKEND_PRIVATE_KEY ||
        !process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS
      ) {
        return res.status(500).json({ error: "Service not configured" });
      }

      let nonce;
      try {
        const { default: clientPromise } = await import("../../lib/mongo");
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || "kycdb";
        const col = client.db(dbName).collection("voucher_nonces");
        const result = await col.findOneAndUpdate(
          { user: user.toLowerCase() },
          { $inc: { nonce: 1 }, $setOnInsert: { user: user.toLowerCase() } },
          { upsert: true, returnDocument: "after" }
        );
        nonce = result.value?.nonce ?? 1;
      } catch (err) {
        console.error("MongoDB error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      try {
        const signer = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY);
        const domain = {
          name: "TokenICOv2",
          version: "1",
          chainId: parseInt(process.env.CHAIN_ID || "1", 10),
          verifyingContract: process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS,
        };
        const types = {
          WLRef: [
            { name: "user", type: "address" },
            { name: "referrer", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        };
        const voucher = { user, referrer, nonce, deadline };
        const signature = await signer._signTypedData(domain, types, voucher);
        return res.status(200).json({ voucher, signature });
      } catch (err) {
        console.error("Signing error:", err);
        return res.status(500).json({ error: "Signing failed" });
      }
    } catch (err) {
      console.error("Voucher API fatal error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
}
