import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateConciliacaoAuditPDF, type ConciliacaoAuditRow } from '../conciliacao';

const writeMock = vi.fn();
const closeMock = vi.fn();
const openMock = vi.fn();

beforeEach(() => {
  writeMock.mockClear();
  closeMock.mockClear();
  openMock.mockClear();
  openMock.mockReturnValue({
    document: { write: writeMock, close: closeMock },
  });
  vi.stubGlobal('open', openMock);
});

const baseRows: ConciliacaoAuditRow[] = [
  {
    evento: 'Baixa manual',
    valor: 1500.5,
    responsavel: 'Ana',
    data: '2026-07-01',
    regra: 'REGRA_MANUAL',
    classificacao: 'ajuste',
    evidencia_url: 'https://x/y.pdf',
  },
  {
    evento: 'Estorno',
    valor: -300,
    responsavel: 'Bruno',
    data: '2026-07-02',
    regra: 'REGRA_ESTORNO',
  },
];

describe('generateConciliacaoAuditPDF', () => {
  it('não abre janela quando popup é bloqueado', () => {
    openMock.mockReturnValueOnce(null);
    generateConciliacaoAuditPDF(baseRows, {});
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('renderiza todas as linhas com classes de valor positivo/negativo', () => {
    generateConciliacaoAuditPDF(baseRows, {});
    const html = writeMock.mock.calls[0][0] as string;
    expect(html).toContain('Baixa manual');
    expect(html).toContain('Estorno');
    expect(html).toContain('class="valor positivo"');
    expect(html).toContain('class="valor negativo"');
    expect(closeMock).toHaveBeenCalledOnce();
  });

  it('marca evidência quando URL presente e ausente quando não', () => {
    generateConciliacaoAuditPDF(baseRows, {});
    const html = writeMock.mock.calls[0][0] as string;
    expect(html).toMatch(/text-blue-600">Sim/);
    expect(html).toMatch(/text-gray-400">Não/);
  });

  it('aplica filtros ao cabeçalho ou preenche defaults', () => {
    generateConciliacaoAuditPDF([], {
      user: 'Ana',
      conta: 'Itaú',
      inicio: '2026-07-01',
      fim: '2026-07-31',
      classificacao: 'ajuste',
    });
    const html = writeMock.mock.calls[0][0] as string;
    expect(html).toContain('Ana');
    expect(html).toContain('Itaú');
    expect(html).toContain('2026-07-01');
    expect(html).toContain('2026-07-31');
    expect(html).toContain('ajuste');
  });

  it('preenche defaults quando filtros são omitidos', () => {
    generateConciliacaoAuditPDF([], {});
    const html = writeMock.mock.calls[0][0] as string;
    expect(html).toContain('Todas');
    expect(html).toContain('Todos');
    expect(html).toContain('Início');
    expect(html).toContain('Fim');
  });

  it('gera tabela vazia sem quebrar quando dados vazios', () => {
    generateConciliacaoAuditPDF([], {});
    const html = writeMock.mock.calls[0][0] as string;
    expect(html).toContain('<tbody></tbody>');
  });
});
