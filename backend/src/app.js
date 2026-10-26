import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = env.FRONTEND_URL.split(',').map((item) => item.trim());
app.use(cors({
  origin(origin, callback) {
    const localDevelopmentOrigin = env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.includes(origin) || localDevelopmentOrigin) return callback(null, true);
    return callback(null, false);
  },
  credentials: false,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use(express.json({ limit: '250kb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { skip: (req) => req.path === '/api/v1/health' }));
app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);
