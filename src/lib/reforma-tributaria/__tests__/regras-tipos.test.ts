import { describe, it, expect } from 'vitest';
import {
  CRONOGRAMA_OFICIAL,
  obterLinhaCronograma,
  type LinhaCronograma,
} from '../cronograma-oficial';
import { REF_IBS } from '@/config/reforma-tributaria';

describe('LinhaCronograma — shape e campos obrigatórios (etapa 13)', () => {
  const CAMPOS_OBRIGATORIOS: (keyof LinhaCronograma)[] = [
    'ano',
    'cbs',
    'ibsUf',
    'ibsMun',
    'icmsResidual',
    'issResidual',
    'pisResidual',
    'cofinsResidual',
    'origem',
    'fundamento',
  ];

  it('todos os 10 campos obrigatórios presentes em cada linha', () => {
    for (const linha of CRONOGRAMA_OFICIAL) {
      for (const campo of CAMPOS_OBRIGATORIOS) {
        expect(linha, `ano ${linha.ano} falta campo "${campo}"`).toHaveProperty(campo);
      }
    }
  });

  it('cobertura: há linhas para cada ano de 2026 a 2033', () => {
    const anos = CRONOGRAMA_OFICIAL.map((l) => l.ano);
    for (let ano = 2026; ano <= 2033; ano++) {
      expect(anos, `falta linha para o ano ${ano}`).toContain(ano);
    }
  });

  it('2026 — ibsMun=0 (ano-teste, art. 343 LC 214/2025)', () => {
    const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === 2026);
    expect(linha).toBeDefined();
    expect(linha!.ibsMun).toBe(0);
    expect(linha!.ibsUf).toBeCloseTo(0.1, 5);
  });

  it('2027 e 2028 — ibsUf === ibsMun (split 50/50 UF/Mun)', () => {
    for (const ano of [2027, 2028]) {
      const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === ano);
      expect(linha, `linha ${ano} não encontrada`).toBeDefined();
      expect(linha!.ibsUf).toBeCloseTo(linha!.ibsMun, 10);
    }
  });

  it('2033 — residuais zerados (regime pleno, ADCT EC 132/2023)', () => {
    const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === 2033);
    expect(linha).toBeDefined();
    expect(linha!.icmsResidual).toBe(0);
    expect(linha!.issResidual).toBe(0);
    expect(linha!.pisResidual).toBe(0);
    expect(linha!.cofinsResidual).toBe(0);
  });

  it('2033 — ibsUf + ibsMun === REF_IBS (regime pleno)', () => {
    const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === 2033);
    expect(linha).toBeDefined();
    expect(linha!.ibsUf + linha!.ibsMun).toBeCloseTo(REF_IBS, 10);
  });

  it('2029-2032 — ICMS residuais decrescentes: 90/80/70/60', () => {
    const esperados: Record<number, number> = { 2029: 90, 2030: 80, 2031: 70, 2032: 60 };
    for (const [anoStr, residual] of Object.entries(esperados)) {
      const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === Number(anoStr));
      expect(linha, `linha ${anoStr} não encontrada`).toBeDefined();
      expect(linha!.icmsResidual).toBe(residual);
    }
  });

  it('2029-2032 — frações IBS são 10/20/30/40% de REF_IBS (ibsUf+ibsMun)', () => {
    const fracoes: Record<number, number> = { 2029: 0.1, 2030: 0.2, 2031: 0.3, 2032: 0.4 };
    for (const [anoStr, fracao] of Object.entries(fracoes)) {
      const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === Number(anoStr));
      expect(linha, `linha ${anoStr} não encontrada`).toBeDefined();
      const ibsTotal = linha!.ibsUf + linha!.ibsMun;
      expect(ibsTotal).toBeCloseTo(REF_IBS * fracao, 10);
    }
  });

  it('2029-2032 — PIS e COFINS zerados (substituídos por CBS)', () => {
    for (let ano = 2029; ano <= 2032; ano++) {
      const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === ano);
      expect(linha, `linha ${ano} não encontrada`).toBeDefined();
      expect(linha!.pisResidual).toBe(0);
      expect(linha!.cofinsResidual).toBe(0);
    }
  });

  it('origem — cada linha tem valor válido (lei | simulado)', () => {
    const validos = new Set<string>(['lei', 'simulado']);
    for (const linha of CRONOGRAMA_OFICIAL) {
      expect(
        validos.has(linha.origem),
        `ano ${linha.ano} tem origem inválida: "${linha.origem}"`
      ).toBe(true);
    }
  });

  it('2026 — origem lei (alíquota definida em texto de lei)', () => {
    const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === 2026);
    expect(linha).toBeDefined();
    expect(linha!.origem).toBe('lei');
  });
});

describe('obterLinhaCronograma — boundary', () => {
  it('ano < 2026 — cbs, ibsUf e ibsMun retornam 0', () => {
    const linha = obterLinhaCronograma(2025);
    expect(linha.cbs).toBe(0);
    expect(linha.ibsUf).toBe(0);
    expect(linha.ibsMun).toBe(0);
  });

  it('ano < 2026 — residuais de ICMS/ISS/PIS/COFINS retornam 100', () => {
    const linha = obterLinhaCronograma(2024);
    expect(linha.icmsResidual).toBe(100);
    expect(linha.issResidual).toBe(100);
    expect(linha.pisResidual).toBe(100);
    expect(linha.cofinsResidual).toBe(100);
  });

  it('ano > 2033 — retorna regime pleno (ibsUf+ibsMun===REF_IBS, residuais=0)', () => {
    const linha = obterLinhaCronograma(2040);
    expect(linha.ibsUf + linha.ibsMun).toBeCloseTo(REF_IBS, 10);
    expect(linha.icmsResidual).toBe(0);
    expect(linha.issResidual).toBe(0);
  });

  it('ano dentro do cronograma retorna linha exata', () => {
    const linha = obterLinhaCronograma(2026);
    expect(linha.ano).toBe(2026);
    expect(linha.ibsMun).toBe(0);
  });
});
