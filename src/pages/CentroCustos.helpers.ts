export const COLORS = [
  'hsl(24, 95%, 46%)',
  'hsl(215, 90%, 42%)',
  'hsl(150, 70%, 32%)',
  'hsl(275, 75%, 48%)',
  'hsl(42, 95%, 48%)',
];

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;
