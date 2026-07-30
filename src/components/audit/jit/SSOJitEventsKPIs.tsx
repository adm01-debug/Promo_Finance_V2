import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Users, KeyRound, Layers } from 'lucide-react';
import type { JitAuditEvent } from '@/hooks/useSSOJitEvents';

interface Props {
  events: JitAuditEvent[];
}

export function SSOJitEventsKPIs({ events }: Props) {
  const total = events.length;
  const oidc = events.filter((e) => e.new_data?.provider_tipo === 'oidc').length;
  const saml = events.filter((e) => e.new_data?.provider_tipo === 'saml').length;

  const providerCounts = new Map<string, number>();
  const roleCounts = new Map<string, number>();
  let viaGroup = 0;
  for (const e of events) {
    const p = e.new_data?.provider_nome ?? '—';
    providerCounts.set(p, (providerCounts.get(p) ?? 0) + 1);
    const r = e.new_data?.role ?? '—';
    roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
    if (e.new_data?.matched_group) viaGroup++;
  }
  const topProvider = [...providerCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topRole = [...roleCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const pctGroup = total ? Math.round((viaGroup / total) * 100) : 0;

  const cards = [
    {
      label: 'Total Provisionados',
      value: total,
      sub: `${oidc} OIDC · ${saml} SAML`,
      icon: ShieldCheck,
      tone: 'bg-primary/10 text-primary',
    },
    {
      label: 'Top Provider',
      value: topProvider?.[0] ?? '—',
      sub: topProvider ? `${topProvider[1]} usuário(s)` : 'Sem dados',
      icon: Layers,
      tone: 'bg-accent/10 text-accent',
    },
    {
      label: 'Role mais aplicada',
      value: topRole?.[0] ?? '—',
      sub: topRole ? `${topRole[1]} aplicações` : 'Sem dados',
      icon: KeyRound,
      tone: 'bg-success/10 text-success',
    },
    {
      label: 'Via Grupo Mapeado',
      value: `${pctGroup}%`,
      sub: `${viaGroup} de ${total} via grupo`,
      icon: Users,
      tone: 'bg-secondary/10 text-secondary',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold truncate">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-[11px] text-muted-foreground/80 truncate">{c.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
