import { describe, it, expect } from 'vitest';
import {
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
