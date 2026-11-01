import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './navigation';

describe('safeReturnPath', () => {
  it('accepts routes inside an allowed application area', () => {
    expect(safeReturnPath('/app/invoices?status=issued#latest', '/app', ['/app'])).toBe('/app/invoices?status=issued#latest');
  });

  it('rejects external, protocol-relative, and unrelated destinations', () => {
    expect(safeReturnPath('https://example.com', '/app', ['/app'])).toBe('/app');
    expect(safeReturnPath('//example.com', '/app', ['/app'])).toBe('/app');
    expect(safeReturnPath('/admin', '/app', ['/app'])).toBe('/app');
    expect(safeReturnPath('/app\\example.com', '/app', ['/app'])).toBe('/app');
  });
});
