import type React from "react";

interface KpiBoxProps {
  label: string;
  valor: number;
  icon: React.ReactNode;
  destaque?: boolean;
}

export function KpiBox({ label, valor, icon, destaque }: KpiBoxProps) {
  return (
    <div
      className={`rounded-md border p-3 ${
        destaque ? "border-destructive/40 bg-destructive/5" : "bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{valor}</div>
    </div>
  );
}
