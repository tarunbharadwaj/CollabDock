import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  await connectDatabase();
  app.listen(env.PORT, '0.0.0.0', () => console.log(`CollabDock API listening on 0.0.0.0:${env.PORT}`));
}

start().catch((error) => { console.error('Failed to start server', error); process.exit(1); });
