import clientPromise from "../../lib/mongodb-client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB_NAME || "kycdb");
    const { fullName, email, country, documentType, documentNumber } = req.body;

    if (!fullName || !email || !country || !documentType || !documentNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await db.collection("kyc").insertOne({
      fullName,
      email,
      country,
      documentType,
      documentNumber,
      createdAt: new Date(),
    });

    return res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error inserting KYC data", error);
    return res.status(500).json({ message: "Failed to save KYC data" });
  }
}
