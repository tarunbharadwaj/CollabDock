import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/collabdock'),
  MONGODB_DB_NAME: z.string().trim().min(1).default('collabdock'),
  MONGODB_DNS_SERVERS: z.string().optional(),
  USE_IN_MEMORY_DB: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
