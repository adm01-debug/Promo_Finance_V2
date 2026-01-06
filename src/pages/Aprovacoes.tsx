import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { InteractivePageWrapper, useCelebrations } from '@/components/wrappers';
import { AprovacoesPendentes } from '@/components/aprovacoes/AprovacoesPendentes';
import { ConfiguracaoAprovacaoCard } from '@/components/aprovacoes/ConfiguracaoAprovacaoCard';
import { HistoricoAprovacoes } from '@/components/aprovacoes/HistoricoAprovacoes';
import { PasswordResetApprovals } from '@/components/aprovacoes/PasswordResetApprovals';
import { useAuth } from '@/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Aprovacoes = () => {
  const { isAdmin } = useAuth();

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Aprovações</h1>
              <p className="text-muted-foreground">
                Workflow de aprovação de pagamentos
              </p>
            </div>
          </div>
        </motion.div>

        {/* Configurações e Reset de Senha - apenas admin */}
        {isAdmin && (
          <>
            <motion.div variants={itemVariants}>
              <ConfiguracaoAprovacaoCard />
            </motion.div>
            <motion.div variants={itemVariants}>
              <PasswordResetApprovals />
            </motion.div>
          </>
        )}

        {/* Grid Principal */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <AprovacoesPendentes />
          </motion.div>
          <motion.div variants={itemVariants}>
            <HistoricoAprovacoes />
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default Aprovacoes;
