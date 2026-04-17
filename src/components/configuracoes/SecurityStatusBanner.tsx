// ============================================
// COMPONENT: SecurityStatusBanner
// Transparência de configuração de segurança (admin-only)
// ============================================
import { ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityCheckProps {
  ok: boolean;
  title: string;
  description: string;
  badge: string;
}

function SecurityCheck({ ok, title, description, badge }: SecurityCheckProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card p-3">
      {ok ? (
        <ShieldCheck className="h-5 w-5 shrink-0 text-success mt-0.5" aria-hidden />
      ) : (
        <ShieldAlert className="h-5 w-5 shrink-0 text-warning mt-0.5" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{title}</p>
          <Badge variant={ok ? 'secondary' : 'outline'}>{badge}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SecurityStatusBanner() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <CardTitle>Status de Segurança da Plataforma</CardTitle>
            <CardDescription>
              Configurações críticas auditadas e dívidas técnicas conhecidas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SecurityCheck
          ok
          badge="Ativo"
          title="Proteção contra senhas vazadas (HIBP)"
          description="O Supabase Auth bloqueia automaticamente senhas presentes no banco Have I Been Pwned no momento do cadastro e troca."
        />
        <SecurityCheck
          ok
          badge="Hardenizada"
          title="RLS rate_limit_logs"
          description="Logs de rate limit só podem ser inseridos por usuários autenticados em seus próprios registros — política revisada no Lote 8."
        />
        <SecurityCheck
          ok
          badge="Auditado"
          title="RLS em tabelas sensíveis"
          description="Todas as tabelas financeiras têm políticas restritivas baseadas em empresa_id e roles via has_role()."
        />
        <SecurityCheck
          ok={false}
          badge="Aceito"
          title="Extensão pg_net no schema public"
          description="Limitação técnica do PostgreSQL: ALTER EXTENSION pg_net SET SCHEMA não é suportado. Risco mitigado por RLS e ausência de dados sensíveis na extensão."
        />

        <div className="flex items-start gap-2 rounded-md border border-info/40 bg-info/5 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-info mt-0.5" aria-hidden />
          <span>
            Consulte <code className="rounded bg-muted px-1">mem://security/manual-configuration-requirements</code>
            {' '}para o histórico completo de decisões de segurança.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
