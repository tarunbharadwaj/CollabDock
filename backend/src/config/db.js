import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { Collaboration } from '../models/Collaboration.js';

let developmentMemoryServer;

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  let uri = env.MONGODB_URI;
  if (uri.startsWith('mongodb+srv://') && env.MONGODB_DNS_SERVERS) {
    const dnsServers = env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean);
    if (dnsServers.length) {
      dns.setServers(dnsServers);
      console.log('Custom MongoDB DNS resolver configured');
    }
  }
  if (env.USE_IN_MEMORY_DB) {
    if (env.NODE_ENV === 'production') throw new Error('USE_IN_MEMORY_DB cannot be enabled in production');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    developmentMemoryServer = await MongoMemoryServer.create({ instance: { dbName: 'collabdock' } });
    uri = developmentMemoryServer.getUri();
    console.log('Development in-memory MongoDB started');
  }
  await mongoose.connect(uri, { dbName: env.MONGODB_DB_NAME, serverSelectionTimeoutMS: 10000 });
  const normalized = await Collaboration.updateMany(
    {
      dealValuePaisa: { $gt: 0 },
      status: { $ne: 'Completed' },
      $expr: { $gte: ['$receivedPaisa', '$dealValuePaisa'] },
    },
    { $set: { status: 'Completed' } },
  );
  if (normalized.modifiedCount) console.log(`Normalized ${normalized.modifiedCount} fully paid collaboration status records`);
  console.log(`MongoDB connected to ${mongoose.connection.name}`);
}
