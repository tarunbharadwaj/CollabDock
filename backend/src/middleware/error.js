import { env } from '../config/env.js';

export function notFound(_req, res) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }); }

export function errorHandler(error, _req, res, _next) {
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  const safeMessage = status >= 500 ? 'Something went wrong' : error.message;
  if (status >= 500 && env.NODE_ENV !== 'test') console.error(error);
  res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: safeMessage } });
}
