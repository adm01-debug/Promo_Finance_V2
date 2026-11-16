// Titulo em aberto. 'vencido' entra: marcar_contas_vencidas() passa
// 'pendente' -> 'vencido' no vencimento e a divida continua devida.
export const tituloEmAberto = (status?: string | null) =>
  status === 'pendente' || status === 'vencido';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 350, damping: 26 },
  },
};

export const heroVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24, delay: 0.15 },
  },
};
