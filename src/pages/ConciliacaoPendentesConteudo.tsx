import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  SplitSquareHorizontal,
  Link2,
  Unlink,
  Calendar,
  TrendingUp,
  TrendingDown,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import type { Dispatch, SetStateAction } from 'react';
import type { TransacaoExtrato } from '@/hooks/conciliacaoPage.types';
interface ConciliacaoPendentesConteudoProps {
  sortedTransacoes: import('@/lib/conciliacao-page-helpers').TransacaoImportada[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  showCol: (key: string) => boolean;
  handleConciliar: (transacao: import('@/hooks/conciliacaoPage.types').TransacaoExtrato) => void;
  setSelectedTransacaoManual: Dispatch<SetStateAction<TransacaoExtrato | null>>;
  setShowManualDialog: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setSelectedTransacaoSplit: Dispatch<SetStateAction<TransacaoExtrato | null>>;
  setShowSplitDialog: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  handleIgnorar: (id: string) => void;
  handleDesfazerConciliacao: (transacaoId: string) => Promise<void>;
}

export function ConciliacaoPendentesConteudo({
  sortedTransacoes,
  selectedIds,
  toggleSelect,
  showCol,
  handleConciliar,
  setSelectedTransacaoManual,
  setShowManualDialog,
  setSelectedTransacaoSplit,
  setShowSplitDialog,
  handleIgnorar,
  handleDesfazerConciliacao,
}: ConciliacaoPendentesConteudoProps) {
  return (
    <AnimatePresence mode="popLayout">
      {sortedTransacoes.map((transacao, index) => {
        const isCredito = transacao.tipo === 'credito';
        const isSelected = selectedIds.has(transacao.id);
        return (
          <motion.div
            key={transacao.id}
            data-highlight-id={transacao.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: Math.min(index * 0.02, 0.3) }}
          >
            <Card
              className={cn(
                'card-base transition-all hover:shadow-md',
                transacao.conciliada && 'opacity-70',
                isSelected && 'ring-2 ring-primary/50 bg-primary/5'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {!transacao.conciliada && (
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelect(transacao.id)}
                      className="flex-shrink-0"
                    />
                  )}
                  {showCol('tipo') && (
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        isCredito
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {isCredito ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{transacao.descricao}</p>
                    {showCol('data') && (
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transacao.data)}
                          </span>
                        </div>
                        {transacao.compensacao_valor !== undefined &&
                          transacao.compensacao_valor !== 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 w-fit">
                                  <SplitSquareHorizontal className="h-3 w-3 text-amber-500" />
                                  <span className="text-[10px] font-bold text-amber-500">
                                    Compensação: {formatCurrency(transacao.compensacao_valor)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p>
                                    <span className="font-bold">Motivo:</span>{' '}
                                    {transacao.compensacao_motivo}
                                  </p>
                                  <p>
                                    <span className="font-bold">Regra:</span>{' '}
                                    {transacao.compensacao_regra}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                      </div>
                    )}
                  </div>
                  {showCol('valor') && (
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-bold text-sm',
                          isCredito ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {isCredito ? '+' : '-'}
                        {formatCurrency(transacao.valor)}
                      </p>
                      {transacao.conciliada && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-success/10 text-success border-success/20 h-4"
                        >
                          <Check className="h-2.5 w-2.5 mr-1" />
                          Conciliada
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-4">
                    {!transacao.conciliada ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConciliar(transacao)}
                          className="h-8 gap-2 bg-success hover:bg-success/90"
                        >
                          <Link2 className="h-4 w-4" />
                          Conciliar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransacaoManual(transacao);
                                setShowManualDialog(true);
                              }}
                              className="gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Conciliação Manual
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransacaoSplit(transacao);
                                setShowSplitDialog(true);
                              }}
                              className="gap-2"
                            >
                              <SplitSquareHorizontal className="h-4 w-4" />
                              Conciliação com Split
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleIgnorar(transacao.id)}
                              className="gap-2 text-destructive"
                            >
                              <Unlink className="h-4 w-4" />
                              Ignorar Transação
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDesfazerConciliacao(transacao.id)}
                        className="h-8 gap-2 text-muted-foreground hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4" />
                        Estornar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
