import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResumoDrillLevel, EmpresasDrillLevel, DetalhesDrillLevel } from './RelatorioDrillLevels';

type DrillLevel = 'resumo' | 'categoria' | 'empresa' | 'detalhes';

interface DrillState {
  level: DrillLevel;
  categoria?: 'receitas' | 'despesas';
  empresaId?: string;
  empresaNome?: string;
  mes?: string;
}

export function RelatorioDrillDown() {
  const [periodo, setPeriodo] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [drillState, setDrillState] = useState<DrillState>({ level: 'resumo' });

  const dataInicio = startOfMonth(new Date(periodo + '-01'));
  const dataFim = endOfMonth(dataInicio);

  // Query de resumo geral
  const { data: resumoData, isLoading: isLoadingResumo } = useQuery({
    queryKey: ['drill-resumo', periodo],
    queryFn: async () => {
      const [receitas, despesas] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('valor, valor_recebido, status')
          .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd')),
        supabase
          .from('contas_pagar')
          .select('valor, valor_pago, status')
          .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd')),
      ]);

      const totalReceitas = receitas.data?.reduce((acc, r) => acc + r.valor, 0) || 0;
      const receitasRecebidas = receitas.data?.filter(r => r.status === 'pago').reduce((acc, r) => acc + (r.valor_recebido || r.valor), 0) || 0;
      
      const totalDespesas = despesas.data?.reduce((acc, d) => acc + d.valor, 0) || 0;
      const despesasPagas = despesas.data?.filter(d => d.status === 'pago').reduce((acc, d) => acc + (d.valor_pago || d.valor), 0) || 0;

      return {
        receitas: {
          total: totalReceitas,
          realizado: receitasRecebidas,
          pendente: totalReceitas - receitasRecebidas,
          percentual: totalReceitas > 0 ? (receitasRecebidas / totalReceitas) * 100 : 0,
          count: receitas.data?.length || 0,
        },
        despesas: {
          total: totalDespesas,
          realizado: despesasPagas,
          pendente: totalDespesas - despesasPagas,
          percentual: totalDespesas > 0 ? (despesasPagas / totalDespesas) * 100 : 0,
          count: despesas.data?.length || 0,
        },
        saldo: receitasRecebidas - despesasPagas,
      };
    },
  });

  // Query por empresa
  const { data: empresasData, isLoading: isLoadingEmpresas } = useQuery({
    queryKey: ['drill-empresas', periodo, drillState.categoria],
    queryFn: async () => {
      const tabela = drillState.categoria === 'receitas' ? 'contas_receber' : 'contas_pagar';
      
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, razao_social, nome_fantasia');

      const { data: contas, error } = await supabase
        .from(tabela)
        .select('*')
        .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd'));

      if (error || !contas) return [];

      interface ContaRecord {
        empresa_id: string;
        valor: number;
        status: string;
        valor_recebido?: number;
        valor_pago?: number;
      }

      const porEmpresa = empresas?.map(emp => {
        const contasEmpresa = (contas as ContaRecord[]).filter(c => c.empresa_id === emp.id);
        const total = contasEmpresa.reduce((acc, c) => acc + (c.valor || 0), 0);
        const valorField = drillState.categoria === 'receitas' ? 'valor_recebido' : 'valor_pago';
        const realizado = contasEmpresa
          .filter(c => c.status === 'pago')
          .reduce((acc, c) => acc + ((c[valorField as keyof ContaRecord] as number) || c.valor || 0), 0);

        return {
          id: emp.id,
          nome: emp.nome_fantasia || emp.razao_social,
          total,
          realizado,
          pendente: total - realizado,
          count: contasEmpresa.length,
          percentual: total > 0 ? (realizado / total) * 100 : 0,
        };
      }).filter(e => e.total > 0);

      return porEmpresa?.sort((a, b) => b.total - a.total) || [];
    },
    enabled: drillState.level === 'empresa',
  });

  // Query detalhada por empresa
  const { data: detalhesData, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ['drill-detalhes', periodo, drillState.categoria, drillState.empresaId],
    queryFn: async () => {
      const tabela = drillState.categoria === 'receitas' ? 'contas_receber' : 'contas_pagar';
      const nomeField = drillState.categoria === 'receitas' ? 'cliente_nome' : 'fornecedor_nome';
      
      const { data } = await supabase
        .from(tabela)
        .select('*')
        .eq('empresa_id', drillState.empresaId!)
        .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd'))
        .order('data_vencimento');

      return data?.map(item => {
        const itemRecord = item as Record<string, unknown>;
        return {
          id: item.id,
          descricao: item.descricao,
          entidade: itemRecord[nomeField] as string,
          valor: item.valor,
          vencimento: item.data_vencimento,
          status: item.status,
        };
      }) || [];
    },
    enabled: drillState.level === 'detalhes' && !!drillState.empresaId,
  });

  const handleDrill = (newState: Partial<DrillState>) => {
    setDrillState(prev => ({ ...prev, ...newState }));
  };

  const handleBack = () => {
    if (drillState.level === 'detalhes') {
      setDrillState(prev => ({ ...prev, level: 'empresa', empresaId: undefined }));
    } else if (drillState.level === 'empresa') {
      setDrillState(prev => ({ ...prev, level: 'resumo', categoria: undefined }));
    }
  };

  // Gerar opções de período (últimos 12 meses)
  const periodoOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {drillState.level !== 'resumo' && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>Análise Detalhada</CardTitle>
              <CardDescription>
                {drillState.level === 'resumo' && 'Clique em uma categoria para ver detalhes'}
                {drillState.level === 'empresa' && `${drillState.categoria === 'receitas' ? 'Receitas' : 'Despesas'} por empresa`}
                {drillState.level === 'detalhes' && `Detalhes - ${drillState.empresaNome}`}
              </CardDescription>
            </div>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodoOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {/* Nível 1: Resumo */}
          {drillState.level === 'resumo' && (
            <ResumoDrillLevel
              resumoData={resumoData}
              isLoadingResumo={isLoadingResumo}
              onDrill={(categoria) => handleDrill({ level: 'empresa', categoria })}
              periodo={periodo}
            />
          )}

          {/* Nível 2: Por Empresa */}
          {drillState.level === 'empresa' && (
            <EmpresasDrillLevel
              empresasData={empresasData}
              isLoadingEmpresas={isLoadingEmpresas}
              onSelectEmpresa={(empresaId, empresaNome) => handleDrill({ level: 'detalhes', empresaId, empresaNome })}
            />
          )}

          {/* Nível 3: Detalhes */}
          {drillState.level === 'detalhes' && (
            <DetalhesDrillLevel
              detalhesData={detalhesData}
              isLoadingDetalhes={isLoadingDetalhes}
              categoria={drillState.categoria}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
