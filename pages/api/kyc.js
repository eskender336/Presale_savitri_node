import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'POST') {
    const { address, ...kyc } = req.body || {};
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const doc = {
      address: address.toLowerCase(),
      ...kyc,
      timestamp: Date.now(),
    };
    await db
      .collection('kyc')
      .updateOne({ address: doc.address }, { $set: doc }, { upsert: true });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const docs = await db.collection('kyc').find().toArray();
    const data = {};
    docs.forEach(({ address, _id, ...rest }) => {
      data[address] = rest;
    });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['POST', 'GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
