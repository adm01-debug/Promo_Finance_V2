import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ResumoMonofasico } from '@/lib/tributario/monofasico';
import { Coins, PiggyBank, Receipt, Percent } from 'lucide-react';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

interface ResumoCardsProps {
  resumo: ResumoMonofasico;
}

export function ResumoCards({ resumo }: ResumoCardsProps) {
  const participacao = resumo.receitaTotal > 0
    ? (resumo.receitaMonofasica / resumo.receitaTotal) * 100
    : 0;

  const cards = [
    {
      label: 'Receita monofásica',
      valor: brl(resumo.receitaMonofasica),
      detalhe: `${participacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da receita informada`,
      icon: Coins,
      tone: 'text-primary',
    },
    {
      label: 'PIS/COFINS devido',
      valor: brl(resumo.totalMonofasico),
      detalhe: 'Somente na etapa concentrada',
      icon: Receipt,
      tone: 'text-foreground',
    },
    {
      label: 'Se tratada como receita comum',
      valor: brl(resumo.totalSeRegimeNormal),
      detalhe: 'Recolhimento indevido evitado',
      icon: Percent,
      tone: 'text-warning',
    },
    {
      label: 'Economia no período',
      valor: brl(resumo.economiaAnual),
      detalhe: 'Diferença apurada',
      icon: PiggyBank,
      tone: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, valor, detalhe, icon: Icon, tone }) => (
        <Card key={label} className="border-border/60 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={cn('h-4 w-4 shrink-0', tone)} aria-hidden="true" />
            </div>
            <p className={cn('mt-2 text-xl font-semibold tabular-nums', tone)}>{valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
