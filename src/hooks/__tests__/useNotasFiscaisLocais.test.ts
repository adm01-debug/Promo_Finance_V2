import { describe, expect, it, vi } from 'vitest';
import { getNfeXmlSignedUrl } from '@/hooks/useNfeRecebidas';
import {
  direcaoDaNota,
  mapearItemLocal,
  mapearNotaLocal,
  pathXmlNoStorage,
  resolverUrlArquivo,
  resumirNotas,
  statusNotaFiscalLocal,
  urlDoArquivo,
  urlFiscalConfiavel,
  type NotaFiscalLocal,
} from '@/hooks/useNotasFiscaisLocais';

vi.mock('@/hooks/useNfeRecebidas', () => ({
  getNfeXmlSignedUrl: vi.fn(),
  useNfeRecebidas: vi.fn(),
}));

const CHAVE = '35240112345678000190550010000012341234567890';
const EMPRESA = '11111111-2222-3333-4444-555555555555';
const URL_SUPABASE = 'https://projeto.supabase.co/storage/v1/object/sign/nfe-xml/a.xml?token=abc';

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
    expect(urlDoArquivo({ ...notaBase, xml_url: ` ${URL_SUPABASE} ` }, 'xml')).toBe(URL_SUPABASE);
    expect(urlDoArquivo({ ...notaBase, asaas_xml_url: URL_SUPABASE }, 'xml')).toBe(URL_SUPABASE);
    expect(urlDoArquivo({ ...notaBase, asaas_pdf_url: URL_SUPABASE }, 'pdf')).toBe(URL_SUPABASE);
  });

  it('recusa URL de origem desconhecida gravada na nota', () => {
    expect(urlFiscalConfiavel('https://phishing.example/nfe.xml')).toBeUndefined();
    expect(urlFiscalConfiavel('http://projeto.supabase.co/x.xml')).toBeUndefined();
    expect(urlFiscalConfiavel('javascript:alert(1)')).toBeUndefined();
    expect(urlFiscalConfiavel('')).toBeUndefined();
    expect(urlFiscalConfiavel(URL_SUPABASE)).toBe(URL_SUPABASE);
    // Qualquer usuário da empresa pode escrever em `notas_fiscais`: a tela não
    // pode abrir um destino arbitrário para os outros usuários.
    expect(
      urlDoArquivo({ ...notaBase, xml_url: 'https://phishing.example/nfe.xml' }, 'xml')
    ).toBeUndefined();
  });

  it('assina a URL do XML que vive no bucket privado', async () => {
    expect(pathXmlNoStorage(EMPRESA, CHAVE)).toBe(`${EMPRESA}/${CHAVE}.xml`);
    expect(pathXmlNoStorage('nao-uuid', CHAVE)).toBeUndefined();
    expect(pathXmlNoStorage(EMPRESA, '123')).toBeUndefined();

    vi.mocked(getNfeXmlSignedUrl).mockResolvedValue(URL_SUPABASE);
    await expect(
      resolverUrlArquivo({ chaveAcesso: CHAVE, empresaId: EMPRESA }, 'xml')
    ).resolves.toBe(URL_SUPABASE);
    expect(getNfeXmlSignedUrl).toHaveBeenCalledWith(`${EMPRESA}/${CHAVE}.xml`);
  });

  it('não inventa arquivo quando o DANFE não existe ou o bucket falha', async () => {
    vi.mocked(getNfeXmlSignedUrl).mockResolvedValue(null);
    await expect(
      resolverUrlArquivo({ chaveAcesso: CHAVE, empresaId: EMPRESA }, 'xml')
    ).resolves.toBeUndefined();
    await expect(
      resolverUrlArquivo({ chaveAcesso: CHAVE, empresaId: EMPRESA }, 'pdf')
    ).resolves.toBeUndefined();
  });

  it('mapeia a linha para a nota da tela sem inventar dado fiscal', () => {
    const nota = mapearNotaLocal(
      { ...notaBase, xml_url: URL_SUPABASE, asaas_pdf_url: URL_SUPABASE },
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
      xmlUrl: URL_SUPABASE,
      pdfUrl: URL_SUPABASE,
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

describe('sentido da nota — compra não é faturamento', () => {
  it('o CFOP do item manda sobre a natureza da operação', () => {
    expect(direcaoDaNota('Compra para comercialização', ['5102'])).toBe('saida');
    expect(direcaoDaNota('Venda de mercadoria', ['1102'])).toBe('entrada');
    expect(direcaoDaNota('Venda de mercadoria', ['6102'])).toBe('saida');
    expect(direcaoDaNota('Compra para comercialização', ['2102'])).toBe('entrada');
  });

  it('sem CFOP cai na natureza e, no escuro, fica indefinida', () => {
    expect(direcaoDaNota('Compra para comercialização')).toBe('entrada');
    expect(direcaoDaNota('Venda de mercadoria')).toBe('saida');
    expect(direcaoDaNota('Devolução de venda de mercadoria')).toBe('entrada');
    expect(direcaoDaNota('Remessa para conserto')).toBe('entrada');
    expect(direcaoDaNota(null)).toBe('indefinida');
    expect(direcaoDaNota('Operação sem palavra conhecida')).toBe('indefinida');
  });

  it('a contraparte da compra aparece como fornecedor, não como cliente', () => {
    const compra = mapearNotaLocal({
      ...notaBase,
      natureza_operacao: 'Compra para comercialização',
    });
    expect(compra.direcao).toBe('entrada');
    expect(compra.emitenteNome).toBe('Tech Solutions Ltda');
    expect(compra.cnpjEmitente).toBe('12345678000199');
    expect(compra.destinatarioNome).toBe('');
  });

  it('indica se o XML pode ser buscado no bucket da empresa', () => {
    expect(mapearNotaLocal(notaBase).xmlNoStorage).toBe(false);
    expect(
      mapearNotaLocal({ ...notaBase, empresa_id: EMPRESA, chave_acesso: CHAVE }).xmlNoStorage
    ).toBe(true);
  });
});

describe('indicadores da tela', () => {
  it('separa faturamento de compra e de nota cancelada', () => {
    const venda = mapearNotaLocal({ ...notaBase, id: 'v', natureza_operacao: 'Venda' });
    const compra = mapearNotaLocal({
      ...notaBase,
      id: 'c',
      valor_total: 500,
      natureza_operacao: 'Compra para comercialização',
    });
    const cancelada = mapearNotaLocal({
      ...notaBase,
      id: 'x',
      status: 'cancelada',
      natureza_operacao: 'Venda',
    });
    const semClasse = mapearNotaLocal({ ...notaBase, id: 'i', natureza_operacao: null });

    const resumo = resumirNotas([venda, compra, cancelada, semClasse]);
    expect(resumo.totalEmitido).toBe(2080);
    expect(resumo.totalEntradas).toBe(500);
    expect(resumo.notasAutorizadas).toBe(2);
    expect(resumo.totalCancelado).toBe(1040);
    expect(resumo.semClassificacao).toBe(1);
  });

  it('conta os itens faturados só das notas de saída', () => {
    const item = {
      codigo: 'SKU-1',
      descricao: 'SKU-1',
      ncm: '39269090',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 4,
      valorUnitario: 10,
      valorTotal: 40,
    };
    const itemCompra = { ...item, cfop: '1102', quantidade: 9 };
    const venda = mapearNotaLocal({ ...notaBase, id: 'v', natureza_operacao: 'Venda' }, [item]);
    const compra = mapearNotaLocal(
      { ...notaBase, id: 'c', natureza_operacao: 'Compra para comercialização' },
      [itemCompra]
    );

    expect(resumirNotas([venda, compra]).itensFaturados).toBe(4);
  });
});
