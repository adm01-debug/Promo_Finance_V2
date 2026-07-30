import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertOctagon, ShieldCheck, Package } from "lucide-react";
import { useComplianceKpis } from "@/hooks/useComplianceKpis";

export function ComplianceKpis() {
  const { data, isLoading } = useComplianceKpis();

  const items = [
    {
      label: "Eventos (24h)",
      value: data?.eventos24h ?? 0,
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Ações críticas pendentes",
      value: data?.acoesCriticasPendentes ?? 0,
      icon: AlertOctagon,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Score conformidade médio",
      value: `${data?.scoreConformidadeMedio ?? 0}/100`,
      icon: ShieldCheck,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Pacotes evidência (mês)",
      value: data?.pacotesGeradosMes ?? 0,
      icon: Package,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold font-display">{item.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
