import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { CclasstribCatalogo } from '@/lib/tributario/catalogos/cclasstrib';
import {
  chaveFundamentoLegal,
  fundamentosVazios,
} from '@/lib/tributario/catalogos/fundamentacao-legal';
import { SecaoClassificacaoTributaria } from '../SecaoClassificacaoTributaria';

const estado = vi.hoisted(() => ({ atual: {} as Record<string, unknown> }));

vi.mock('@/hooks/useCatalogoCclasstrib', () => ({
  useClassificacaoTributaria: () => estado.atual,
}));

const opcao = (
  over: Partial<CclasstribCatalogo> & Pick<CclasstribCatalogo, 'cclasstrib'>
): CclasstribCatalogo => ({
  cst: '000',
  descricao: 'Tributacao integral',
  exigeGibscbs: true,
  pRedCbs: 0,
  pRedIbsUf: 0,
  pRedIbsMun: 0,
  versaoIt: '1.71',
  inicioVigencia: '2026-01-01',
  fimVigencia: null,
  ...over,
});

const OPCOES: CclasstribCatalogo[] = [
  opcao({ cclasstrib: '200035' }),
  opcao({ cclasstrib: '200038', descricao: 'Reducao de 60%', pRedCbs: 0.6, pRedIbsUf: 0.6 }),
];

const comFundamento = () => {
  const base = fundamentosVazios('2026-11-27');
  base.carregado = true;
  base.porCst.set(chaveFundamentoLegal('200038', '000'), {
    cclasstrib: '200038',
    cst: '000',
    conjuntoTributo: 'CBS e IBS',
    descricaoCClassTrib: null,
    descricaoCST: null,
    texto: 'Art. 12 da LC 214/2025',
    textoCurto: 'LC 214/2025',
    referenciaNormativa: null,
  });
  return base;
};

const estadoPadrao = (over: Record<string, unknown> = {}) => ({
  opcoes: OPCOES,
  fundamentos: comFundamento(),
  carregando: false,
  indisponivel: false,
  offline: false,
  offlineGravadoEm: null,
  vigenciaAte: null,
  ...over,
});

const renderizar = () =>
  render(
    <TooltipProvider>
      <SecaoClassificacaoTributaria />
    </TooltipProvider>
  );

beforeEach(() => {
  estado.atual = estadoPadrao();
});

describe('classificacao tributaria na consulta por NCM (etapa 84)', () => {
  it('mostra cClassTrib, CST, reducao e a norma que fundamenta', () => {
    renderizar();

    expect(screen.getByText('200038')).toBeInTheDocument();
    expect(screen.getByText('Reducao de 60%')).toBeInTheDocument();
    expect(screen.getByText('LC 214/2025')).toBeInTheDocument();
    expect(screen.queryByLabelText('Dado do cache offline')).not.toBeInTheDocument();
  });

  it('com o pacote do cache mostra os dados e o selo Offline', () => {
    estado.atual = estadoPadrao({
      offline: true,
      offlineGravadoEm: Date.parse('2026-11-20T00:00:00.000Z'),
      vigenciaAte: '2026-12-31',
    });

    renderizar();

    expect(screen.getByText('200035')).toBeInTheDocument();
    expect(screen.getByLabelText('Dado do cache offline')).toBeInTheDocument();
  });

  it('sem catalogo sincronizado explica o vazio em vez de mostrar tabela', () => {
    estado.atual = estadoPadrao({ opcoes: [], fundamentos: fundamentosVazios('2026-11-27'), indisponivel: true });

    renderizar();

    expect(screen.getByText(/sincronizado/)).toBeInTheDocument();
    expect(screen.queryByText('200035')).not.toBeInTheDocument();
  });

  it('filtro sem resultado avisa em vez de tabela vazia', () => {
    renderizar();

    fireEvent.change(screen.getByLabelText(/Filtrar por c/), { target: { value: 'zzz' } });

    expect(screen.getByText(/Nenhuma classifica/)).toBeInTheDocument();
  });

  it('filtro por CST mantem so o codigo escolhido', () => {
    renderizar();

    fireEvent.change(screen.getByLabelText(/Filtrar por c/), { target: { value: '200035' } });

    expect(screen.getByText('200035')).toBeInTheDocument();
    expect(screen.queryByText('200038')).not.toBeInTheDocument();
  });
});
