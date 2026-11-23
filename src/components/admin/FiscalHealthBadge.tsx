import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Scale, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Resumo agregado retornado por `public.get_catalogos_tributarios_health`.
 * Apenas os campos consumidos por este indicador são declarados — o payload
 * completo (achados detalhados) é renderizado pelo painel da Telemetria.
 */
interface CatalogoHealthResumo {
  gerado_em: string;
  ultima_verificacao: string | null;
  criticos: number;
  avisos: number;
  saudavel: boolean;
}

type Estado = 'ok' | 'warning' | 'critical' | 'unknown';

const ESTILO: Record<Estado, string> = {
  ok: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  critical: 'border-destructive/30 bg-destructive/10 text-destructive',
  unknown: 'border-border bg-muted text-muted-foreground',
};

const ICONE: Record<Estado, typeof Scale> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  critical: ShieldAlert,
  unknown: Scale,
};

function formatarData(iso: string | null): string {
  if (!iso) return 'sem verificação registrada';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Indicador compacto de Saúde Fiscal exibido no SRE Command Center.
 *
 * Publica, junto às métricas de confiabilidade, o estado das invariantes dos
 * catálogos tributários (UFs, NCM, CNAE, Simples Nacional, ISS, ST) apuradas
 * pela rotina diária `check_catalogos_tributarios_invariants`.
 *
 * Segurança: a RPC é `SECURITY DEFINER` com guarda de papel `admin`; para
 * usuários sem permissão o componente degrada silenciosamente (não renderiza).
 */
export function FiscalHealthBadge({ className }: { className?: string }) {
  const { currentEmpresaId } = useAuth();

  const { data, isLoading, isError } = useQuery<CatalogoHealthResumo>({
    queryKey: ['catalogos-tributarios-health', 'resumo'],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc('get_catalogos_tributarios_health', {});
      if (error) throw error;
      return data as CatalogoHealthResumo;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Métrica RT: % NF-e com IBS/CBS após FG, lida do último check de conformidade.
  // Sem currentEmpresaId ou sem verificação prévia → null (não mostra "0%").
  const { data: coberturaIbscbs } = useQuery<string | null>({
    queryKey: ['ibscbs-cobertura-badge', currentEmpresaId],
    queryFn: async () => {
      if (!currentEmpresaId) return null;
      const { data: ult } = await supabase
        .from('verificacoes_conformidade')
        .select('itens')
        .eq('empresa_id', currentEmpresaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ult?.itens) return null;
      const checks = ult.itens as Array<{ id: string; status: string; detalhes?: string }>;
      const check = checks.find((c) => c.id === 'nfe_ibscbs_cobertura');
      if (!check) return null;
      // detalhes = "X de Y notas após … sem IBS/CBS (Z%)" → inverter para % com grupo
      const m = check.detalhes?.match(/(\d+) de (\d+)/);
      if (!m) return check.status === 'aprovado' ? '100%' : null;
      const [, sem, total] = m.map(Number);
      if (total === 0) return null;
      const pct = Math.round(((total - sem) / total) * 100);
      return `${pct}%`;
    },
    enabled: !!currentEmpresaId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className={cn('h-9 w-64', className)} />;
  // Sem permissão ou RPC indisponível: não poluímos o cabeçalho com erro.
  if (isError || !data) return null;

  const estado: Estado =
    data.criticos > 0 ? 'critical' : data.avisos > 0 ? 'warning' : data.saudavel ? 'ok' : 'unknown';

  const Icone = ICONE[estado];

  const rotulo =
    estado === 'ok'
      ? 'Catálogos fiscais íntegros'
      : estado === 'critical'
        ? `${data.criticos} invariante(s) crítica(s)`
        : estado === 'warning'
          ? `${data.avisos} aviso(s) fiscais`
          : 'Saúde fiscal indeterminada';

  return (
    <Link
      to="/admin/telemetria"
      aria-label={`Saúde fiscal: ${rotulo}. Abrir painel de telemetria.`}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-90',
        ESTILO[estado],
        className
      )}
    >
      <Icone className="h-4 w-4 shrink-0" aria-hidden />
      <span className="font-medium">Saúde Fiscal</span>
      <Badge variant="outline" className="border-current bg-transparent text-current">
        {rotulo}
      </Badge>
      {/* Métrica RT: % NF-e com IBS/CBS — só exibe quando há dado real */}
      {coberturaIbscbs !== null && coberturaIbscbs !== undefined && (
        <Badge
          variant="outline"
          className="border-current bg-transparent text-current opacity-80"
          title="% de NF-e com IBS/CBS após o Fato Gerador (Reforma Tributária)"
        >
          IBS/CBS {coberturaIbscbs}
        </Badge>
      )}
      <span className="hidden text-xs opacity-80 md:inline">
        verificado em {formatarData(data.ultima_verificacao)}
      </span>
    </Link>
  );
}

export default FiscalHealthBadge;
