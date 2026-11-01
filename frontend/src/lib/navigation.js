export function safeReturnPath(value, fallback, allowedRoots) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  const path = value.split(/[?#]/, 1)[0];
  const allowed = allowedRoots.some((root) => path === root || path.startsWith(`${root}/`));
  return allowed ? value : fallback;
}
