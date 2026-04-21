import { describe, it, expect } from 'vitest';
import { maskIp, matchesIpFilter } from '../ip-mask';

describe('maskIp', () => {
  it('mascara IPv4 nos dois últimos octetos', () => {
    expect(maskIp('192.168.1.42', true)).toBe('192.168.*.*');
    expect(maskIp('10.0.0.1', true)).toBe('10.0.*.*');
  });

  it('retorna IP original quando enabled = false', () => {
    expect(maskIp('192.168.1.42', false)).toBe('192.168.1.42');
  });

  it('mascara IPv6 nos 4 últimos hextets', () => {
    expect(maskIp('2001:db8:1234:5678:9abc:def0:1234:5678', true)).toBe(
      '2001:db8:1234:5678:****:****:****:****',
    );
  });

  it('retorna "-" para null/undefined/vazio', () => {
    expect(maskIp(null, true)).toBe('-');
    expect(maskIp(undefined, true)).toBe('-');
    expect(maskIp('', true)).toBe('-');
  });

  it('não mascara strings que não são IP reconhecível', () => {
    expect(maskIp('localhost', true)).toBe('localhost');
  });
});

describe('matchesIpFilter', () => {
  it('busca por substring no IP original', () => {
    expect(matchesIpFilter('192.168.1.42', '192.168')).toBe(true);
    expect(matchesIpFilter('192.168.1.42', '1.42')).toBe(true);
  });

  it('continua funcionando mesmo quando o IP estaria mascarado', () => {
    // O filtro recebe sempre o IP original, então busca "192.168.1" deve casar
    // mesmo se a UI mostrar "192.168.*.*"
    expect(matchesIpFilter('192.168.1.42', '192.168.1')).toBe(true);
  });

  it('termo vazio casa com qualquer coisa', () => {
    expect(matchesIpFilter('10.0.0.1', '')).toBe(true);
  });

  it('null não casa', () => {
    expect(matchesIpFilter(null, '10')).toBe(false);
  });
});
