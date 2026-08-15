export const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(142 76% 36%)",
  "hsl(221 83% 53%)",
  "hsl(262 83% 58%)",
];

export const getRiskColor = (taxa: number) => {
  if (taxa >= 30) return "destructive";
  if (taxa >= 15) return "warning";
  return "success";
};

export const getRiskBg = (taxa: number) => {
  if (taxa >= 30) return "bg-destructive/10 border-destructive/20";
  if (taxa >= 15) return "bg-warning/10 border-warning/20";
  return "bg-success/10 border-success/20";
};
