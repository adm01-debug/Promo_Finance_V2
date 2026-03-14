import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Repeat,
  Play,
  Pause,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  MoreVertical,
  Zap,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagamentosRecorrentes, PagamentoRecorrente } from '@/hooks/usePagamentosRecorrentes';
import { formatCurrency } from '@/lib/formatters';

const frequenciaLabels: Record<string, string> = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export function PagamentosRecorrentesList() {
  const {
    pagamentosRecorrentes,
    isLoading,
    stats,
    toggleAtivo,
    deletePagamentoRecorrente,
    gerarContas,
    isGenerating,
  } = usePagamentosRecorrentes();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      deletePagamentoRecorrente(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardDescription className="text-xs sm:text-sm">Recorrentes</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardDescription className="text-xs sm:text-sm">Ativos</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-success">{stats.ativos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardDescription className="text-xs sm:text-sm">Pausados</CardDescription>
            <CardTitle className="text-lg sm:text-2xl text-warning">{stats.pausados}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardDescription className="text-xs sm:text-sm truncate">Valor Mensal</CardDescription>
            <CardTitle className="text-lg sm:text-2xl truncate">{formatCurrency(stats.valorMensal)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Ação de gerar contas */}
      <div className="flex justify-end">
        <Button onClick={() => gerarContas()} disabled={isGenerating} size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
          <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{isGenerating ? 'Gerando...' : 'Gerar Contas Pendentes'}</span>
          <span className="sm:hidden">{isGenerating ? 'Gerando...' : 'Gerar Contas'}</span>
        </Button>
      </div>

      {/* Lista */}
      <AnimatePresence>
        {pagamentosRecorrentes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum pagamento recorrente cadastrado.
                <br />
                Crie um para automatizar suas despesas fixas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pagamentosRecorrentes.map((pagamento, index) => (
              <PagamentoRecorrenteCard
                key={pagamento.id}
                pagamento={pagamento}
                index={index}
                onToggle={() => toggleAtivo({ id: pagamento.id, ativo: !pagamento.ativo })}
                onDelete={() => setDeleteId(pagamento.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pagamento Recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As contas já geradas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PagamentoRecorrenteCardProps {
  pagamento: PagamentoRecorrente;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
}

function PagamentoRecorrenteCard({ pagamento, index, onToggle, onDelete }: PagamentoRecorrenteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={!pagamento.ativo ? 'opacity-60' : ''}>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
              {/* Header com título e badges */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Repeat className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{pagamento.descricao}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{pagamento.fornecedor_nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-6 sm:ml-0">
                  <Badge variant={pagamento.ativo ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                    {pagamento.ativo ? 'Ativo' : 'Pausado'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {frequenciaLabels[pagamento.frequencia]}
                  </Badge>
                </div>
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm ml-6 sm:ml-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{formatCurrency(pagamento.valor)}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">Dia {pagamento.dia_vencimento}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    {pagamento.proxima_geracao
                      ? format(new Date(pagamento.proxima_geracao), "dd/MM/yy", { locale: ptBR })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{pagamento.total_gerado} gerada(s)</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggle}>
                  {pagamento.ativo ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
