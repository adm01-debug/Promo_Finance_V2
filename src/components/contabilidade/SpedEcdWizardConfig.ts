export type Step = 1 | 2 | 3;

export const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Período' },
  { n: 2, label: 'Validações' },
  { n: 3, label: 'Download' },
];
