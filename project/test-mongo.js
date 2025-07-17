// test-mongo.js
// Script para probar la conexión a MongoDB Atlas usando la URI y DB del .env
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function testConnection() {
  const client = new MongoClient(uri, { tls: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('✅ Conexión exitosa a MongoDB Atlas. Colecciones:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB Atlas:', err);
  } finally {
    await client.close();
  }
}

testConnection();
