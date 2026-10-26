import { Collaboration } from '../models/Collaboration.js';
import { Deliverable } from '../models/Deliverable.js';
import { AppError } from '../utils/errors.js';
import { assertId } from './collaborationController.js';

export async function addDeliverable(req, res) {
  assertId(req.params.id);
  const exists = await Collaboration.exists({ _id: req.params.id, ownerUid: req.user.uid });
  if (!exists) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  const item = await Deliverable.create({ ...req.body, collaboration: req.params.id, ownerUid: req.user.uid });
  res.status(201).json({ data: item });
}
export async function updateDeliverable(req, res) {
  assertId(req.params.id);
  const item = await Deliverable.findOneAndUpdate({ _id: req.params.id, ownerUid: req.user.uid }, req.body, { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Deliverable not found', 'NOT_FOUND');
  res.json({ data: item });
}
export async function deleteDeliverable(req, res) {
  assertId(req.params.id);
  const item = await Deliverable.findOneAndDelete({ _id: req.params.id, ownerUid: req.user.uid });
  if (!item) throw new AppError(404, 'Deliverable not found', 'NOT_FOUND');
  res.status(204).send();
}
