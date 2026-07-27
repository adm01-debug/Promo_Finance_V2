import { describe, it, expect } from 'vitest';
import {
  coletarDriftCatalogoAuditavel,
  coletarDriftMvaAuditavel,
  coletarRejeicoesOverlay,
  resumirRejeicoes,
} from '@/lib/tributario/catalogos/rejeicoes-auditoria';

describe('rejeicoes-auditoria', () => {
  it('normaliza rejeições dos quatro overlays com campo e motivo', () => {
    const linhas = coletarRejeicoesOverlay({
      icms: [{ sigla: 'SP', motivo: 'interna_invalida', valor: 99 }],
      iss: [
        {
          codigoIbge: 3550308,
          municipio: 'São Paulo',
          itemCodigo: '1.05',
          motivo: 'fora_da_faixa_legal',
          valor: 0.9,
        },
      ],
      ncm: [{ ncm: '12345678', motivo: 'aliquota_fora_da_faixa', valor: 9 }],
      monofasico: [{ ncm: '1234', motivo: 'codigo_invalido', valor: 4 }],
    });

    expect(linhas).toHaveLength(4);
    expect(linhas[0]).toMatchObject({
      catalogo: 'icms',
      identificador: 'SP',
      campo: 'aliquota_interna_padrao',
      severidade: 'critico',
    });
    expect(linhas[1]).toMatchObject({
      catalogo: 'iss',
      identificador: '3550308#1.05',
      descricao: 'São Paulo',
      campo: 'aliquota',
    });
    expect(linhas[2].campo).toBe('aliquota_ipi');
    expect(linhas[3]).toMatchObject({ catalogo: 'monofasico', campo: 'codigo' });
  });

  it('classifica duplicidade como atenção e o restante como crítico', () => {
    const linhas = coletarRejeicoesOverlay({
      icms: [
        { sigla: 'RJ', motivo: 'duplicado', valor: 0.2 },
        { sigla: 'MG', motivo: 'fcp_invalido', valor: 0.9 },
      ],
    });
    const resumo = resumirRejeicoes(linhas);
    expect(resumo).toMatchObject({ total: 2, criticos: 1, atencao: 1 });
    expect(resumo.porCatalogo.icms).toBe(2);
    expect(resumo.porMotivo).toHaveLength(2);
  });

  it('aceita entrada parcial sem quebrar', () => {
    expect(coletarRejeicoesOverlay({})).toEqual([]);
    expect(resumirRejeicoes([]).total).toBe(0);
  });
});

describe('coletarDriftCatalogoAuditavel', () => {
  const base = {
    catalogoTitulo: 'x',
    valorMotor: 1,
    valorBanco: 2,
    mensagem: 'divergência detectada',
  } as const;

  it('mapeia o drift de todos os catálogos para os buckets persistidos', () => {
    const linhas = coletarDriftCatalogoAuditavel([
      { id: '1', catalogo: 'ufs', severidade: 'critico', item: 'SP', campo: 'aliquota', ...base },
      { id: '2', catalogo: 'interestaduais', severidade: 'critico', item: 'SP→RJ', campo: 'aliquota', ...base },
      { id: '3', catalogo: 'faixas_simples', severidade: 'atencao', item: 'I-3', campo: 'deducao', ...base },
      { id: '4', catalogo: 'itens_iss', severidade: 'critico', item: '1.05', campo: 'retencao', ...base },
      { id: '5', catalogo: 'ncms', severidade: 'critico', item: '12345678', campo: 'ausente', ...base },
      { id: '6', catalogo: 'protocolos_st', severidade: 'critico', item: 'P-1#123', campo: 'ausente', ...base },
    ]);

    expect(linhas.map((l) => l.catalogo)).toEqual([
      'icms',
      'interestaduais',
      'faixas_simples',
      'iss',
      'ncm',
      'mva_st',
    ]);
    expect(linhas.every((l) => l.motivo.startsWith('drift_'))).toBe(true);
    expect(linhas[0].valorRecebido).toBe('2');
  });

  it('mantém coletarDriftMvaAuditavel restrito ao catálogo de protocolos', () => {
    const alertas = [
      { id: '1', catalogo: 'ufs', severidade: 'critico', item: 'SP', campo: 'aliquota', ...base },
      { id: '2', catalogo: 'protocolos_st', severidade: 'critico', item: 'P-1', campo: 'ausente', ...base },
    ] as const;
    const linhas = coletarDriftMvaAuditavel([...alertas]);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].catalogo).toBe('mva_st');
  });

  it('trunca a descrição em 300 caracteres', () => {
    const linhas = coletarDriftCatalogoAuditavel([
      {
        id: '1',
        catalogo: 'ncms',
        severidade: 'atencao',
        item: '1',
        campo: 'ausente',
        catalogoTitulo: 'x',
        valorMotor: null,
        valorBanco: null,
        mensagem: 'a'.repeat(400),
      },
    ]);
    expect(linhas[0].descricao).toHaveLength(300);
    expect(linhas[0].valorRecebido).toBeNull();
  });
});
