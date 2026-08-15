import { motion } from 'framer-motion';
import { Building2, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { RecebiveisDisponiveis, SimulacaoResultado } from './simulador-antecipacao.config';

export function RecebivelItem({ rec, selecionado, onClick }: { rec: RecebiveisDisponiveis; selecionado: boolean; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "p-5 rounded-2xl cursor-pointer transition-all border group",
        selecionado
          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
          : "bg-card/5 border-white/5 hover:bg-card/10 hover:border-white/10"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
            selecionado ? "bg-primary text-primary-foreground" : "bg-card/10 text-muted-foreground/60"
          )}>
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black text-sm tracking-tight">{rec.cliente_nome}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {format(new Date(rec.data_vencimento), "dd MMM yyyy", { locale: ptBR })}
              <span className="w-1 h-1 rounded-full bg-card/20" />
              Horizonte: {rec.diasParaVencimento}d
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-black text-lg tracking-tighter",
            selecionado ? "text-primary" : "text-foreground"
          )}>
            {formatCurrency(rec.valor)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function MelhorOpcaoCard({ melhorOpcao }: { melhorOpcao: SimulacaoResultado }) {
  return (
    <motion.div
      layoutId="best-option"
      className="p-8 rounded-[2rem] bg-gradient-to-br from-success/20 via-primary/10 to-transparent border border-success/30 shadow-[0_20px_40px_-15px_rgba(34,197,94,0.2)] relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-24 w-24 text-success" />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-success">Optimal Liquidity Vector Detected</span>
          <Badge variant="outline" className="bg-success/10 border-success/20 text-success text-[10px] font-black uppercase px-3 py-1">{melhorOpcao.instituicao.nome}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Immediate Net Value</p>
            <p className="text-4xl font-black tracking-tighter text-success shadow-success/20">{formatCurrency(melhorOpcao.valorLiquido)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Baseline Fee (Monthly)</p>
            <p className="text-4xl font-black tracking-tighter">{melhorOpcao.instituicao.taxaMensal}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Execution Window</p>
            <p className="text-4xl font-black tracking-tighter text-primary">⚡ {melhorOpcao.instituicao.prazoAprovacao}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
