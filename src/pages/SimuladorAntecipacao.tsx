import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { SimuladorAntecipacao } from '@/components/simuladores/SimuladorAntecipacao';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export default function SimuladorAntecipacaoPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="relative z-10 space-y-10 pb-20"
        >
          {/* Hero Header Section */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Liquidity Optimization
              </div>
              <h1 className="text-5xl font-black tracking-tighter md:text-6xl lg:text-7xl">
                Simulador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">Antecipação</span>
              </h1>
              <p className="text-xl text-muted-foreground/70 max-w-2xl leading-relaxed font-medium italic">
                Injete capital estratégico no seu fluxo de caixa através da antecipação inteligente de ativos.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <SimuladorAntecipacao />
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
