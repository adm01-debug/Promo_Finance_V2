import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Inbox } from 'lucide-react';

export const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const;

export type UF = (typeof UFS)[number];

/** Formata número como percentual. Aceita fração (0.18) ou pontos (18). */
export function pct(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  const base = Math.abs(valor) <= 1 ? valor * 100 : valor;
  return `${base.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

export interface ResultBlockProps {
  title: string;
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Envelope padrão com estados de carregamento, erro e vazio. */
export function ResultBlock({
  title,
  isLoading,
  error,
  isEmpty,
  emptyLabel = 'Nenhum registro encontrado para os filtros informados.',
  actions,
  children,
}: ResultBlockProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            {error instanceof Error ? error.message : 'Falha ao consultar o catálogo fiscal.'}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox className="h-4 w-4" aria-hidden />
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
