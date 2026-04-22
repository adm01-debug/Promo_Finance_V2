import { describe, it, expect } from 'vitest';
import { validateSSOConfig, summarizeIssues, type SSOConfigInput } from '../consistency';

const baseValid: SSOConfigInput = {
  preset: 'azure',
  claim_mapping: { email: 'email', full_name: 'name', groups: 'groups' },
  allowed_domains: ['empresa.com.br'],
  role_mappings: [
    { idp_group: 'Admins-Financeiro', app_role: 'admin' },
    { idp_group: 'Todos-Funcionarios', app_role: 'visualizador' },
  ],
  default_role: 'visualizador',
  auto_provision_users: true,
  force_sso_for_domains: false,
};

const ids = (cfg: SSOConfigInput) => validateSSOConfig(cfg).map((i) => i.id);

describe('validateSSOConfig — happy path', () => {
  it('configuração consistente: nenhum issue', () => {
    expect(ids(baseValid)).toEqual([]);
  });

  it('summarizeIssues: hasBlocker=false quando sem erros', () => {
    const s = summarizeIssues(validateSSOConfig(baseValid));
    expect(s.hasBlocker).toBe(false);
    expect(s.total).toBe(0);
  });
});

describe('claim_mapping', () => {
  it('cm.email.missing quando email vazio', () => {
    expect(ids({ ...baseValid, claim_mapping: { email: '', full_name: 'name', groups: 'groups' } }))
      .toContain('cm.email.missing');
  });

  it('cm.email.unknown_for_preset em azure com claim atípica', () => {
    expect(ids({ ...baseValid, claim_mapping: { email: 'mail', full_name: 'name', groups: 'groups' } }))
      .toContain('cm.email.unknown_for_preset');
  });

  it('cm.groups.unused quando groups definido sem mappings', () => {
    expect(ids({ ...baseValid, role_mappings: [] })).toContain('cm.groups.unused');
  });
});

describe('allowed_domains', () => {
  it('dom.invalid quando domínio sem ponto', () => {
    expect(ids({ ...baseValid, allowed_domains: ['empresa'] })).toContain('dom.invalid');
  });

  it('dom.duplicate quando repetido', () => {
    expect(ids({ ...baseValid, allowed_domains: ['empresa.com', 'empresa.com'] })).toContain('dom.duplicate');
  });

  it('dom.case_or_whitespace quando tem maiúscula/espaço', () => {
    expect(ids({ ...baseValid, allowed_domains: [' Empresa.com '] })).toContain('dom.case_or_whitespace');
  });

  it('dom.empty_with_jit quando JIT ligado e sem domínios', () => {
    expect(ids({ ...baseValid, allowed_domains: [], auto_provision_users: true }))
      .toContain('dom.empty_with_jit');
  });

  it('dom.force_without_domains quando force ligado e sem domínios', () => {
    expect(ids({ ...baseValid, allowed_domains: [], auto_provision_users: false, force_sso_for_domains: true }))
      .toContain('dom.force_without_domains');
  });
});

describe('role_mappings', () => {
  it('rm.empty_group quando idp_group em branco', () => {
    expect(ids({ ...baseValid, role_mappings: [{ idp_group: '', app_role: 'visualizador' }] }))
      .toContain('rm.empty_group');
  });

  it('rm.duplicate_group quando mesmo grupo 2x', () => {
    expect(ids({
      ...baseValid,
      role_mappings: [
        { idp_group: 'X', app_role: 'visualizador' },
        { idp_group: 'X', app_role: 'financeiro' },
      ],
    })).toContain('rm.duplicate_group');
  });

  it('rm.unknown_role quando papel inválido', () => {
    expect(ids({
      ...baseValid,
      role_mappings: [{ idp_group: 'X', app_role: 'super-root' }],
    })).toContain('rm.unknown_role');
  });

  it('rm.coverage_missing quando preset azure sem grupos típicos', () => {
    expect(ids({
      ...baseValid,
      role_mappings: [{ idp_group: 'Custom', app_role: 'visualizador' }],
    })).toContain('rm.coverage_missing');
  });

  it('rm.no_admin_route quando nenhum mapping resolve admin', () => {
    expect(ids(baseValid)).toContain('rm.no_admin_route');
  });
});

describe('default_role', () => {
  it('default.missing quando vazio', () => {
    expect(ids({ ...baseValid, default_role: '' })).toContain('default.missing');
  });

  it('default.unknown quando fora do enum', () => {
    expect(ids({ ...baseValid, default_role: 'root' })).toContain('default.unknown');
  });

  it('default.privileged quando admin/financeiro', () => {
    expect(ids({ ...baseValid, default_role: 'admin' })).toContain('default.privileged');
  });
});

describe('global', () => {
  it('global.no_routes quando 0 mappings + default privilegiado', () => {
    const result = ids({ ...baseValid, role_mappings: [], default_role: 'admin' });
    expect(result).toContain('global.no_routes');
  });
});
