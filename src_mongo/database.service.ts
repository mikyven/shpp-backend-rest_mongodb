import * as mongoDB from 'mongodb';
import * as dotenv from 'dotenv';

export const collections: { [key: string]: mongoDB.Collection } = {};

export async function connectToDatabase(): Promise<void> {
  dotenv.config();

  const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.MONGODB_CONNECT_STRING || '');
  await client.connect();

  const db: mongoDB.Db = client.db(process.env.DB_NAME);
  const itemsCollection: mongoDB.Collection = db.collection('items');
  const usersCollection: mongoDB.Collection = db.collection('users');

  collections.items = itemsCollection;
  collections.users = usersCollection;

  console.log(`Successfully connected to database: ${db.databaseName}`);
}
