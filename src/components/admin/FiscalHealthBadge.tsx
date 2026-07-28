import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabaseDyn } from "@/lib/supabase-dynamic";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Scale, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

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

type Estado = "ok" | "warning" | "critical" | "unknown";

const ESTILO: Record<Estado, string> = {
  ok: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const ICONE: Record<Estado, typeof Scale> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  critical: ShieldAlert,
  unknown: Scale,
};

function formatarData(iso: string | null): string {
  if (!iso) return "sem verificação registrada";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
  const { data, isLoading, isError } = useQuery<CatalogoHealthResumo>({
    queryKey: ["catalogos-tributarios-health", "resumo"],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc(
        "get_catalogos_tributarios_health",
        {},
      );
      if (error) throw error;
      return data as CatalogoHealthResumo;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) return <Skeleton className={cn("h-9 w-64", className)} />;
  // Sem permissão ou RPC indisponível: não poluímos o cabeçalho com erro.
  if (isError || !data) return null;

  const estado: Estado = data.criticos > 0
    ? "critical"
    : data.avisos > 0
      ? "warning"
      : data.saudavel
        ? "ok"
        : "unknown";

  const Icone = ICONE[estado];

  const rotulo = estado === "ok"
    ? "Catálogos fiscais íntegros"
    : estado === "critical"
      ? `${data.criticos} invariante(s) crítica(s)`
      : estado === "warning"
        ? `${data.avisos} aviso(s) fiscais`
        : "Saúde fiscal indeterminada";

  return (
    <Link
      to="/admin/telemetria"
      aria-label={`Saúde fiscal: ${rotulo}. Abrir painel de telemetria.`}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-90",
        ESTILO[estado],
        className,
      )}
    >
      <Icone className="h-4 w-4 shrink-0" aria-hidden />
      <span className="font-medium">Saúde Fiscal</span>
      <Badge variant="outline" className="border-current bg-transparent text-current">
        {rotulo}
      </Badge>
      <span className="hidden text-xs opacity-80 md:inline">
        verificado em {formatarData(data.ultima_verificacao)}
      </span>
    </Link>
  );
}

export default FiscalHealthBadge;
