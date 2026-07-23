import { describe, it, expect } from 'vitest';
import { maskIp, matchesIpFilter } from '../ip-mask';

describe('ip-mask', () => {
  it('retorna "-" para valores nulos/vazios', () => {
    expect(maskIp(null, true)).toBe('-');
    expect(maskIp(undefined, true)).toBe('-');
    expect(maskIp('', false)).toBe('-');
  });

  it('não mascara quando desabilitado', () => {
    expect(maskIp('192.168.0.1', false)).toBe('192.168.0.1');
  });

  it('mascara os dois últimos octetos de IPv4', () => {
    expect(maskIp('10.0.42.55', true)).toBe('10.0.*.*');
    expect(maskIp('  200.221.2.45  ', true)).toBe('200.221.*.*');
  });

  it('mascara os 4 últimos hextets de IPv6', () => {
    expect(maskIp('2804:14c:8b:9a:1:2:3:4', true)).toBe('2804:14c:8b:9a:****:****:****:****');
  });

  it('IPv6 exótico curto passa incolume', () => {
    expect(maskIp('::1', true)).toBe('::1');
  });

  it('hostname não é modificado', () => {
    expect(maskIp('servidor.local', true)).toBe('servidor.local');
  });

  it('matchesIpFilter respeita o IP original mesmo com máscara', () => {
    expect(matchesIpFilter('192.168.0.1', '192.168')).toBe(true);
    expect(matchesIpFilter('192.168.0.1', '10.')).toBe(false);
    expect(matchesIpFilter(null, 'x')).toBe(false);
    expect(matchesIpFilter('x', '')).toBe(true);
  });
});
