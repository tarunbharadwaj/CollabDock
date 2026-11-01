import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';

export function validateObjectIdParam(req, _res, next, value) {
  if (!mongoose.isObjectIdOrHexString(value)) {
    return next(new AppError(400, 'Invalid resource ID', 'INVALID_ID'));
  }
  return next();
}
