import { motion } from 'framer-motion';
import { HeroKPIs } from './HeroKPIs';
import { itemVariants } from './DashboardReformaTributaria.helpers';

interface DashboardReformaTributariaConteudoProps {
  metricas: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/types/reforma-tributaria').MetricasReformaTributaria;
  aliquotasAtuais: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/types/reforma-tributaria').AliquotasTransicao;
  alertasCriticos: number;
  handleKPIClick: (tabId: string) => void;
}

export function DashboardReformaTributariaConteudo({
  metricas,
  aliquotasAtuais,
  alertasCriticos,
  handleKPIClick,
}: DashboardReformaTributariaConteudoProps) {
  return (
    <motion.div variants={itemVariants}>
      <HeroKPIs
        cargaTributaria={metricas?.cargaTributariaEfetiva || 0}
        cbsSaldo={metricas?.cbsSaldoAPagar || 0}
        ibsSaldo={metricas?.ibsSaldoAPagar || 0}
        creditosDisponiveis={metricas?.creditosDisponiveis || 0}
        creditosUtilizados={metricas?.creditosUtilizados || 0}
        creditosAcumulados={metricas?.creditosAcumulados || 0}
        percentualMigracao={metricas?.percentualMigracao || 0}
        aliquotaCbs={aliquotasAtuais.cbs}
        aliquotaIbs={aliquotasAtuais.ibs}
        alertasCriticos={alertasCriticos}
        onKPIClick={handleKPIClick}
      />
    </motion.div>
  );
}
