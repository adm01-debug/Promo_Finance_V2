import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  index: number;
}

export function ListAnimation({ children, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {children}
    </motion.div>
  );
}
