import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs } from '@/components/ui/tabs';
import { AnaliseTab, type EstrategiaCatalogo } from '../AnaliseTab';
import type { RelatorioElisao } from '@/lib/tributario/elisao';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

/**
 * public.estrategias_elisao_catalogo tem 8 estratégias com economia de referência,
 * e o hook useOportunidadesElisao já as buscava e devolvia — mas nenhuma das 3
 * páginas que usam o hook desestruturava `catalogo`. Resultado: 5 estratégias
 * catalogadas (R$ 145.500 de referência) nunca apareciam em tela, porque os
 * códigos do catálogo não existem no motor de 13 detectores.
 *
 * Esta aba passa a listar só as que o motor NÃO avalia. As três que têm
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
      cat('CRED_ICMS_ST', 'Recuperação de ICMS-ST', 28000),
      cat('RATEIO_CUSTOS', 'Rateio de Custos', 12000),
    ]);
    const bloco = screen.getByText(/Catalogadas, ainda não avaliadas/).closest('div');
    expect(bloco).toBeTruthy();
    expect(screen.queryByText('Lei do Bem')).not.toBeInTheDocument();
    expect(screen.getByText('Recuperação de ICMS-ST')).toBeInTheDocument();
    expect(screen.getByText('Rateio de Custos')).toBeInTheDocument();
    // 28000 + 12000 = 40000, nao 135000
    expect(screen.getByText(/40\.000,00/)).toBeInTheDocument();
    expect(screen.queryByText(/135\.000,00/)).not.toBeInTheDocument();
    expect(screen.getByText(/2 de 3 estratégias/)).toBeInTheDocument();
  });

  it('NÃO lista CRED_PIS_COFINS: o detector Tema 779 já avalia o mesmo crédito', () => {
    // Revisão das PRs #398 (Devin e Codex): detectar-recuperacao-pis-cofins.ts avalia
    // "créditos de PIS/COFINS sobre insumos essenciais" e roda sempre
    // (orquestrador-elisao.ts:51) — listar o código do catálogo duplicaria a
    // estratégia e somaria R$ 45.000 indevidos à referência não avaliada.
    montar(relatorio(['RECUPERACAO_PIS_COFINS']), [
      cat('CRED_PIS_COFINS', 'Crédito de PIS/COFINS sobre Insumos', 45000),
    ]);
    expect(screen.queryByText('Crédito de PIS/COFINS sobre Insumos')).not.toBeInTheDocument();
    expect(screen.queryByText(/Catalogadas, ainda não avaliadas/)).not.toBeInTheDocument();
  });

  it('sem catálogo não renderiza a seção', () => {
    montar(relatorio(['JCP']), []);
    expect(screen.queryByText(/Catalogadas, ainda não avaliadas/)).not.toBeInTheDocument();
  });
});
