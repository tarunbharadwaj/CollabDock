import { firebaseAuth } from '../config/firebase.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
    const decoded = await firebaseAuth.verifyIdToken(header.slice(7));
    req.user = { uid: decoded.uid, email: decoded.email || '', name: decoded.name || '', admin: decoded.admin === true };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired session', 'UNAUTHENTICATED'));
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user?.admin) return next(new AppError(403, 'Administrator access required', 'ADMIN_REQUIRED'));
  return next();
}

export async function requireActiveAccount(req, _res, next) {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('accountStatus');
    if (user?.accountStatus === 'Suspended') throw new AppError(403, 'Your account has been suspended', 'ACCOUNT_SUSPENDED');
    if (user?.accountStatus === 'Deletion Pending') throw new AppError(403, 'Your account is being removed', 'ACCOUNT_DELETION_PENDING');
    next();
  } catch (error) {
    next(error);
  }
}
