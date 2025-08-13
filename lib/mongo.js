import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
<<<<<<< HEAD
if (!uri) throw new Error("MONGODB_URI is missing in env");

const options = {};
let client;
let clientPromise;

=======
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

>>>>>>> refs/remotes/origin/main
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
<<<<<<< HEAD
=======

>>>>>>> refs/remotes/origin/main
clientPromise = global._mongoClientPromise;

export default clientPromise;
