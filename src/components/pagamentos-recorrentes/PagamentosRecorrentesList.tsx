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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Recorrentes</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.ativos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pausados</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pausados}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Mensal Estimado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.valorMensal)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Ação de gerar contas */}
      <div className="flex justify-end">
        <Button onClick={() => gerarContas()} disabled={isGenerating}>
          <Zap className="mr-2 h-4 w-4" />
          {isGenerating ? 'Gerando...' : 'Gerar Contas Pendentes'}
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
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Repeat className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{pagamento.descricao}</h3>
                  <p className="text-sm text-muted-foreground">{pagamento.fornecedor_nome}</p>
                </div>
                <Badge variant={pagamento.ativo ? 'default' : 'secondary'}>
                  {pagamento.ativo ? 'Ativo' : 'Pausado'}
                </Badge>
                <Badge variant="outline">{frequenciaLabels[pagamento.frequencia]}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatCurrency(pagamento.valor)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Dia {pagamento.dia_vencimento}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {pagamento.proxima_geracao
                      ? `Próxima: ${format(new Date(pagamento.proxima_geracao), "dd/MM/yyyy", { locale: ptBR })}`
                      : 'Não agendada'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{pagamento.total_gerado} gerada(s)</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
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
