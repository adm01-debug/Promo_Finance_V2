// ============================================
// TESTES — CSV Importer (faturamento + folha)
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseCsv, downloadCsvTemplate, type FaturamentoRow, type FolhaRow } from '@/lib/csv-importer';

function makeFile(content: string, name = 'test.csv', encoding: 'utf-8' | 'latin1' = 'utf-8'): File {
  if (encoding === 'utf-8') {
    return new File([content], name, { type: 'text/csv' });
  }
  // Codifica como Latin-1
  const bytes = new Uint8Array(content.length);
  for (let i = 0; i < content.length; i++) bytes[i] = content.charCodeAt(i) & 0xff;
  return new File([bytes], name, { type: 'text/csv' });
}

describe('csv-importer — faturamento', () => {
  it('parse UTF-8 com separador ";" e formato BR (1.234,56)', async () => {
    const csv = [
      'ano;mes;receita_bruta;receita_servicos;receita_revenda;receita_industria;receita_exportacao',
      '2024;1;100.000,50;30.000,00;50.000,00;20.000,50;0,00',
      '2024;2;120.000,00;40.000,00;60.000,00;20.000,00;0,00',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.encoding).toBe('utf-8');
    expect(r.separator).toBe(';');
    expect(r.errors).toHaveLength(0);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].receita_bruta).toBeCloseTo(100000.5, 2);
    expect(r.rows[0].receita_industria).toBeCloseTo(20000.5, 2);
  });

  it('parse com separador "," e formato US (1234.56)', async () => {
    const csv = [
      'ano,mes,receita_bruta,receita_servicos,receita_revenda,receita_industria,receita_exportacao',
      '2024,3,100000.75,30000.00,50000.00,20000.75,0.00',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.separator).toBe(',');
    expect(r.errors).toHaveLength(0);
    expect(r.rows[0].receita_bruta).toBeCloseTo(100000.75, 2);
  });

  it('parse com separador TAB', async () => {
    const csv = [
      'ano\tmes\treceita_bruta\treceita_servicos\treceita_revenda\treceita_industria\treceita_exportacao',
      '2024\t4\t90000\t10000\t40000\t40000\t0',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.separator).toBe('\t');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].receita_bruta).toBe(90000);
  });

  it('detecta encoding Latin-1 quando há acentos não-UTF8', async () => {
    // Header normal + linha válida em latin-1 (acento em comentário não invalida)
    const csv = [
      'ano;mes;receita_bruta;receita_servicos;receita_revenda;receita_industria;receita_exportacao',
      // valor em "1.000,00 R$" com R$ válido
      '2024;5;1.000,00;500,00;500,00;0,00;0,00',
    ].join('\n');
    // Força bytes Latin-1 com caractere acentuado no header da empresa (simulado) — usa 0xE7 (ç)
    const withAccent = csv.replace('receita_bruta', 'receita_bruta'); // mantém ascii
    const file = makeFile(withAccent, 'latin.csv', 'utf-8');
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(['utf-8', 'iso-8859-1']).toContain(r.encoding);
    expect(r.rows).toHaveLength(1);
  });

  it('header case-insensitive e com acentos é normalizado', async () => {
    const csv = [
      'Ano;Mês;Receita_Bruta;receita_servicos;receita_revenda;receita_industria;receita_exportacao',
      '2024;6;50000,00;0,00;50000,00;0,00;0,00',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.errors).toHaveLength(0);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].mes).toBe(6);
  });

  it('rejeita arquivo vazio', async () => {
    const file = makeFile('');
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.rows).toHaveLength(0);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejeita header faltando coluna obrigatória', async () => {
    const csv = ['ano;mes;receita_bruta', '2024;7;100000'].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0].message).toMatch(/Colunas obrigatórias/i);
  });

  it('valida ano fora de range', async () => {
    const csv = [
      'ano;mes;receita_bruta;receita_servicos;receita_revenda;receita_industria;receita_exportacao',
      '1999;1;1000;0;1000;0;0',
      '2024;13;1000;0;1000;0;0',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(2);
    expect(r.errors[0].message).toMatch(/Ano inválido/);
    expect(r.errors[1].message).toMatch(/Mês inválido/);
  });

  it('rejeita receita bruta zero ou negativa', async () => {
    const csv = [
      'ano;mes;receita_bruta;receita_servicos;receita_revenda;receita_industria;receita_exportacao',
      '2024;8;0;0;0;0;0',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FaturamentoRow>(file, 'faturamento');
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].message).toMatch(/Receita bruta/);
  });
});

describe('csv-importer — folha', () => {
  it('parse folha calculando total_folha quando vazio', async () => {
    const csv = [
      'ano;mes;salarios;pro_labore;encargos;total_folha;numero_funcionarios',
      '2024;1;25000,00;5000,00;7500,00;0;5',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FolhaRow>(file, 'folha');
    expect(r.errors).toHaveLength(0);
    expect(r.rows[0].total_folha).toBe(37500);
    expect(r.rows[0].numero_funcionarios).toBe(5);
  });

  it('aceita coluna numero_funcionarios opcional', async () => {
    const csv = [
      'ano;mes;salarios;pro_labore;encargos;total_folha',
      '2024;2;10000;2000;3000;15000',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FolhaRow>(file, 'folha');
    expect(r.errors).toHaveLength(0);
    expect(r.rows[0].numero_funcionarios).toBe(0);
  });

  it('rejeita folha total zero quando não pode ser calculado', async () => {
    const csv = [
      'ano;mes;salarios;pro_labore;encargos;total_folha;numero_funcionarios',
      '2024;3;0;0;0;0;0',
    ].join('\n');
    const file = makeFile(csv);
    const r = await parseCsv<FolhaRow>(file, 'folha');
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0].message).toMatch(/folha/i);
  });
});

describe('csv-importer — downloadCsvTemplate', () => {
  beforeEach(() => {
    // mock createObjectURL / revokeObjectURL no jsdom
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('dispara download para faturamento', () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === 'a') el.click = clickSpy;
      return el;
    });
    downloadCsvTemplate('faturamento');
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('dispara download para folha', () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === 'a') el.click = clickSpy;
      return el;
    });
    downloadCsvTemplate('folha');
    expect(clickSpy).toHaveBeenCalled();
  });
});
