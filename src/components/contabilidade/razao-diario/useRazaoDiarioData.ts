import { useMemo } from 'react';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useEmpresas } from '@/hooks/useFinancialData';
import type { EmpresaHeader } from '@/lib/export-contabil';
import type { PartidaFlat, RazaoGrupo } from './types';

interface Params {
  empresaId?: string;
  ano: number;
  dataInicio: string;
  dataFim: string;
  contaId: string;
  busca: string;
}

export function useRazaoDiarioData({ empresaId, ano, dataInicio, dataFim, contaId, busca }: Params) {
  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);
  const { data: empresas = [] } = useEmpresas();

  const empresaHeader = useMemo<EmpresaHeader | undefined>(() => {
    const e = (empresas as Array<Record<string, unknown>>).find((x) => x.id === empresaId);
    if (!e) return undefined;
    return {
      razao_social: (e.razao_social as string) ?? null,
      nome_fantasia: (e.nome_fantasia as string) ?? null,
      cnpj: (e.cnpj as string) ?? null,
    };
  }, [empresas, empresaId]);

  const todasPartidas = useMemo<PartidaFlat[]>(() => {
    const arr: PartidaFlat[] = [];
    for (const l of lancs as Array<Record<string, unknown>>) {
      const partidas = (l.partidas as Array<Record<string, unknown>>) || [];
      for (const p of partidas) {
        const conta = (p.conta as Record<string, unknown>) || {};
        const valor = Number(p.valor) || 0;
        arr.push({
          data: String(l.data_lancamento),
          numero: (l.numero_lancamento as number) ?? null,
          historico: String(l.historico ?? ''),
          conta_id: String(p.conta_id ?? ''),
          conta_codigo: String(conta.codigo ?? ''),
          conta_nome: String(conta.nome ?? conta.descricao ?? ''),
          debito: p.tipo === 'D' ? valor : 0,
          credito: p.tipo === 'C' ? valor : 0,
        });
      }
    }
    return arr;
  }, [lancs]);

  const partidasFiltradas = useMemo(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);
    const term = busca.trim().toLowerCase();
    return todasPartidas.filter((p) => {
      const d = new Date(`${p.data}T00:00:00`);
      if (d < ini || d > fim) return false;
      if (contaId !== 'todas' && p.conta_id !== contaId) return false;
      if (term && !`${p.historico} ${p.conta_codigo} ${p.conta_nome}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [todasPartidas, dataInicio, dataFim, contaId, busca]);

  const diario = useMemo(
    () => [...partidasFiltradas].sort((a, b) => a.data.localeCompare(b.data)),
    [partidasFiltradas],
  );

  const totaisDiario = useMemo(
    () => diario.reduce(
      (acc, p) => ({ debito: acc.debito + p.debito, credito: acc.credito + p.credito }),
      { debito: 0, credito: 0 },
    ),
    [diario],
  );

  const razao = useMemo<RazaoGrupo[]>(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    const saldoInicialMap = new Map<string, number>();
    for (const p of todasPartidas) {
      if (contaId !== 'todas' && p.conta_id !== contaId) continue;
      const d = new Date(`${p.data}T00:00:00`);
      if (d < ini) {
        saldoInicialMap.set(p.conta_id, (saldoInicialMap.get(p.conta_id) || 0) + p.debito - p.credito);
      }
    }
    const grupos = new Map<string, RazaoGrupo>();
    for (const p of partidasFiltradas) {
      let g = grupos.get(p.conta_id);
      if (!g) {
        g = {
          conta_id: p.conta_id,
          codigo: p.conta_codigo,
          nome: p.conta_nome,
          saldo_inicial: saldoInicialMap.get(p.conta_id) || 0,
          movs: [],
        };
        grupos.set(p.conta_id, g);
      }
      g.movs.push(p);
    }
    for (const g of grupos.values()) {
      g.movs.sort((a, b) => a.data.localeCompare(b.data));
    }
    return Array.from(grupos.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [partidasFiltradas, todasPartidas, dataInicio, contaId]);

  return { isLoading, plano, empresaHeader, diario, totaisDiario, razao };
}
