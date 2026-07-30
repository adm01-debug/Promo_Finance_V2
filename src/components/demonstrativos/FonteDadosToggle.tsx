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
    <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl p-4 flex flex-col gap-3 shadow-sm ring-1 ring-white/10">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Database className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase opacity-70">Origem dos Dados</span>
        </div>

        <Tabs value={value} onValueChange={(v) => onChange(v as FonteDemonstrativo)} className="ml-2">
          <TabsList className="bg-muted/50 p-1 h-10 rounded-xl border border-border/50">
            <TabsTrigger 
              value="competencia" 
              disabled={!hasContabilidade} 
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
            >
              <Database className="h-3.5 w-3.5" />
              Competência
            </TabsTrigger>
            <TabsTrigger 
              value="caixa" 
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
            >
              <Wallet className="h-3.5 w-3.5" />
              Caixa
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="hover:scale-110 transition-transform">
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-4 rounded-xl border-border/50 shadow-xl">
              <div className="space-y-2">
                <p className="text-xs">
                  <strong className="text-primary">Competência:</strong> Foco no fato gerador. Utiliza as partidas dobradas da escrituração contábil.
                </p>
                <p className="text-xs">
                  <strong className="text-primary">Caixa:</strong> Foco no fluxo financeiro. Utiliza liquidações de contas a pagar e receber.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {value === 'competencia' && (
          <Badge variant="outline" className="ml-auto bg-primary/5 border-primary/20 text-primary font-bold px-3 py-1 rounded-lg">
            {totalPartidas.toLocaleString()} partidas processadas
          </Badge>
        )}
      </div>

      {!hasContabilidade && (
        <Alert className="border-warning/20 bg-warning/5 rounded-xl border-dashed py-2 px-3">
          <AlertDescription className="text-[11px] text-muted-foreground flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            <span>Ausência de lançamentos contábeis no período. O sistema está operando em <strong>Modo de Contingência (Regime de Caixa)</strong>.</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
