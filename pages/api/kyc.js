import { ethers } from "ethers";
import { connect } from "@planetscale/database";

const conn = process.env.DATABASE_URL ? connect({ url: process.env.DATABASE_URL }) : null;

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { publicKey } = req.query || {};
    if (!publicKey) return res.status(400).json({ error: "Missing publicKey" });
    if (!conn) {
      console.warn("DATABASE_URL not set, skipping DB fetch");
      return res.status(404).json({ error: "Not found" });
    }
    try {
      const result = await conn.execute(
        "SELECT full_name, email, country, document_type, document_number FROM kyc_submissions WHERE public_key = ?",
        [publicKey]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      const row = result.rows[0];
      return res.status(200).json({
        formData: {
          fullName: row.full_name,
          email: row.email,
          country: row.country,
          documentType: row.document_type,
          documentNumber: row.document_number,
        },
      });
    } catch (dbErr) {
      console.error("DB fetch error", dbErr);
      return res.status(500).json({ error: "Database error" });
    }
  } else if (req.method === "POST") {
    const { formData, publicKey, signature } = req.body || {};
    if (!formData || !publicKey || !signature) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      const message = JSON.stringify(formData);
      const recovered = ethers.utils.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== publicKey.toLowerCase()) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      if (conn) {
        try {
          await conn.execute(
            `INSERT INTO kyc_submissions (
              full_name,
              email,
              country,
              document_type,
              document_number,
              public_key,
              signature
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              full_name=VALUES(full_name),
              email=VALUES(email),
              country=VALUES(country),
              document_type=VALUES(document_type),
              document_number=VALUES(document_number),
              signature=VALUES(signature)`,
            [
              formData.fullName,
              formData.email,
              formData.country,
              formData.documentType,
              formData.documentNumber,
              publicKey,
              signature,
            ]
          );
        } catch (dbErr) {
          console.error("DB error", dbErr);
          return res.status(500).json({ error: "Database error" });
        }
      } else {
        console.warn("DATABASE_URL not set, skipping DB save");
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Signature verification failed", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
