import clientPromise from "../../lib/mongo";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { fullName, email, country, documentType, documentNumber } = req.body || {};
    if (!fullName || !email || !country || !documentType || !documentNumber) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "kycdb");
    const result = await db.collection("kyc").insertOne({
      fullName,
      email,
      country,
      documentType,
      documentNumber,
      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true, id: String(result.insertedId) });
  } catch (e) {
    console.error("KYC API error:", e);
    return res.status(500).json({ message: "Failed to save KYC data" });
  }
}
