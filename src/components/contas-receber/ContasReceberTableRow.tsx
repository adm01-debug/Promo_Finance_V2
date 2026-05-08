import { motion } from 'framer-motion';
import {
  Building2, FileText, Calendar, MoreHorizontal, Eye, Edit, Trash2, Send,
  CheckCircle2, Clock, AlertTriangle, MessageCircle, DollarSign,
  Banknote, QrCode, CreditCard, Wallet, Shield, Scale, Gavel, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
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
  has_protesto?: boolean;
  has_boleto?: boolean;
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
  preventiva: Shield, lembrete: Clock, cobranca: AlertTriangle, negociacao: DollarSign, juridico: Scale,
};
const etapaColors: Record<string, string> = {
  preventiva: 'text-primary', lembrete: 'text-warning', cobranca: 'text-destructive', negociacao: 'text-secondary', juridico: 'text-destructive',
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
  onAplicarDesconto?: (conta: ContaReceberWithRelations) => void;
  showEmpresa?: boolean;
  showDiasAtraso?: boolean;
  animate?: boolean;
}

export function ContasReceberTableRow({
  conta, index, isSelected, onToggleSelect, onEdit, onDelete,
  onRegistrarRecebimento, onView, onEnviarCobranca, onAplicarDesconto,
  showEmpresa = false, showDiasAtraso = true, animate = false,
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
    initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.02 },
  } : {};

  return (
    <RowComponent 
      data-highlight-id={conta.id} 
      {...animationProps} 
      className={cn(
        "group transition-all duration-500 border-white/5 relative overflow-hidden", 
        isSelected ? "bg-primary/10 shadow-inner" : "hover:bg-white/[0.04]"
      )}
    >
      <TableCell className="p-6 text-center">
        <Checkbox checked={isSelected} onChange={() => onToggleSelect(conta.id)} aria-label={`Selecionar ${conta.descricao}`} />
      </TableCell>
      
      <TableCell className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative shadow-2xl transition-all group-hover:scale-110 duration-700 group-hover:rotate-3 group-hover:border-primary/30">
            <Building2 className="h-7 w-7 text-primary/40 group-hover:text-primary transition-colors" />
            {conta.has_protesto && (
              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive flex items-center justify-center shadow-lg ring-2 ring-background">
                <Gavel className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-black text-lg tracking-tight text-white group-hover:text-primary transition-colors">{conta.cliente_nome}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-1">{clienteData?.nome_fantasia || '-'}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[200px] leading-none">{conta.descricao}</span>
          </div>
          <div className="flex items-center gap-2">
            {conta.numero_documento && <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 rounded-md border-white/5 bg-white/5 text-muted-foreground/60 tracking-wider">DOC: {conta.numero_documento}</Badge>}
            {conta.numero_parcela_atual && conta.total_parcelas && (
              <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 rounded-md border-primary/20 bg-primary/5 text-primary tracking-wider">Lote {conta.numero_parcela_atual}/{conta.total_parcelas}</Badge>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="space-y-1">
          <p className="text-xl font-black tabular-nums tracking-tighter text-white group-hover:scale-105 transition-transform origin-left">{formatCurrency(conta.valor)}</p>
          {conta.valor_desconto && conta.valor_desconto > 0 && (
            <p className="text-[10px] font-black text-warning uppercase tracking-widest leading-none">Yield Adj: -{formatCurrency(conta.valor_desconto)}</p>
          )}
          {conta.valor_recebido && conta.valor_recebido > 0 && (
            <div className="pt-1.5 max-w-[120px]">
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentualRecebido}%` }}
                  className="h-full bg-success shadow-[0_0_8px_rgba(var(--success),0.5)]" 
                />
              </div>
              <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Settle: {formatCurrency(saldo)}</p>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-700 shadow-2xl group-hover:scale-105",
            overdueDays > 0 && conta.status !== 'pago' ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-white/[0.03] border-white/10 text-white/20"
          )}>
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tabular-nums tracking-tight">{formatDate(new Date(conta.data_vencimento))}</p>
            {overdueDays > 0 && conta.status !== 'pago' ? (
              <p className="text-[10px] font-black text-destructive uppercase tracking-widest mt-0.5">Critical Delay</p>
            ) : overdueDays < 0 && conta.status !== 'pago' ? (
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">Horizon: {getRelativeTime(new Date(conta.data_vencimento))}</p>
            ) : null}
          </div>
        </div>
      </TableCell>

      {showDiasAtraso && (
        <TableCell className="p-6 text-center">
          {conta.status !== 'pago' && conta.status !== 'cancelado' ? (
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-xl font-black tabular-nums tracking-tighter leading-none",
                overdueDays > 30 ? "text-destructive" : overdueDays > 0 ? "text-warning" : "text-success"
              )}>
                {overdueDays > 0 ? overdueDays : overdueDays === 0 ? 'T0' : `${Math.abs(overdueDays)}d`}
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Offset</span>
            </div>
          ) : (
            <span className="text-[10px] font-black text-muted-foreground/20 tracking-widest uppercase">Cleared</span>
          )}
        </TableCell>
      )}

      <TableCell className="p-6">
        <div className="flex flex-col gap-1.5 items-center lg:items-start">
          <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest", status?.color)}>
            <StatusIcon className="h-3.5 w-3.5" /> {status?.label || conta.status}
          </Badge>
          <div className="flex gap-1 flex-wrap justify-center lg:justify-start">
            {tipo && (
              <Badge variant="outline" className={cn("gap-1 px-1.5 py-0 h-4 rounded-md border-none font-black text-[8px] uppercase tracking-wider opacity-60", tipo.color)}>
                <TipoIcon className="h-2 w-2" /> {tipo.label}
              </Badge>
            )}
            {EtapaIcon && etapa && (
              <Badge variant="outline" className={cn("gap-1 px-1.5 py-0 h-4 rounded-md border-none font-black text-[8px] uppercase tracking-wider", etapaColors[etapa] || '')}>
                <EtapaIcon className="h-2 w-2" /> {getEtapaCobrancaLabel(etapa)}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-tight">
          {conta.contas_bancarias?.banco || '-'}
        </p>
      </TableCell>

      {showEmpresa && (
        <TableCell className="p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-tight">
            {(conta as any).empresas?.nome_fantasia || (conta as any).empresas?.razao_social || 'GLOBAL'}
          </p>
        </TableCell>
      )}

      <TableCell className="p-6">
        {clienteData?.score && (
          <div className="flex flex-col items-center">
            <div className={cn("text-lg font-black tabular-nums tracking-tighter leading-none", getScoreColor(clienteData.score))}>{clienteData.score}</div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">{getScoreLabel(clienteData.score)}</span>
          </div>
        )}
      </TableCell>


      <TableCell className="p-6">
        <div className="flex items-center justify-end gap-2">
          {conta.status !== 'pago' && conta.status !== 'cancelado' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-white/5 bg-white/5 hover:bg-success hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                    onClick={() => onRegistrarRecebimento(conta)}>
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl font-bold">Liquidate Alpha</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-2xl border-white/10 p-2 rounded-2xl shadow-2xl min-w-[200px]">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-3 py-2">Entity Operations</DropdownMenuLabel>
              <DropdownMenuItem className="gap-3 rounded-xl focus:bg-white/10" onClick={() => onView?.(conta)}><Eye className="h-4 w-4 text-primary" /> Analysis Detail</DropdownMenuItem>
              <DropdownMenuItem className="gap-3 rounded-xl focus:bg-white/10" onClick={() => onEdit(conta)}><Edit className="h-4 w-4" /> Configuration</DropdownMenuItem>
              <DropdownMenuItem className="gap-3 rounded-xl focus:bg-white/10" onClick={() => onEnviarCobranca?.(conta)}><Send className="h-4 w-4 text-blue-400" /> Command Comms</DropdownMenuItem>
              {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                <DropdownMenuItem className="gap-3 rounded-xl focus:bg-white/10" onClick={() => onAplicarDesconto?.(conta)}>
                  <Tag className="h-4 w-4 text-warning" /> Adjust Yield
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="gap-3 rounded-xl focus:bg-success/20 text-success" onClick={() => onRegistrarRecebimento(conta)} disabled={conta.status === 'pago' || conta.status === 'cancelado'}>
                <CheckCircle2 className="h-4 w-4" /> Settle Transaction
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="gap-3 rounded-xl focus:bg-destructive/20 text-destructive font-bold" onClick={() => onDelete(conta)}>
                <Trash2 className="h-4 w-4" /> Purge Record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </RowComponent>
  );
}
