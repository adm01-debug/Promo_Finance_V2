import { describe, it, expect } from 'vitest';
import {
  buildTermoAbertura,
  buildTermoEncerramento,
  dataPorExtenso,
  formatarDataIso,
  type TermoParams,
} from '../termos-livro';

const base: TermoParams = {
  tipoLivro: 'DIARIO',
  razaoSocial: 'Promo Brindes LTDA',
  cnpj: '00.000.000/0001-91',
  nire: '35123456789',
  orgaoRegistro: 'JUCESP',
  municipio: 'São Paulo',
  uf: 'SP',
  numeroLivro: 7,
  dataInicio: '2026-01-01',
  dataFim: '2026-12-31',
  totalPaginas: 42,
  contadorNome: 'Maria Silva',
  contadorCrc: '1SP123456/O-1',
  responsavelNome: 'João Souza',
};

describe('formatarDataIso', () => {
  it('converte ISO para dd/MM/yyyy', () => {
    expect(formatarDataIso('2026-03-05')).toBe('05/03/2026');
  });

  it('não altera entrada inválida', () => {
    expect(formatarDataIso('05/03/2026')).toBe('05/03/2026');
  });
});

describe('dataPorExtenso', () => {
  it('escreve o mês por extenso sem zero à esquerda no dia', () => {
    expect(dataPorExtenso('2026-03-05')).toBe('5 de março de 2026');
  });

  it('devolve a entrada quando o mês é inválido', () => {
    expect(dataPorExtenso('2026-13-05')).toBe('2026-13-05');
  });
});

describe('buildTermoAbertura', () => {
  it('inclui rótulo do livro, número, páginas e período', () => {
    const linhas = buildTermoAbertura(base).join('\n');
    expect(linhas).toContain('TERMO DE ABERTURA — LIVRO DIÁRIO Nº 7');
    expect(linhas).toContain('42 página(s)');
    expect(linhas).toContain('de 01/01/2026 a 31/12/2026');
    expect(linhas).toContain('NIRE nº 35123456789');
    expect(linhas).toContain('São Paulo/SP');
  });

  it('usa o rótulo de razão quando o livro é RAZAO', () => {
    const linhas = buildTermoAbertura({ ...base, tipoLivro: 'RAZAO' }).join('\n');
    expect(linhas).toContain('TERMO DE ABERTURA — LIVRO RAZÃO Nº 7');
  });

  it('omite NIRE e assinaturas quando não informados', () => {
    const linhas = buildTermoAbertura({
      ...base,
      nire: null,
      contadorNome: null,
      responsavelNome: null,
    }).join('\n');
    expect(linhas).not.toContain('NIRE');
    expect(linhas).not.toContain('Responsáveis:');
  });

  it('mantém a identificação mesmo sem razão social', () => {
    const linhas = buildTermoAbertura({ ...base, razaoSocial: '   ' }).join('\n');
    expect(linhas).toContain('empresa —,');
  });
});

describe('buildTermoEncerramento', () => {
  it('encerra com a data final por extenso e o município', () => {
    const linhas = buildTermoEncerramento(base);
    expect(linhas[0]).toBe('TERMO DE ENCERRAMENTO — LIVRO DIÁRIO Nº 7');
    expect(linhas.join('\n')).toContain('São Paulo, 31 de dezembro de 2026.');
  });

  it('lista contador com CRC', () => {
    expect(buildTermoEncerramento(base).join('\n')).toContain('Maria Silva — Contador(a) · CRC 1SP123456/O-1');
  });
});
