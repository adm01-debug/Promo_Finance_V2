import { motion } from 'framer-motion';
import {
  Building2, FileText, Calendar, MoreHorizontal, Eye, Edit, Trash2, Send,
  CheckCircle2, Clock, AlertTriangle, MessageCircle, DollarSign,
  Banknote, QrCode, CreditCard, Wallet, Shield, Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime, getEtapaCobrancaLabel } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ContaReceberRow = Database['public']['Tables']['contas_receber']['Row'];

interface ClienteData {
  razao_social: string;
  nome_fantasia: string | null;
  score: number | null;
}

export interface ContaReceberWithRelations extends ContaReceberRow {
  clientes: ClienteData | null;
  centros_custo?: { nome: string; codigo: string } | null;
  contas_bancarias?: { banco: string } | null;
  empresas?: { razao_social: string; nome_fantasia: string | null } | null;
}

type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';

const statusConfig: Record<StatusPagamento, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: Trash2 },
};

const tipoCobrancaConfig: Record<string, { label: string; color: string; icon: typeof Banknote }> = {
  boleto: { label: 'Boleto', color: 'bg-primary/10 text-primary border-primary/20', icon: Banknote },
  pix: { label: 'PIX', color: 'bg-success/10 text-success border-success/20', icon: QrCode },
  cartao: { label: 'Cartão', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: CreditCard },
  transferencia: { label: 'TED', color: 'bg-warning/10 text-warning border-warning/20', icon: Building2 },
  dinheiro: { label: 'Dinheiro', color: 'bg-muted text-muted-foreground border-muted', icon: Wallet },
};

const etapaIcons: Record<string, typeof Shield> = {
  preventiva: Shield,
  lembrete: Clock,
  cobranca: AlertTriangle,
  negociacao: DollarSign,
  juridico: Scale,
};

const etapaColors: Record<string, string> = {
  preventiva: 'text-primary',
  lembrete: 'text-warning',
  cobranca: 'text-destructive',
  negociacao: 'text-secondary',
  juridico: 'text-destructive',
};

const getScoreColor = (score: number) => {
  if (score >= 800) return 'text-success';
  if (score >= 600) return 'text-warning';
  if (score >= 400) return 'text-streak';
  return 'text-destructive';
};

const getScoreLabel = (score: number) => {
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Crítico';
};

interface ContasReceberTableRowProps {
  conta: ContaReceberWithRelations;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (conta: ContaReceberWithRelations) => void;
  onDelete: (conta: ContaReceberWithRelations) => void;
  onRegistrarRecebimento: (conta: ContaReceberWithRelations) => void;
  onView?: (conta: ContaReceberWithRelations) => void;
  onEnviarCobranca?: (conta: ContaReceberWithRelations) => void;
  showEmpresa?: boolean;
  animate?: boolean;
}

export function ContasReceberTableRow({
  conta, index, isSelected, onToggleSelect, onEdit, onDelete,
  onRegistrarRecebimento, onView, onEnviarCobranca, showEmpresa = false, animate = false,
}: ContasReceberTableRowProps) {
  const status = statusConfig[conta.status as StatusPagamento];
  const StatusIcon = status?.icon || Clock;
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
  const saldo = conta.valor - (conta.valor_recebido || 0);
  const percentualRecebido = conta.valor_recebido ? (conta.valor_recebido / conta.valor) * 100 : 0;
  const clienteData = conta.clientes;
  const tipo = tipoCobrancaConfig[conta.tipo_cobranca || 'boleto'];
  const TipoIcon = tipo?.icon || Banknote;
  const etapa = conta.etapa_cobranca as string | null;
  const EtapaIcon = etapa ? etapaIcons[etapa] || Shield : null;

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
          onChange={() => onToggleSelect(conta.id)}
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
              <p className="text-xs text-muted-foreground mt-0.5">Saldo: {formatCurrency(saldo)}</p>
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
              <p className="text-xs text-destructive font-medium">{overdueDays} dias em atraso</p>
            )}
            {overdueDays < 0 && conta.status !== 'pago' && (
              <p className="text-xs text-muted-foreground">Vence {getRelativeTime(new Date(conta.data_vencimento))}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn("gap-1 w-fit", status?.color)}>
            <StatusIcon className="h-3 w-3" />
            {status?.label || conta.status}
          </Badge>
          {/* Tipo de Cobrança Badge (#16) */}
          {tipo && (
            <Badge variant="outline" className={cn("gap-1 w-fit text-[10px] px-1.5 py-0", tipo.color)}>
              <TipoIcon className="h-2.5 w-2.5" />
              {tipo.label}
            </Badge>
          )}
          {/* Etapa da Régua (#29) */}
          {EtapaIcon && etapa && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className={cn("gap-1 w-fit text-[10px] px-1.5 py-0", etapaColors[etapa] || '')}>
                    <EtapaIcon className="h-2.5 w-2.5" />
                    {getEtapaCobrancaLabel(etapa)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Etapa da régua de cobrança</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      {/* Empresa Column (#14) */}
      {showEmpresa && (
        <TableCell>
          <span className="text-xs text-muted-foreground">
            {(conta as any).empresas?.nome_fantasia || (conta as any).empresas?.razao_social || '-'}
          </span>
        </TableCell>
      )}
      <TableCell>
        {clienteData?.score && (
          <div className="flex items-center gap-2">
            <div className={cn("font-bold", getScoreColor(clienteData.score))}>{clienteData.score}</div>
            <span className="text-xs text-muted-foreground">{getScoreLabel(clienteData.score)}</span>
          </div>
        )}
      </TableCell>
      {/* Quick Actions inline (#27) */}
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Quick inline actions */}
          {conta.status !== 'pago' && conta.status !== 'cancelado' && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon-sm"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-success hover:text-success"
                      onClick={() => onRegistrarRecebimento(conta)}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Registrar Recebimento</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon-sm"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
                      onClick={() => onEnviarCobranca?.(conta)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar Cobrança</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon-sm"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onView?.(conta)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar Detalhes</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Dropdown for more actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={() => onView?.(conta)}>
                <Eye className="h-4 w-4" /> Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => onEdit(conta)}>
                <Edit className="h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => onEnviarCobranca?.(conta)}>
                <Send className="h-4 w-4" /> Enviar Cobrança
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2"
                onClick={() => onRegistrarRecebimento(conta)}
                disabled={conta.status === 'pago' || conta.status === 'cancelado'}
              >
                <CheckCircle2 className="h-4 w-4" /> Registrar Recebimento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(conta)}>
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </RowComponent>
  );
}
