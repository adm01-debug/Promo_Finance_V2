import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { FileCheck, Sparkles } from 'lucide-react';
import { AssistenteFechamentoMensal } from '@/components/tributario/dashboard/AssistenteFechamentoMensal';
import { motion } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';

export default function FechamentoMensalPage() {
  const { currentEmpresaId } = useAuth();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10 space-y-8">
          <PageHeader 
            title="Fechamento Mensal Tributário" 
            subtitle="Assistente inteligente para conferência, conciliação e encerramento do período fiscal."
            badge="Fiscal Compliance"
            icon={FileCheck}
            gradientFrom="from-emerald-600"
            gradientVia="via-primary"
            gradientTo="to-blue-500"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/5 border border-white/10 text-foreground/60 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              Quantum AI Assistant
            </div>
          </PageHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AssistenteFechamentoMensal 
              empresaId={currentEmpresaId || ''} 
              ano={currentYear} 
              mes={currentMonth} 
            />
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

