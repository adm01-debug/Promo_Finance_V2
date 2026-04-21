import { Info, Database, Wallet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';

interface Props {
  value: FonteDemonstrativo;
  onChange: (v: FonteDemonstrativo) => void;
  totalPartidas: number;
  hasContabilidade: boolean;
}

export const FonteDadosToggle = ({ value, onChange, totalPartidas, hasContabilidade }: Props) => {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Fonte de dados:</span>
        <Tabs value={value} onValueChange={(v) => onChange(v as FonteDemonstrativo)}>
          <TabsList>
            <TabsTrigger value="competencia" disabled={!hasContabilidade} className="gap-2">
              <Database className="h-3.5 w-3.5" />
              Competência
            </TabsTrigger>
            <TabsTrigger value="caixa" className="gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Caixa
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                <strong>Competência:</strong> reconhece receitas e despesas quando o fato ocorre (partidas contábeis).<br />
                <strong>Caixa:</strong> reconhece quando o dinheiro entra ou sai (contas pagas/recebidas).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {value === 'competencia' && (
          <Badge variant="secondary" className="ml-auto">
            {totalPartidas} {totalPartidas === 1 ? 'partida' : 'partidas'} no período
          </Badge>
        )}
      </div>

      {!hasContabilidade && value === 'caixa' && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertDescription className="text-xs">
            Sem lançamentos contábeis para este período. Importe lançamentos no módulo <strong>Contabilidade</strong> para usar o regime de Competência.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
