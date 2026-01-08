import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CategoriaDetectada {
  categoria: string;
  subcategoria?: string;
  confianca: number;
  centro_custo_sugerido?: string;
  tags?: string[];
  descricao_padronizada?: string;
}

export interface DespesaParaCategorizar {
  id?: string;
  descricao: string;
  valor: number;
  fornecedor_nome?: string;
  data_vencimento?: string;
}

export function useCategorizacaoIA() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Map<string, CategoriaDetectada>>(new Map());

  const categorizarDespesa = async (despesa: DespesaParaCategorizar): Promise<CategoriaDetectada | null> => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('categorizar-despesa', {
        body: { despesas: [despesa] },
      });

      if (error) throw error;

      const resultado = data?.categorias?.[0];
      if (resultado) {
        const key = despesa.id || despesa.descricao;
        setLastAnalysis(prev => new Map(prev).set(key, resultado));
        return resultado;
      }
      
      return null;
    } catch (error: unknown) {
      logger.error('Erro ao categorizar despesa:', error);
      toast.error('Erro ao categorizar despesa com IA');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categorizarEmLote = async (despesas: DespesaParaCategorizar[]): Promise<Map<string, CategoriaDetectada>> => {
    setIsAnalyzing(true);
    const resultados = new Map<string, CategoriaDetectada>();

    try {
      const { data, error } = await supabase.functions.invoke('categorizar-despesa', {
        body: { despesas },
      });

      if (error) throw error;

      (data?.categorias || []).forEach((cat: CategoriaDetectada, idx: number) => {
        const despesa = despesas[idx];
        const key = despesa.id || despesa.descricao;
        resultados.set(key, cat);
      });

      setLastAnalysis(new Map([...lastAnalysis, ...resultados]));
      
      toast.success(`${resultados.size} despesas categorizadas com sucesso`);
      return resultados;
    } catch (error: unknown) {
      logger.error('Erro ao categorizar despesas em lote:', error);
      toast.error('Erro ao categorizar despesas');
      return resultados;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const obterSugestao = (key: string): CategoriaDetectada | undefined => {
    return lastAnalysis.get(key);
  };

  const limparCache = () => {
    setLastAnalysis(new Map());
  };

  return {
    isAnalyzing,
    categorizarDespesa,
    categorizarEmLote,
    obterSugestao,
    limparCache,
    lastAnalysis,
  };
}

// Categorias padrão do sistema
export const CATEGORIAS_DESPESAS = [
  { id: 'pessoal', nome: 'Despesas com Pessoal', subcategorias: ['Salários', 'Benefícios', 'Encargos', 'Treinamentos'] },
  { id: 'operacional', nome: 'Despesas Operacionais', subcategorias: ['Aluguel', 'Energia', 'Água', 'Internet', 'Telefone', 'Manutenção'] },
  { id: 'materiais', nome: 'Materiais e Insumos', subcategorias: ['Matéria-prima', 'Material de escritório', 'Material de limpeza'] },
  { id: 'marketing', nome: 'Marketing e Vendas', subcategorias: ['Publicidade', 'Brindes', 'Eventos', 'Comissões'] },
  { id: 'impostos', nome: 'Impostos e Taxas', subcategorias: ['Federais', 'Estaduais', 'Municipais', 'Taxas bancárias'] },
  { id: 'financeiro', nome: 'Despesas Financeiras', subcategorias: ['Juros', 'Multas', 'Tarifas', 'IOF'] },
  { id: 'ti', nome: 'Tecnologia da Informação', subcategorias: ['Software', 'Hardware', 'Serviços de TI', 'Cloud'] },
  { id: 'juridico', nome: 'Jurídico e Contábil', subcategorias: ['Honorários', 'Taxas cartoriais', 'Certidões'] },
  { id: 'transporte', nome: 'Transporte e Logística', subcategorias: ['Combustível', 'Frete', 'Pedágios', 'Manutenção veicular'] },
  { id: 'outros', nome: 'Outras Despesas', subcategorias: ['Diversos'] },
];
