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

  it('faz trim de espaços antes de mascarar IPv4', () => {
    expect(maskIp('  192.168.1.42  ', true)).toBe('192.168.*.*');
  });

  it('mascara IPv4 com octetos curtos', () => {
    expect(maskIp('1.2.3.4', true)).toBe('1.2.*.*');
  });

  it('preserva formas IPv6 comprimidas exóticas (poucos hextets)', () => {
    // '::1' e 'fe80::1' têm menos de 4 hextets reais após split — ficam intactos
    expect(maskIp('::1', true)).toBe('::1');
    expect(maskIp('fe80::1', true)).toBe('fe80::1');
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

  it('é case-insensitive contra IPv6', () => {
    expect(matchesIpFilter('fe80::1', 'FE80')).toBe(true);
    expect(matchesIpFilter('FE80::1', 'fe80')).toBe(true);
  });
});

describe('maskIp + matchesIpFilter — invariantes', () => {
  const ips = [
    '192.168.1.42',
    '192.168.1.99',
    '10.0.0.1',
    '172.16.0.1',
    'fe80::1',
  ];

  it('mascarar é cosmético: filtragem produz o mesmo subconjunto com toggle on/off', () => {
    const term = '192.168';
    const filteredOriginal = ips.filter((ip) => matchesIpFilter(ip, term));
    // Simula UI mascarada — o filtro continua recebendo o IP original
    ips.forEach((ip) => maskIp(ip, true));
    const filteredAfterMaskingDisplay = ips.filter((ip) =>
      matchesIpFilter(ip, term),
    );
    expect(filteredAfterMaskingDisplay).toEqual(filteredOriginal);
    expect(filteredOriginal).toEqual(['192.168.1.42', '192.168.1.99']);
  });

  it('substring que só existe no valor mascarado não casa nenhum IP original', () => {
    expect(ips.some((ip) => matchesIpFilter(ip, '*.*'))).toBe(false);
    expect(ips.some((ip) => matchesIpFilter(ip, '****'))).toBe(false);
  });
});
