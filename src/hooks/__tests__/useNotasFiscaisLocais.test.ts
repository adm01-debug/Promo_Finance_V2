import { describe, expect, it } from 'vitest';
import {
  mapearItemLocal,
  mapearNotaLocal,
  statusNotaFiscalLocal,
  urlDoArquivo,
  type NotaFiscalLocal,
} from '@/hooks/useNotasFiscaisLocais';

const notaBase: NotaFiscalLocal = {
  id: 'n1',
  numero: '1234',
  serie: '1',
  chave_acesso: '35240112345678000190550010000012341234567890',
  data_emissao: '2026-11-01',
  cliente_nome: 'Tech Solutions Ltda',
  cliente_cnpj: '12345678000199',
  status: 'autorizada',
  valor_produtos: 1000,
  valor_frete: 50,
  valor_desconto: 10,
  valor_icms: 120,
  valor_total: 1040,
};

describe('notas fiscais locais — leitura real do banco', () => {
  it('traduz o status TEXT da tabela para o enum da tela', () => {
    expect(statusNotaFiscalLocal('autorizada')).toBe('autorizada');
    expect(statusNotaFiscalLocal('EMITIDA')).toBe('autorizada');
    expect(statusNotaFiscalLocal('cancelado')).toBe('cancelada');
    expect(statusNotaFiscalLocal('rejeitada')).toBe('denegada');
    expect(statusNotaFiscalLocal('inutilizada')).toBe('inutilizada');
    expect(statusNotaFiscalLocal(null)).toBe('pendente');
    expect(statusNotaFiscalLocal('  ')).toBe('pendente');
  });

  it('usa a URL de arquivo que existe e devolve undefined quando não há arquivo', () => {
    expect(urlDoArquivo(notaBase, 'xml')).toBeUndefined();
    expect(urlDoArquivo({ ...notaBase, xml_url: ' https://x/xml.xml ' }, 'xml')).toBe(
      'https://x/xml.xml'
    );
    expect(urlDoArquivo({ ...notaBase, asaas_xml_url: 'https://x/asaas.xml' }, 'xml')).toBe(
      'https://x/asaas.xml'
    );
    expect(urlDoArquivo({ ...notaBase, asaas_pdf_url: 'https://x/danfe.pdf' }, 'pdf')).toBe(
      'https://x/danfe.pdf'
    );
  });

  it('mapeia a linha para a nota da tela sem inventar dado fiscal', () => {
    const nota = mapearNotaLocal(
      { ...notaBase, xml_url: 'https://x/nfe.xml', asaas_pdf_url: 'https://x/nfe.pdf' },
      []
    );

    expect(nota).toMatchObject({
      id: 'n1',
      numero: '1234',
      chaveAcesso: '35240112345678000190550010000012341234567890',
      destinatarioNome: 'Tech Solutions Ltda',
      cnpjDestinatario: '12345678000199',
      valorProdutos: 1000,
      valorTotal: 1040,
      status: 'autorizada',
      xmlUrl: 'https://x/nfe.xml',
      pdfUrl: 'https://x/nfe.pdf',
    });
    expect(nota.protocolo).toBeUndefined();
    expect(nota.naturezaOperacao).toBe('');
  });

  it('trata coluna nula como zero/vazio em vez de quebrar a tela', () => {
    const nota = mapearNotaLocal({
      ...notaBase,
      numero: null,
      cliente_nome: null,
      valor_total: null,
      status: null,
    });
    expect(nota.numero).toBe('');
    expect(nota.destinatarioNome).toBe('');
    expect(nota.valorTotal).toBe(0);
    expect(nota.status).toBe('pendente');
  });

  it('mapeia o item real (a tabela guarda código, não descrição)', () => {
    const item = mapearItemLocal({
      nota_fiscal_id: 'n1',
      n_item: 1,
      c_prod: 'SKU-1',
      ncm: '39269090',
      cfop: '5102',
      q_com: 3,
      v_un_com: 10,
      v_prod: 30,
      cclasstrib: '000001',
      cst_ibscbs: '000',
      v_bc_ibscbs: 30,
      v_ibs_uf: 0.3,
      v_ibs_mun: 0.3,
      v_ibs: 0.6,
      v_cbs: 2.7,
    });

    expect(item).toMatchObject({
      codigo: 'SKU-1',
      descricao: 'SKU-1',
      ncm: '39269090',
      cfop: '5102',
      quantidade: 3,
      valorTotal: 30,
      cClassTrib: '000001',
      vCBS: 2.7,
    });
    expect(item.unidade).toBe('UN');
  });
});
