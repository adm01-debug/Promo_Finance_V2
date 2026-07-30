/**
 * Testes do motor de recomendação de empresa.
 */
import { describe, it, expect } from 'vitest';
import {
  recomendarEmpresa,
  pontuarEmpresa,
  type EmpresaCandidata,
  type ContextoOperacao,
} from '../recomendar-empresa';

const lucroReal: EmpresaCandidata = {
  id: 'lr-1',
  nome: 'Holding LR',
  cnpj: '11.111.111/0001-11',
  regime: 'lucro_real',
  creditoIcms: 5_000,
  ativa: true,
};

const simples: EmpresaCandidata = {
  id: 'sn-1',
  nome: 'Operadora SN',
  cnpj: '22.222.222/0001-22',
  regime: 'simples_nacional',
  rbt12: 2_000_000,
  ativa: true,
};

const presumido: EmpresaCandidata = {
  id: 'lp-1',
  nome: 'Comercial LP',
  cnpj: '33.333.333/0001-33',
  regime: 'lucro_presumido',
  ativa: true,
};

describe('recomendarEmpresa', () => {
  it('prioriza Simples para venda de serviço pequeno', () => {
    const ctx: ContextoOperacao = { tipo: 'venda_servico', valor: 5_000 };
    const ranking = recomendarEmpresa([lucroReal, simples, presumido], ctx);
    expect(ranking[0].empresaId).toBe('sn-1');
  });

  it('prioriza Lucro Real para compra de produto com crédito ICMS', () => {
    const ctx: ContextoOperacao = { tipo: 'compra_produto', valor: 100_000 };
    const ranking = recomendarEmpresa([lucroReal, simples, presumido], ctx);
    expect(['lr-1', 'lp-1']).toContain(ranking[0].empresaId);
    const sn = ranking.find((r) => r.empresaId === 'sn-1')!;
    expect(sn.alertas.join(' ')).toMatch(/Simples Nacional não permite crédito/);
  });

  it('alerta quando operação estoura limite do Simples', () => {
    const grandeSimples: EmpresaCandidata = { ...simples, rbt12: 4_700_000 };
    const ctx: ContextoOperacao = { tipo: 'venda_produto', valor: 500_000 };
    const [rec] = recomendarEmpresa([grandeSimples], ctx);
    expect(rec.score).toBeLessThan(30);
    expect(rec.alertas.some((a) => /desenquadramento/i.test(a))).toBe(true);
  });

  it('penaliza empresa inativa com score zero', () => {
    const inativa: EmpresaCandidata = { ...lucroReal, ativa: false };
    const rec = pontuarEmpresa(inativa, { tipo: 'venda_produto', valor: 1000 });
    expect(rec.score).toBe(0);
  });

  it('considera histórico de continuidade com contraparte', () => {
    const ctx: ContextoOperacao = {
      tipo: 'venda_produto',
      valor: 10_000,
      contraparteId: 'cli-99',
      historico: { 'cli-99': 'lp-1' },
    };
    const ranking = recomendarEmpresa([lucroReal, presumido], ctx);
    expect(ranking[0].empresaId).toBe('lp-1');
    expect(ranking[0].motivos.some((m) => /histórico/i.test(m))).toBe(true);
  });

  it('retorna ranking estável e não muta entrada', () => {
    const entrada = [lucroReal, simples];
    const snapshot = JSON.stringify(entrada);
    recomendarEmpresa(entrada, { tipo: 'venda_produto', valor: 100 });
    expect(JSON.stringify(entrada)).toBe(snapshot);
  });
});
