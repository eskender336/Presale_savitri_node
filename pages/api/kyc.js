import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'kyc');
    const { fullName, email, country, documentType, documentNumber } = req.body;

    await db.collection('kyc_submissions').insertOne({
      fullName,
      email,
      country,
      documentType,
      documentNumber,
      createdAt: new Date(),
    });

    return res.status(200).json({ message: 'KYC data stored' });
  } catch (error) {
    console.error('Error saving KYC:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
