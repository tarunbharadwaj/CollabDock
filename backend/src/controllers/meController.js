import { User } from '../models/User.js';

export async function getMe(req, res) {
  const user = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { $setOnInsert: { uid: req.user.uid, email: req.user.email, displayName: req.user.name } },
    { new: true, upsert: true },
  );
  res.json({ data: user });
}

export async function updateMe(req, res) {
  const user = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { $set: req.body, $setOnInsert: { uid: req.user.uid, email: req.user.email } },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ data: user });
}
