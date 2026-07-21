import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, History, Layers, ShieldCheck, Zap } from 'lucide-react';
import type { HistoricoRow } from './types';

interface Props {
  historicoFiltrado: HistoricoRow[];
  ano: number;
}

export function SpedKpiCards({ historicoFiltrado, ano }: Props) {
  const sucesso = historicoFiltrado.length > 0
    ? Math.round((historicoFiltrado.filter(h => h.status === 'transmitido' || h.status === 'gerado').length / historicoFiltrado.length) * 100)
    : 100;
  const totalLanc = historicoFiltrado.reduce((acc, h) => acc + h.total_lancamentos, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
          <History className="h-20 w-20 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Gerado</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-4xl font-black tracking-tighter tabular-nums">{historicoFiltrado.length}</p>
          <span className="text-[10px] font-bold text-primary/60">Arquivos em {ano}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
          <ShieldCheck className="h-20 w-20 text-success" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Taxa de Sucesso</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-4xl font-black tracking-tighter tabular-nums text-success">{sucesso}%</p>
          <CheckCircle2 className="h-4 w-4 text-success opacity-40" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
          <Layers className="h-20 w-20 text-purple-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Volume Analítico</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-black tracking-tighter tabular-nums">{totalLanc.toLocaleString('pt-BR')}</p>
          <span className="text-[10px] font-bold opacity-40">Lanç.</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
          <Cpu className="h-20 w-20 text-orange-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Processamento</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-black tracking-tighter tabular-nums">High-Speed</p>
          <Zap className="h-4 w-4 text-orange-400 opacity-40" />
        </div>
      </motion.div>
    </div>
  );
}
