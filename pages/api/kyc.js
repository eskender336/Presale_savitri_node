import { ethers } from "ethers";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { publicKey } = req.query || {};
    if (!publicKey) {
      return res.status(400).json({ error: "Missing publicKey" });
    }
    if (!process.env.MONGODB_URI) {
      return res.status(404).json({ error: "Not found" });
    }
    try {
      const { default: clientPromise } = await import("../../lib/mongo");
      const client = await clientPromise;
      const dbName = process.env.MONGODB_DB || "kycdb";
      const doc = await client.db(dbName).collection("kyc").findOne({ publicKey });
      if (!doc) {
        return res.status(404).json({ error: "Not found" });
      }
      const formData = {
        fullName: doc.fullName,
        email: doc.email,
        country: doc.country,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
      };
      return res.status(200).json({ formData });
    } catch (err) {
      console.error("MongoDB fetch error:", err);
      return res.status(500).json({ error: "Database error" });
    }
  } else if (req.method === "POST") {
    try {
      const body = req.body || {};
      const form = body.formData ?? body;

      const { fullName, email, country, documentType, documentNumber } = form || {};
      const publicKey = body.publicKey ?? form?.publicKey;
      const signature = body.signature ?? form?.signature;

      if (!fullName || !email || !country || !documentType || !documentNumber) {
        return res.status(400).json({ error: "Invalid payload: missing fields" });
      }

      const mustVerify = (process.env.SIGNATURE_REQUIRED ?? "true").toLowerCase() !== "false";
      if (mustVerify) {
        if (!publicKey || !signature) {
          return res.status(400).json({ error: "Missing signature/publicKey" });
        }
        const message = JSON.stringify({
          fullName,
          email,
          country,
          documentType,
          documentNumber,
        });
        let recovered;
        try {
          recovered = ethers.utils.verifyMessage(message, signature);
        } catch (e) {
          return res.status(400).json({ error: "Invalid signature format" });
        }
        if (recovered.toLowerCase() !== publicKey.toLowerCase()) {
          return res.status(400).json({ error: "Signature does not match publicKey" });
        }
      }

      const record = {
        fullName,
        email,
        country,
        documentType,
        documentNumber,
        publicKey: publicKey ?? null,
        signature: signature ?? null,
        updatedAt: new Date(),
      };

      if (!process.env.MONGODB_URI) {
        return res.status(500).json({
          error: "No storage backend available",
          hint: "Set MONGODB_URI (+ MONGODB_DB) and restart the server.",
        });
      }

      try {
        const { default: clientPromise } = await import("../../lib/mongo");
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || "kycdb";
        await client
          .db(dbName)
          .collection("kyc")
          .updateOne({ publicKey }, { $set: record }, { upsert: true });
        return res.status(200).json({ ok: true });
      } catch (err) {
        console.error("MongoDB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
    } catch (err) {
      console.error("KYC API fatal error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
}
