/**
 * EmpresaActionPicker — selecionar o CNPJ no momento de uma ação
 * (faturar/comprar/emitir boleto). Sempre manual; recomendação da IA
 * tributária destacada e auditada.
 */
import { useMemo } from 'react';
import { Sparkles, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmpresaScope } from '@/contexts/EmpresaScopeContext';
import { EmpresaBadge } from './EmpresaBadge';
import {
  recomendarEmpresa,
  type ContextoOperacao,
  type EmpresaCandidata,
} from '@/lib/tributario/recomendar-empresa';
import type { RegimeTributario } from '@/lib/tributario/types';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface EmpresaActionPickerProps {
  value: string | null;
  onChange: (empresaId: string) => void;
  contexto: ContextoOperacao;
  /** Mapa empresaId → metadados tributários (opcional; fallback: tudo Lucro Real) */
  metaPorEmpresa?: Record<string, { regime: RegimeTributario; rbt12?: number; creditoIcms?: number }>;
  label?: string;
}

export function EmpresaActionPicker({
  value,
  onChange,
  contexto,
  metaPorEmpresa = {},
  label = 'Faturar/registrar por qual CNPJ?',
}: EmpresaActionPickerProps) {
  const { availableEmpresas, ids } = useEmpresaScope();

  const ranking = useMemo(() => {
    const candidatas: EmpresaCandidata[] = availableEmpresas
      .filter((v) => ids.includes(v.empresa_id))
      .map((v) => {
        const meta = metaPorEmpresa[v.empresa_id];
        return {
          id: v.empresa_id,
          nome: v.empresa.nome_fantasia || v.empresa.razao_social,
          cnpj: v.empresa.cnpj,
          regime: meta?.regime ?? 'lucro_real',
          rbt12: meta?.rbt12,
          creditoIcms: meta?.creditoIcms,
          ativa: true,
        };
      });
    return recomendarEmpresa(candidatas, contexto);
  }, [availableEmpresas, ids, metaPorEmpresa, contexto]);

  const recomendadaId = ranking[0]?.empresaId ?? null;

  const handlePick = async (empresaId: string) => {
    onChange(empresaId);
    // Audit: registrar escolha + se aceitou recomendação
    try {
      const aceitouRecomendacao = empresaId === recomendadaId;
      const rec = ranking.find((r) => r.empresaId === empresaId);
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert([{
        user_id: user?.id ?? null,
        action: 'empresa_action_pick',
        table_name: 'empresas',
        record_id: empresaId,
        details: `Operação ${contexto.tipo} por ${empresaId}${aceitouRecomendacao ? ' (aceitou sugestão IA)' : ' (rejeitou sugestão IA)'}`,
        new_data: {
          empresa_id: empresaId,
          recomendada_id: recomendadaId,
          aceitou_recomendacao: aceitouRecomendacao,
          score: rec?.score,
          contexto: contexto as unknown as Record<string, unknown>,
        },
      }]);
    } catch (err) {
      logger.warn('[EmpresaActionPicker] falha ao auditar escolha', err);
    }
  };

  if (ranking.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border">
        Nenhuma empresa em escopo. Ajuste o seletor de empresas no topo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="grid gap-2">
        {ranking.map((rec) => {
          const vinculo = availableEmpresas.find((v) => v.empresa_id === rec.empresaId);
          if (!vinculo) return null;
          const isSelected = value === rec.empresaId;
          const isRecommended = rec.empresaId === recomendadaId;
          const label = vinculo.empresa.nome_fantasia || vinculo.empresa.razao_social;

          return (
            <button
              type="button"
              key={rec.empresaId}
              onClick={() => handlePick(rec.empresaId)}
              aria-pressed={isSelected}
              className={cn(
                'w-full text-left p-3 rounded-xl border transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
              )}
            >
              <div className="flex items-start gap-3">
                <EmpresaBadge empresaId={rec.empresaId} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{label}</span>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                        <Sparkles className="h-3 w-3" />
                        Sugerida pela IA
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">score {rec.score}</span>
                  </div>
                  {rec.motivos.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {rec.motivos.slice(0, 2).map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <ShieldCheck className="h-3 w-3 mt-0.5 text-success shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {rec.alertas.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {rec.alertas.slice(0, 2).map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-warning">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
