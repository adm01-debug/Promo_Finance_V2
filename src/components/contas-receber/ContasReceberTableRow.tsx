import { motion } from 'framer-motion';
import {
  Building2,
  FileText,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';

const statusConfig: Record<StatusPagamento, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: Trash2 },
};

const getScoreColor = (score: number) => {
  if (score >= 800) return 'text-success';
  if (score >= 600) return 'text-warning';
  if (score >= 400) return 'text-orange-500';
  return 'text-destructive';
};

const getScoreLabel = (score: number) => {
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Crítico';
};

interface ContasReceberTableRowProps {
  conta: any;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (conta: any) => void;
  onDelete: (conta: any) => void;
  onRegistrarRecebimento: (conta: any) => void;
  animate?: boolean;
}

export function ContasReceberTableRow({
  conta,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onRegistrarRecebimento,
  animate = false,
}: ContasReceberTableRowProps) {
  const status = statusConfig[conta.status as StatusPagamento];
  const StatusIcon = status?.icon || Clock;
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
  const saldo = conta.valor - (conta.valor_recebido || 0);
  const percentualRecebido = conta.valor_recebido ? (conta.valor_recebido / conta.valor) * 100 : 0;
  const clienteData = conta.clientes as any;

  const RowComponent = animate ? motion.tr : 'tr';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.02 },
  } : {};

  return (
    <RowComponent
      {...animationProps}
      className={cn(
        "group hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/5"
      )}
    >
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(conta.id)}
          aria-label={`Selecionar ${conta.descricao}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{conta.cliente_nome}</p>
            <p className="text-xs text-muted-foreground">{clienteData?.nome_fantasia || '-'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate max-w-[200px]">{conta.descricao}</span>
        </div>
        {conta.numero_documento && (
          <p className="text-xs text-muted-foreground mt-0.5">{conta.numero_documento}</p>
        )}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-semibold">{formatCurrency(conta.valor)}</p>
          {conta.valor_recebido && conta.valor_recebido > 0 && (
            <div className="mt-1">
              <Progress value={percentualRecebido} className="h-1.5 w-20" />
              <p className="text-xs text-muted-foreground mt-0.5">
                Saldo: {formatCurrency(saldo)}
              </p>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm">{formatDate(new Date(conta.data_vencimento))}</p>
            {overdueDays > 0 && conta.status !== 'pago' && (
              <p className="text-xs text-destructive font-medium">
                {overdueDays} dias em atraso
              </p>
            )}
            {overdueDays < 0 && conta.status !== 'pago' && (
              <p className="text-xs text-muted-foreground">
                Vence {getRelativeTime(new Date(conta.data_vencimento))}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("gap-1", status?.color)}>
          <StatusIcon className="h-3 w-3" />
          {status?.label || conta.status}
        </Badge>
      </TableCell>
      <TableCell>
        {clienteData?.score && (
          <div className="flex items-center gap-2">
            <div className={cn("font-bold", getScoreColor(clienteData.score))}>
              {clienteData.score}
            </div>
            <span className="text-xs text-muted-foreground">
              {getScoreLabel(clienteData.score)}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onEdit(conta)}>
              <Edit className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Cobrança
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2"
              onClick={() => onRegistrarRecebimento(conta)}
              disabled={conta.status === 'pago' || conta.status === 'cancelado'}
            >
              <CheckCircle2 className="h-4 w-4" />
              Registrar Recebimento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 text-destructive"
              onClick={() => onDelete(conta)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </RowComponent>
  );
}
