import { firebaseAuth } from '../config/firebase.js';

const [action, email] = process.argv.slice(2);

if (!['grant', 'revoke'].includes(action) || !email) {
  console.error('Usage: node src/scripts/setAdminClaim.js grant|revoke admin@example.com');
  process.exit(1);
}

try {
  const user = await firebaseAuth.getUserByEmail(email);
  const claims = { ...(user.customClaims || {}) };
  if (action === 'grant') claims.admin = true;
  else delete claims.admin;
  await firebaseAuth.setCustomUserClaims(user.uid, claims);
  await firebaseAuth.revokeRefreshTokens(user.uid);
  console.log(`Administrator access ${action === 'grant' ? 'granted to' : 'revoked from'} ${email}. Sign in again to refresh the session.`);
  process.exit(0);
} catch (error) {
  console.error('Unable to update administrator access:', error.message);
  process.exit(1);
}
