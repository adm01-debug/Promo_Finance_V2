import { describe, expect, it } from 'vitest';
import {
  ORG_PAPEIS,
  avaliarAceiteConvite,
  calcularExpiracao,
  ehPapelOrg,
  emailValido,
  gerarTokenConvite,
  normalizarEmail,
  permiteRebaixarOuRemover,
  podeConcederPapel,
  resumirMembros,
  statusConvite,
  type MembroResumo,
  type OrgPapel,
} from '@/lib/organizacoes/convites';

const AGORA = new Date('2026-07-27T12:00:00.000Z');

const convite = (over: Partial<{ email_convidado: string; expira_em: string; utilizado_em: string | null }> = {}) => ({
  email_convidado: 'pessoa@empresa.com',
  expira_em: '2026-08-01T12:00:00.000Z',
  utilizado_em: null,
  ...over,
});

const membro = (papel: OrgPapel, ativo = true): MembroResumo => ({ papel_na_org: papel, ativo });

describe('convites: token e validade', () => {
  it('gera token hexadecimal de 64 caracteres', () => {
    const token = gerarTokenConvite();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('gera tokens distintos em 500 execuções (sem colisão)', () => {
    const tokens = new Set(Array.from({ length: 500 }, () => gerarTokenConvite()));
    expect(tokens.size).toBe(500);
  });

  it('respeita gerador determinístico injetado', () => {
    const token = gerarTokenConvite((b) => b.fill(255));
    expect(token).toBe('f'.repeat(64));
  });

  it('expira em 7 dias por padrão', () => {
    expect(calcularExpiracao(AGORA).toISOString()).toBe('2026-08-03T12:00:00.000Z');
  });
});

describe('convites: normalização e validação de e-mail', () => {
  it.each([
    ['  Pessoa@Empresa.COM  ', 'pessoa@empresa.com'],
    ['a@b.co', 'a@b.co'],
  ])('normaliza %s', (entrada, esperado) => {
    expect(normalizarEmail(entrada)).toBe(esperado);
  });

  it.each(['pessoa@empresa.com.br', 'a.b+c@dominio.io'])('aceita %s', (email) => {
    expect(emailValido(email)).toBe(true);
  });

  it.each(['', 'sem-arroba', 'a@b', 'a@b.c', 'com espaco@b.com', `${'x'.repeat(250)}@b.com`])(
    'rejeita %s',
    (email) => {
      expect(emailValido(email)).toBe(false);
    },
  );
});

describe('convites: status e aceite', () => {
  it('classifica pendente, utilizado e expirado', () => {
    expect(statusConvite(convite(), AGORA)).toBe('PENDENTE');
    expect(statusConvite(convite({ utilizado_em: '2026-07-01T00:00:00Z' }), AGORA)).toBe('UTILIZADO');
    expect(statusConvite(convite({ expira_em: '2026-07-01T00:00:00Z' }), AGORA)).toBe('EXPIRADO');
  });

  it('trata data inválida como expirada (fail-closed)', () => {
    expect(statusConvite(convite({ expira_em: 'data-ruim' }), AGORA)).toBe('EXPIRADO');
  });

  it('aceita quando e-mail bate, ignorando caixa e espaços', () => {
    expect(avaliarAceiteConvite(convite(), '  Pessoa@Empresa.com ', AGORA)).toEqual({
      aceitavel: true,
    });
  });

  it.each([
    [null, 'pessoa@empresa.com', 'CONVITE_INEXISTENTE'],
    [convite({ utilizado_em: '2026-07-02T00:00:00Z' }), 'pessoa@empresa.com', 'CONVITE_UTILIZADO'],
    [convite({ expira_em: '2026-07-02T00:00:00Z' }), 'pessoa@empresa.com', 'CONVITE_EXPIRADO'],
    [convite(), 'outra@empresa.com', 'EMAIL_DIVERGENTE'],
    [convite(), null, 'EMAIL_DIVERGENTE'],
  ])('recusa com motivo correto (%#)', (dados, email, motivo) => {
    const resultado = avaliarAceiteConvite(dados, email, AGORA);
    expect(resultado.aceitavel).toBe(false);
    if (!resultado.aceitavel) expect(resultado.motivo).toBe(motivo);
  });

  it('expiração exatamente no instante atual é considerada expirada', () => {
    expect(statusConvite(convite({ expira_em: AGORA.toISOString() }), AGORA)).toBe('EXPIRADO');
  });
});

describe('convites: hierarquia de papéis', () => {
  it('nunca concede RESPONSAVEL', () => {
    for (const papel of ORG_PAPEIS) {
      expect(podeConcederPapel(papel, 'RESPONSAVEL')).toBe(false);
    }
  });

  it('responsável concede qualquer papel abaixo', () => {
    expect(podeConcederPapel('RESPONSAVEL', 'ADMIN')).toBe(true);
    expect(podeConcederPapel('RESPONSAVEL', 'LEITOR')).toBe(true);
  });

  it('admin concede até admin; membro e leitor não concedem nada', () => {
    expect(podeConcederPapel('ADMIN', 'ADMIN')).toBe(true);
    expect(podeConcederPapel('ADMIN', 'MEMBRO')).toBe(true);
    expect(podeConcederPapel('MEMBRO', 'LEITOR')).toBe(false);
    expect(podeConcederPapel('LEITOR', 'LEITOR')).toBe(false);
  });

  it('valida guarda de tipo de papel', () => {
    expect(ehPapelOrg('ADMIN')).toBe(true);
    expect(ehPapelOrg('SUPER')).toBe(false);
    expect(ehPapelOrg(null)).toBe(false);
  });
});

describe('convites: resumo e guarda de gestor', () => {
  it('resume totais e contagem por papel considerando apenas ativos', () => {
    const resumo = resumirMembros([
      membro('RESPONSAVEL'),
      membro('ADMIN'),
      membro('MEMBRO'),
      membro('LEITOR', false),
    ]);
    expect(resumo).toEqual({
      total: 4,
      ativos: 3,
      inativos: 1,
      porPapel: { RESPONSAVEL: 1, ADMIN: 1, MEMBRO: 1, LEITOR: 0 },
    });
  });

  it('bloqueia remoção do último gestor ativo', () => {
    const alvo = membro('RESPONSAVEL');
    expect(permiteRebaixarOuRemover([alvo, membro('MEMBRO')], alvo, null)).toBe(false);
    expect(permiteRebaixarOuRemover([alvo, membro('MEMBRO')], alvo, 'LEITOR')).toBe(false);
  });

  it('permite quando existe outro gestor ativo', () => {
    const alvo = membro('ADMIN');
    expect(permiteRebaixarOuRemover([alvo, membro('RESPONSAVEL')], alvo, null)).toBe(true);
  });

  it('não bloqueia alterações de não gestores nem de gestores inativos', () => {
    const leitor = membro('LEITOR');
    expect(permiteRebaixarOuRemover([leitor, membro('RESPONSAVEL')], leitor, null)).toBe(true);
    const adminInativo = membro('ADMIN', false);
    expect(permiteRebaixarOuRemover([adminInativo], adminInativo, null)).toBe(true);
  });
});

describe('convites: fuzzing determinístico (600 cenários)', () => {
  it('nunca aceita convite utilizado, expirado ou de outro e-mail', () => {
    let semente = 42;
    const proximo = () => {
      semente = (semente * 1664525 + 1013904223) % 4294967296;
      return semente / 4294967296;
    };

    for (let i = 0; i < 600; i += 1) {
      const utilizado = proximo() < 0.3;
      const deltaDias = Math.round((proximo() - 0.5) * 20);
      const mesmoEmail = proximo() < 0.5;
      const alvo = convite({
        utilizado_em: utilizado ? '2026-07-01T00:00:00Z' : null,
        expira_em: calcularExpiracao(AGORA, deltaDias).toISOString(),
      });
      const email = mesmoEmail ? 'PESSOA@empresa.com' : 'intruso@empresa.com';
      const resultado = avaliarAceiteConvite(alvo, email, AGORA);

      if (resultado.aceitavel) {
        expect(utilizado).toBe(false);
        expect(deltaDias).toBeGreaterThan(0);
        expect(mesmoEmail).toBe(true);
      }
    }
  });
});
