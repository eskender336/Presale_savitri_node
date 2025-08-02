import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const dbName = client.options.dbName || process.env.MONGODB_DB || 'kycdb';
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
