import { todayISOLocal } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  DollarSign,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { PaginationControls } from './BlingShared';
import type { BlingContaFinanceira } from './BlingFinanceiroPanel.types';

/* eslint-disable @typescript-eslint/no-explicit-any -- tipos herdados dos valores de origem (já eram any) */
interface BlingFinanceiroPanelFinanceiroProps {
  tipo: 'receber' | 'pagar';
  setTipo: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      'receber' | 'pagar'
    >
  >;
  setPagina: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<number>
  >;
  refetch: (
    options?: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@tanstack/query-core/build/modern/hydration-BlEVG2Lp').aq
  ) => Promise<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@tanstack/query-core/build/modern/hydration-BlEVG2Lp').aH<
      any,
      Error
    >
  >;
  isFetching: boolean;
  contas: any;
  setBaixaForm: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<{
      valorRecebido: string;
      data: string;
    }>
  >;
  setShowBaixa: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<{
      id: string;
      tipo: 'receber' | 'pagar';
    }>
  >;
  setConfirmEstorno: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<{
      id: string;
      tipo: 'receber' | 'pagar';
    }>
  >;
  setConfirmExclusao: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<{
      id: string;
      tipo: 'receber' | 'pagar';
    }>
  >;
  pagina: number;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function BlingFinanceiroPanelFinanceiro({
  tipo,
  setTipo,
  setPagina,
  refetch,
  isFetching,
  contas,
  setBaixaForm,
  setShowBaixa,
  setConfirmEstorno,
  setConfirmExclusao,
  pagina,
}: BlingFinanceiroPanelFinanceiroProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Financeiro
        </CardTitle>
        <CardDescription>Contas a receber e a pagar — baixa, estorno, exclusão</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={tipo === 'receber' ? 'default' : 'outline'}
            onClick={() => {
              setTipo('receber');
              setPagina(1);
            }}
          >
            A Receber
          </Button>
          <Button
            variant={tipo === 'pagar' ? 'default' : 'outline'}
            onClick={() => {
              setTipo('pagar');
              setPagina(1);
            }}
          >
            A Pagar
          </Button>
          <Button
            onClick={() => {
              setPagina(1);
              refetch();
            }}
            disabled={isFetching}
            variant="outline"
            className="gap-1.5"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}{' '}
            Carregar
          </Button>
        </div>
        {contas.length === 0 && !isFetching && (
          <EmptyState
            icon={DollarSign}
            title={`Nenhuma conta a ${tipo}`}
            description="Carregue as contas financeiras do Bling"
          />
        )}
        {contas.length > 0 && (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-10">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.map((c: BlingContaFinanceira) => {
                    const sitLabel =
                      c.situacao === 1
                        ? 'Em aberto'
                        : c.situacao === 2
                          ? tipo === 'receber'
                            ? 'Recebido'
                            : 'Pago'
                          : c.situacao === 3
                            ? 'Parcial'
                            : c.situacao === 4
                              ? 'Vencido'
                              : c.situacao === 5
                                ? 'Cancelado'
                                : c.situacao === 6
                                  ? 'Inadimplente'
                                  : `#${c.situacao}`;
                    const sitVariant: 'outline' | 'default' | 'destructive' | 'secondary' =
                      c.situacao === 1
                        ? 'outline'
                        : c.situacao === 2
                          ? 'default'
                          : c.situacao === 4 || c.situacao === 6
                            ? 'destructive'
                            : 'secondary';
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          {c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>{c.contato?.nome || '-'}</TableCell>
                        <TableCell>{c.historico || c.numeroDocumento || '-'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R${' '}
                          {Number(c.valor || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sitVariant}>{sitLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {c.situacao !== 2 && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setBaixaForm({
                                      valorRecebido: String(c.valor || ''),
                                      data: todayISOLocal(),
                                    });
                                    setShowBaixa({ id: String(c.id), tipo });
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Dar Baixa
                                </DropdownMenuItem>
                              )}
                              {c.situacao === 2 && (
                                <DropdownMenuItem
                                  onClick={() => setConfirmEstorno({ id: String(c.id), tipo })}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" /> Estornar Baixa
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setConfirmExclusao({ id: String(c.id), tipo })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              pagina={pagina}
              setPagina={setPagina}
              hasMore={contas.length === 100}
              onRefetch={refetch}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
