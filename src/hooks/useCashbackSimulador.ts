// ============================================
// HOOK: SIMULADOR DE CASHBACK
// Para bens essenciais (LC 214/2025)
// ============================================

import { useState, useMemo } from 'react';
import { ALIQUOTAS_TRANSICAO, CASHBACK_PERCENTUAIS } from '@/types/reforma-tributaria';

export type CategoriaCashback = 
  | 'cesta_basica'
  | 'energia_eletrica'
  | 'gas_cozinha'
  | 'agua_saneamento'
  | 'telecomunicacoes'
  | 'medicamentos'
  | 'transporte_publico'
  | 'demais';

export interface ItemConsumo {
  id: string;
  categoria: CategoriaCashback;
  descricao: string;
  valorMensal: number;
}

export interface ResultadoCashback {
  categoria: CategoriaCashback;
  nome: string;
  valorConsumo: number;
  cbsPago: number;
  ibsPago: number;
  totalTributos: number;
  cashbackCBS: number;
  cashbackIBS: number;
  totalCashback: number;
  percentualDevolucao: number;
}

export interface ResumoMensalCashback {
  totalConsumo: number;
  totalTributosPagos: number;
  totalCashback: number;
  economiaEfetiva: number;
  percentualMedioDevolvido: number;
  porCategoria: ResultadoCashback[];
}

// Configurações de cashback por categoria (baseado na LC 214/2025)
const CASHBACK_CONFIG: Record<CategoriaCashback, { nome: string; cbsPercent: number; ibsPercent: number }> = {
  cesta_basica: { nome: 'Cesta Básica', cbsPercent: 100, ibsPercent: 100 },
  energia_eletrica: { nome: 'Energia Elétrica', cbsPercent: 100, ibsPercent: 50 },
  gas_cozinha: { nome: 'Gás de Cozinha', cbsPercent: 100, ibsPercent: 100 },
  agua_saneamento: { nome: 'Água e Saneamento', cbsPercent: 100, ibsPercent: 50 },
  telecomunicacoes: { nome: 'Telecomunicações', cbsPercent: 20, ibsPercent: 20 },
  medicamentos: { nome: 'Medicamentos', cbsPercent: 60, ibsPercent: 60 },
  transporte_publico: { nome: 'Transporte Público', cbsPercent: 100, ibsPercent: 100 },
  demais: { nome: 'Demais Itens', cbsPercent: 20, ibsPercent: 20 },
};

// Exemplo de cesta de consumo familiar
const CESTA_PADRAO: ItemConsumo[] = [
  { id: '1', categoria: 'cesta_basica', descricao: 'Alimentos básicos', valorMensal: 800 },
  { id: '2', categoria: 'energia_eletrica', descricao: 'Conta de luz', valorMensal: 200 },
  { id: '3', categoria: 'gas_cozinha', descricao: 'Botijão de gás', valorMensal: 120 },
  { id: '4', categoria: 'agua_saneamento', descricao: 'Conta de água', valorMensal: 80 },
  { id: '5', categoria: 'telecomunicacoes', descricao: 'Internet e celular', valorMensal: 150 },
  { id: '6', categoria: 'medicamentos', descricao: 'Remédios', valorMensal: 100 },
  { id: '7', categoria: 'transporte_publico', descricao: 'Passagens', valorMensal: 200 },
  { id: '8', categoria: 'demais', descricao: 'Outros gastos', valorMensal: 500 },
];

export function useCashbackSimulador() {
  const [ano, setAno] = useState(2026);
  const [rendaFamiliar, setRendaFamiliar] = useState(2500); // Até 3 salários mínimos
  const [itensConsumo, setItensConsumo] = useState<ItemConsumo[]>(CESTA_PADRAO);
  const [inscritoCadUnico, setInscritoCadUnico] = useState(true);

  const aliquotas = useMemo(() => 
    ALIQUOTAS_TRANSICAO.find(a => a.ano === ano) || ALIQUOTAS_TRANSICAO[0]
  , [ano]);

  // Verificar elegibilidade
  const elegivel = useMemo(() => {
    const salarioMinimo = 1412; // Valor 2024
    const limiteSalarios = 3;
    return inscritoCadUnico && rendaFamiliar <= (salarioMinimo * limiteSalarios);
  }, [rendaFamiliar, inscritoCadUnico]);

  // Calcular cashback por categoria
  const calcularCashbackCategoria = (categoria: CategoriaCashback, valor: number): ResultadoCashback => {
    const config = CASHBACK_CONFIG[categoria];
    
    const cbsPago = valor * (aliquotas.cbs / 100);
    const ibsPago = valor * (aliquotas.ibs / 100);
    const totalTributos = cbsPago + ibsPago;
    
    const cashbackCBS = elegivel ? cbsPago * (config.cbsPercent / 100) : 0;
    const cashbackIBS = elegivel ? ibsPago * (config.ibsPercent / 100) : 0;
    const totalCashback = cashbackCBS + cashbackIBS;
    
    return {
      categoria,
      nome: config.nome,
      valorConsumo: valor,
      cbsPago,
      ibsPago,
      totalTributos,
      cashbackCBS,
      cashbackIBS,
      totalCashback,
      percentualDevolucao: totalTributos > 0 ? (totalCashback / totalTributos) * 100 : 0,
    };
  };

  // Resumo mensal
  const resumoMensal = useMemo((): ResumoMensalCashback => {
    // Agrupar por categoria
    const porCategoria = Object.keys(CASHBACK_CONFIG).map(cat => {
      const categoria = cat as CategoriaCashback;
      const totalCategoria = itensConsumo
        .filter(i => i.categoria === categoria)
        .reduce((acc, i) => acc + i.valorMensal, 0);
      
      return calcularCashbackCategoria(categoria, totalCategoria);
    }).filter(r => r.valorConsumo > 0);

    const totalConsumo = porCategoria.reduce((acc, r) => acc + r.valorConsumo, 0);
    const totalTributosPagos = porCategoria.reduce((acc, r) => acc + r.totalTributos, 0);
    const totalCashback = porCategoria.reduce((acc, r) => acc + r.totalCashback, 0);
    const economiaEfetiva = totalCashback;
    const percentualMedioDevolvido = totalTributosPagos > 0 
      ? (totalCashback / totalTributosPagos) * 100 
      : 0;

    return {
      totalConsumo,
      totalTributosPagos,
      totalCashback,
      economiaEfetiva,
      percentualMedioDevolvido,
      porCategoria,
    };
  }, [itensConsumo, aliquotas, elegivel]);

  // Projeção anual
  const projecaoAnual = useMemo(() => ({
    totalConsumo: resumoMensal.totalConsumo * 12,
    totalTributos: resumoMensal.totalTributosPagos * 12,
    totalCashback: resumoMensal.totalCashback * 12,
  }), [resumoMensal]);

  // Adicionar item de consumo
  const adicionarItem = (item: Omit<ItemConsumo, 'id'>) => {
    const novoItem = { ...item, id: Date.now().toString() };
    setItensConsumo(prev => [...prev, novoItem]);
  };

  // Remover item
  const removerItem = (id: string) => {
    setItensConsumo(prev => prev.filter(i => i.id !== id));
  };

  // Atualizar item
  const atualizarItem = (id: string, updates: Partial<ItemConsumo>) => {
    setItensConsumo(prev => 
      prev.map(i => i.id === id ? { ...i, ...updates } : i)
    );
  };

  // Reset para cesta padrão
  const resetarCesta = () => {
    setItensConsumo(CESTA_PADRAO);
  };

  return {
    ano,
    setAno,
    rendaFamiliar,
    setRendaFamiliar,
    inscritoCadUnico,
    setInscritoCadUnico,
    itensConsumo,
    elegivel,
    aliquotas,
    resumoMensal,
    projecaoAnual,
    adicionarItem,
    removerItem,
    atualizarItem,
    resetarCesta,
    categoriasDisponiveis: Object.entries(CASHBACK_CONFIG).map(([key, value]) => ({
      id: key as CategoriaCashback,
      nome: value.nome,
      cbsPercent: value.cbsPercent,
      ibsPercent: value.ibsPercent,
    })),
  };
}

export default useCashbackSimulador;
