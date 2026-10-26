import { firebaseAuth } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
    const decoded = await firebaseAuth.verifyIdToken(header.slice(7));
    req.user = { uid: decoded.uid, email: decoded.email || '', name: decoded.name || '' };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired session', 'UNAUTHENTICATED'));
  }
}
