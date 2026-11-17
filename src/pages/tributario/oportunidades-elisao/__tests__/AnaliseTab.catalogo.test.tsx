import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs } from '@/components/ui/tabs';
import { AnaliseTab, type EstrategiaCatalogo } from '../AnaliseTab';
import type { RelatorioElisao } from '@/lib/tributario/elisao';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

/**
 * public.estrategias_elisao_catalogo tem 8 estratégias com economia de referência,
 * e o hook useOportunidadesElisao já as buscava e devolvia — mas nenhuma das 3
 * páginas que usam o hook desestruturava `catalogo`. Resultado: 6 estratégias
 * catalogadas (R$ 190.500 de referência) nunca apareciam em tela, porque os
 * códigos do catálogo não existem no motor de 13 detectores.
 *
 * Esta aba passa a listar só as que o motor NÃO avalia. As duas que têm
 * equivalente semântico (CATALOGO_PARA_DETECTOR) ficam de fora para não duplicar
 * o que o motor já mostra acima.
 */

const relatorio = (codigos: string[]): RelatorioElisao =>
  ({
    total_oportunidades: codigos.length,
    total_aplicaveis: codigos.length,
    economia_total_estimada: 0,
    oportunidades: codigos.map((c) => ({
      estrategia: c,
      nome: `Detector ${c}`,
      aplicavel: false,
      economia_estimada: 0,
      base_legal: 'x',
      risco: 'baixo' as const,
      justificativa: 'j',
      proximos_passos: [],
    })),
  }) as unknown as RelatorioElisao;

const cat = (codigo: string, nome: string, valor: number | null): EstrategiaCatalogo => ({
  id: codigo,
  codigo,
  nome,
  descricao: null,
  tipo: 'credito_tributario',
  economia_estimada_padrao: valor,
  ativo: true,
});

function montar(rel: RelatorioElisao, catalogo: EstrategiaCatalogo[]) {
  return render(
    <Tabs defaultValue="analise">
      <AnaliseTab relatorio={rel} catalogo={catalogo} />
    </Tabs>
  );
}

describe('AnaliseTab — catálogo não avaliado', () => {
  it('lista a estratégia catalogada que não tem detector, com o valor de referência', () => {
    montar(relatorio(['JCP']), [cat('CRED_ICMS_ATIVO', 'Crédito de ICMS sobre Ativo', 65000)]);
    expect(screen.getByText('Crédito de ICMS sobre Ativo')).toBeInTheDocument();
    expect(screen.getByText(/Catalogadas, ainda não avaliadas/)).toBeInTheDocument();
  });

  it('NÃO lista a catalogada cujo equivalente o motor já avalia', () => {
    // DEP_ACELERADA <-> DEPRECIACAO_ACELERADA via CATALOGO_PARA_DETECTOR
    montar(relatorio(['DEPRECIACAO_ACELERADA']), [
      cat('DEP_ACELERADA', 'Depreciação Acelerada', 18500),
    ]);
    expect(screen.queryByText('Depreciação Acelerada')).not.toBeInTheDocument();
    expect(screen.queryByText(/Catalogadas, ainda não avaliadas/)).not.toBeInTheDocument();
  });

  it('soma só o que não é avaliado', () => {
    montar(relatorio(['LEI_BEM']), [
      cat('INOV_TECNOLOGIA', 'Lei do Bem', 95000), // tem detector -> fora
      cat('CRED_PIS_COFINS', 'Crédito de PIS/COFINS', 45000),
      cat('RATEIO_CUSTOS', 'Rateio de Custos', 12000),
    ]);
    const bloco = screen.getByText(/Catalogadas, ainda não avaliadas/).closest('div');
    expect(bloco).toBeTruthy();
    expect(screen.queryByText('Lei do Bem')).not.toBeInTheDocument();
    expect(screen.getByText('Crédito de PIS/COFINS')).toBeInTheDocument();
    expect(screen.getByText('Rateio de Custos')).toBeInTheDocument();
    // 45000 + 12000 = 57000, nao 152000
    expect(screen.getByText(/57\.000,00/)).toBeInTheDocument();
    expect(screen.queryByText(/152\.000,00/)).not.toBeInTheDocument();
    expect(screen.getByText(/2 de 3 estratégias/)).toBeInTheDocument();
  });

  it('sem catálogo não renderiza a seção', () => {
    montar(relatorio(['JCP']), []);
    expect(screen.queryByText(/Catalogadas, ainda não avaliadas/)).not.toBeInTheDocument();
  });
});
