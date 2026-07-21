import { Banknote, Gavel } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getEtapaCobrancaLabel } from '@/lib/formatters';
import type { StatusPagamento } from '@/types/financial';
import { etapaColors, etapaIcons, statusConfig, tipoCobrancaConfig, type ContaReceberWithRelations } from './rowConfig';

export function StatusCell({ conta }: { conta: ContaReceberWithRelations }) {
  const status = statusConfig[conta.status as StatusPagamento];
  const StatusIcon = status?.icon;
  const tipo = tipoCobrancaConfig[conta.tipo_cobranca || 'boleto'];
  const TipoIcon = tipo?.icon;
  const etapa = conta.etapa_cobranca as string | null;
  const EtapaIcon = etapa ? etapaIcons[etapa] : null;

  return (
    <TableCell className="p-6">
      <div className="flex flex-col gap-1.5 items-center lg:items-start">
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest',
            status?.color,
          )}
        >
          {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />} {status?.label || conta.status}
        </Badge>
        <div className="flex gap-1 flex-wrap justify-center lg:justify-start">
          {tipo && TipoIcon && (
            <Badge
              variant="outline"
              className={cn(
                'gap-1 px-1.5 py-0 h-4 rounded-md border-none font-black text-[8px] uppercase tracking-wider opacity-60',
                tipo.color,
              )}
            >
              <TipoIcon className="h-2 w-2" /> {tipo.label}
            </Badge>
          )}
          {EtapaIcon && etapa && (
            <Badge
              variant="outline"
              className={cn(
                'gap-1 px-1.5 py-0 h-4 rounded-md border-none font-black text-[8px] uppercase tracking-wider',
                etapaColors[etapa] || '',
              )}
            >
              <EtapaIcon className="h-2 w-2" /> {getEtapaCobrancaLabel(etapa)}
            </Badge>
          )}
          {conta.has_protesto && (
            <Badge
              variant="outline"
              className="gap-1 px-1.5 py-0 h-4 rounded-md border-none font-black text-[8px] uppercase tracking-wider bg-destructive/10 text-destructive"
            >
              <Gavel className="h-2 w-2" /> Protestado
            </Badge>
          )}
          {conta.has_boleto && (
            <Badge
              variant="outline"
              className="gap-1 px-1.5 py-0 h-4 rounded-md border-none font-black text-[8px] uppercase tracking-wider bg-primary/10 text-primary"
            >
              <Banknote className="h-2 w-2" /> Boleto
            </Badge>
          )}
        </div>
      </div>
    </TableCell>
  );
}

export function ScoreCell({ conta }: { conta: ContaReceberWithRelations }) {
  const clienteData = conta.clientes;
  if (!clienteData?.score) return <TableCell className="p-6" />;
  const { getScoreColor, getScoreLabel } = require('./rowConfig');
  return (
    <TableCell className="p-6">
      <div className="flex flex-col items-center">
        <div className={cn('text-lg font-black tabular-nums tracking-tighter leading-none', getScoreColor(clienteData.score))}>
          {clienteData.score}
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">
          {getScoreLabel(clienteData.score)}
        </span>
      </div>
    </TableCell>
  );
}
