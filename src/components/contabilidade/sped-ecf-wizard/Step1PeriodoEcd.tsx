import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Building2, Calendar, ChevronRight, FileText, Hash, Link2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SpedEcfValidacaoResult } from '@/hooks/useSpedContabil';
import { MetaField } from './wizard-atoms';

interface Props {
  data: SpedEcfValidacaoResult;
  onNext: () => void;
}

export function Step1PeriodoEcd({ data, onNext }: Props) {
  const ecd = data.ecd_referencia;

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm p-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <MetaField icon={Building2} label="Empresa" value={data.empresa.razao_social} />
          </div>
          <div id="wz-meta-cnpj" className="rounded-md transition-colors">
            <MetaField icon={Hash} label="CNPJ" value={data.empresa.cnpj} mono />
          </div>
          <div id="wz-meta-periodo" className="rounded-md transition-colors">
            <MetaField
              icon={Calendar}
              label="Período"
              value={`${data.periodo.inicio} → ${data.periodo.fim}`}
            />
          </div>
          <div>
            <MetaField
              icon={FileText}
              label="Lançamentos no período"
              value={String(data.total_lancamentos)}
              mono
            />
          </div>
        </div>
      </div>

      {ecd ? (
        <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-5 space-y-3 animate-scale-in">
          <div className="flex items-center gap-2 text-sm font-semibold font-display tracking-tight text-success">
            <Link2 className="h-4 w-4" /> ECD vinculada localizada
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Gerada em</p>
              <p className="font-mono text-sm text-foreground">
                {format(new Date(ecd.created_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
            <div id="wz-ecd-status" className="space-y-1 rounded-md transition-colors">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Status</p>
              <Badge
                className={cn(
                  ecd.status === 'transmitido'
                    ? 'bg-success/15 text-success border-success/30'
                    : 'bg-muted text-muted-foreground border-border',
                )}
                variant="outline"
              >
                {ecd.status}
              </Badge>
            </div>
            <div id="wz-ecd-hash" className="col-span-2 space-y-1 rounded-md transition-colors">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Hash SHA-256</p>
              <code className="text-xs font-mono text-foreground">
                {(ecd.hash_sha256 || '').substring(0, 32)}…
              </code>
            </div>
            {ecd.recibo_transmissao && (
              <div className="col-span-2 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  Recibo de transmissão
                </p>
                <p className="font-mono text-xs text-foreground">{ecd.recibo_transmissao}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Alert variant="error" title="ECD do período não localizada">
          <AlertDescription>
            Gere e (idealmente) transmita a SPED ECD do mesmo ano-calendário antes de prosseguir com a ECF.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <div className="flex-1" />
        <Button onClick={onNext} className="hover-scale gap-1">
          Próximo: Validações <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
