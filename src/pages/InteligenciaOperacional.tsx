import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { CentroAcoesInteligentes } from '@/components/dashboard/CentroAcoesInteligentes';
import { MainLayout } from '@/components/layout/MainLayout';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InteligenciaOperacionalPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Inteligência Operacional</h1>
          </div>
          <p className="text-muted-foreground">Monitoramento neural e ações automáticas baseadas em IA</p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <HealthScoreCard />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <CentroAcoesInteligentes />
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
