// pages/api/kyc.js
import { ethers } from "ethers";
import { connect as connectPlanetScale } from "@planetscale/database";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Accept either { formData, publicKey, signature } OR flat body
    const body = req.body || {};
    const form = body.formData ?? body;

    const { fullName, email, country, documentType, documentNumber } = form || {};
    const publicKey = body.publicKey ?? form?.publicKey;
    const signature = body.signature ?? form?.signature;

    // Basic payload validation
    if (!fullName || !email || !country || !documentType || !documentNumber) {
      return res.status(400).json({ error: "Invalid payload: missing fields" });
    }

    // Require signature if provided or if env demands it
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

    // Prepare document/row
    const record = {
      fullName,
      email,
      country,
      documentType,
      documentNumber,
      publicKey: publicKey ?? null,
      signature: signature ?? null,
      createdAt: new Date(),
    };

    const results = { saved: [], ids: {} };

    // --- MongoDB (if configured) ---
    if (process.env.MONGODB_URI) {
      try {
        // dynamic import to avoid throwing if MONGODB_URI is missing
        const { default: clientPromise } = await import("../../lib/mongo");
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || "kycdb";
        const mongoRes = await client.db(dbName).collection("kyc").insertOne(record);
        results.saved.push("mongodb");
        results.ids.mongo = String(mongoRes.insertedId);
      } catch (err) {
        console.error("MongoDB error:", err);
        // keep going so PlanetScale can still succeed
      }
    }

    // --- PlanetScale/MySQL (if configured) ---
    if (process.env.DATABASE_URL) {
      try {
        const conn = connectPlanetScale({ url: process.env.DATABASE_URL });
        // ensure table exists (no-op if already there)
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS kyc_submissions (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            country VARCHAR(255) NOT NULL,
            document_type VARCHAR(64) NOT NULL,
            document_number VARCHAR(255) NOT NULL,
            public_key VARCHAR(255) NULL,
            signature TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        const insert = await conn.execute(
          `INSERT INTO kyc_submissions
           (full_name, email, country, document_type, document_number, public_key, signature)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            record.fullName,
            record.email,
            record.country,
            record.documentType,
            record.documentNumber,
            record.publicKey,
            record.signature,
          ]
        );
        results.saved.push("planetscale");
        // insert.insertId may be string in some drivers; keep as-is
        results.ids.planetscale = insert.insertId ?? null;
      } catch (err) {
        console.error("PlanetScale DB error:", err);
      }
    }

    if (results.saved.length === 0) {
      // Neither backend configured or both failed
      return res.status(500).json({
        error: "No storage backend available",
        hint:
          "Set MONGODB_URI (+ MONGODB_DB) and/or DATABASE_URL env vars, then restart the app/server.",
      });
    }

    return res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error("KYC API fatal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
