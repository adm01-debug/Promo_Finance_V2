import { describe, it, expect } from 'vitest';
import { parseBulkCsv, parseBulkJson, exportBulkResultsCsv } from '../sandbox-csv';
import type { BulkResult } from '../sandbox-bulk-runner';

describe('parseBulkCsv', () => {
  it('parse cabeçalho + groups com pipe', () => {
    const csv = 'email,name,groups\nalice@x.com,Alice,Admins|Todos\nbob@x.com,Bob,';
    const { users, errors } = parseBulkCsv(csv);
    expect(errors).toEqual([]);
    expect(users).toHaveLength(2);
    expect(users[0].claims).toEqual({ email: 'alice@x.com', name: 'Alice', groups: ['Admins', 'Todos'] });
    expect(users[1].claims).toEqual({ email: 'bob@x.com', name: 'Bob', groups: [] });
  });

  it('detecta delimitador ;', () => {
    const csv = 'email;name;groups\nalice@x.com;Alice;Admins';
    const { users, errors } = parseBulkCsv(csv);
    expect(errors).toEqual([]);
    expect(users[0].claims.email).toBe('alice@x.com');
  });

  it('reporta erro quando faltam colunas', () => {
    const csv = 'email,name,groups\nalice@x.com,Alice';
    const { errors } = parseBulkCsv(csv);
    expect(errors[0].line).toBe(2);
  });

  it('exige coluna email', () => {
    const csv = 'foo,bar\n1,2';
    const { errors } = parseBulkCsv(csv);
    expect(errors[0].message).toMatch(/email/);
  });

  it('respeita aspas e BOM', () => {
    const csv = '\uFEFFemail,name\n"a@x.com","Silva, Ana"';
    const { users, errors } = parseBulkCsv(csv);
    expect(errors).toEqual([]);
    expect(users[0].claims.name).toBe('Silva, Ana');
  });
});

describe('parseBulkJson', () => {
  it('aceita array de objetos', () => {
    const { users, errors } = parseBulkJson('[{"email":"a@x.com"},{"email":"b@x.com"}]');
    expect(errors).toEqual([]);
    expect(users).toHaveLength(2);
    expect(users[0].row).toBe(1);
  });

  it('rejeita não-array', () => {
    const { errors } = parseBulkJson('{"email":"a@x.com"}');
    expect(errors[0].message).toMatch(/array/);
  });

  it('rejeita JSON inválido', () => {
    const { errors } = parseBulkJson('{not json');
    expect(errors[0].message).toMatch(/JSON/);
  });
});

describe('exportBulkResultsCsv', () => {
  it('inclui BOM e cabeçalho', () => {
    const results: BulkResult[] = [{
      row: 1,
      claims: { email: 'a@x.com' },
      outcome: 'seria_jit',
      reason: null,
      result: {
        success: true,
        errors: [],
        preview: {
          email: 'a***@x.com',
          full_name: 'A',
          groups: ['Admins'],
          domain: 'x.com',
          domain_allowed: true,
          resolved_role: 'admin',
          matched_group: 'Admins',
          user_exists: false,
          would_jit_provision: true,
          provision_blocked_reason: null,
          provider_nome: null,
          auto_provision_users: true,
        },
      },
    }];
    const csv = exportBulkResultsCsv(results);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('email_mascarado');
    expect(csv).toContain('a***@x.com');
    expect(csv).toContain('seria_jit');
  });
});
