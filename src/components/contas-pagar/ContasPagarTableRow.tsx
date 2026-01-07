import { motion } from 'framer-motion';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  MoreHorizontal,
} from 'lucide-react';
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
import {
  TableCell,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';
type TipoCobranca = 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';

const statusConfig: Record<StatusPagamento, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: TrendingUp },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: Trash2 },
};

const tipoCobrancaIcons: Record<TipoCobranca, typeof CreditCard> = {
  boleto: Banknote,
  pix: QrCode,
  cartao: CreditCard,
  transferencia: Building2,
  dinheiro: DollarSign,
};

interface SolicitacaoAprovacao {
  id: string;
  status: string;
  solicitado_em: string;
  solicitado_por: string;
  aprovado_em?: string | null;
  aprovado_por?: string | null;
  observacoes?: string | null;
  motivo_rejeicao?: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ContasPagarTableRowProps {
  conta: any;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRegistrarPagamento: () => void;
  onSolicitarAprovacao: () => void;
  precisaAprovacao: boolean;
  estaAprovado: boolean;
  temSolicitacaoPendente: boolean;
  foiRejeitado: boolean;
  aguardandoSolicitacao: boolean;
  historico: SolicitacaoAprovacao[];
  profilesMap: Map<string, Profile>;
  valorMinimoAprovacao: number;
  getRowAnimation: (index: number) => any;
}

export function ContasPagarTableRow({
  conta,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onRegistrarPagamento,
  onSolicitarAprovacao,
  precisaAprovacao,
  estaAprovado,
  temSolicitacaoPendente,
  foiRejeitado,
  aguardandoSolicitacao,
  historico,
  profilesMap,
  valorMinimoAprovacao,
  getRowAnimation,
}: ContasPagarTableRowProps) {
  const status = statusConfig[conta.status as StatusPagamento];
  const StatusIcon = status?.icon || Clock;
  const TipoIcon = tipoCobrancaIcons[conta.tipo_cobranca as TipoCobranca] || Banknote;
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
  const temHistorico = historico.length > 0;

  const RowComponent = getRowAnimation(index).transition ? motion.tr : 'tr';

  const getStatusIcon = (statusAprovacao: string) => {
    switch (statusAprovacao) {
      case 'aprovada':
        return <ShieldCheck className="h-4 w-4 text-success mt-0.5" />;
      case 'rejeitada':
        return <ShieldX className="h-4 w-4 text-destructive mt-0.5" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-warning mt-0.5" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5" />;
    }
  };

  const getStatusLabel = (statusAprovacao: string) => {
    switch (statusAprovacao) {
      case 'aprovada':
        return 'Aprovada';
      case 'rejeitada':
        return 'Rejeitada';
      case 'pendente':
        return 'Aguardando Aprovação';
      default:
        return statusAprovacao;
    }
  };

  const getBadgeContent = () => {
    if (estaAprovado) {
      return (
        <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors">
          <ShieldCheck className="h-3 w-3" />
          Aprovado
        </Badge>
      );
    }
    if (temSolicitacaoPendente) {
      return (
        <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors animate-pulse">
          <Clock className="h-3 w-3" />
          Aguardando
        </Badge>
      );
    }
    if (foiRejeitado) {
      return (
        <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors">
          <ShieldX className="h-3 w-3" />
          Rejeitado
        </Badge>
      );
    }
    if (aguardandoSolicitacao) {
      return (
        <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors">
          <ShieldAlert className="h-3 w-3" />
          Requer
        </Badge>
      );
    }
    return (
      <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        {temHistorico ? 'Ver histórico' : '-'}
      </span>
    );
  };

  return (
    <RowComponent
      key={conta.id}
      {...(getRowAnimation(index).transition ? getRowAnimation(index) : {})}
      className={cn(
        "group hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/5"
      )}
    >
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Selecionar ${conta.descricao}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="font-medium">{conta.fornecedor_nome}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TipoIcon className="h-3 w-3" />
              <span className="capitalize">{conta.tipo_cobranca}</span>
            </div>
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
          {conta.recorrente && (
            <Badge variant="outline" className="text-xs mt-1">Recorrente</Badge>
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
        {conta.centros_custo?.nome ? (
          <Badge variant="secondary" className="font-normal">
            {conta.centros_custo.nome}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <button className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded">
              {getBadgeContent()}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Aprovação
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {temHistorico ? `${historico.length} registro(s)` : 'Nenhum registro'}
              </p>
            </div>
            
            <ScrollArea className="max-h-64">
              <div className="p-2 space-y-2">
                {estaAprovado && (
                  <div className="p-2 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-success mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-success">Aprovado na Conta</p>
                        {conta.aprovado_por && (
                          <p className="text-xs text-muted-foreground">
                            Por: {profilesMap.get(conta.aprovado_por)?.full_name || profilesMap.get(conta.aprovado_por)?.email || 'Usuário'}
                          </p>
                        )}
                        {conta.aprovado_em && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(conta.aprovado_em))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {historico.map((item, idx) => {
                  const solicitante = profilesMap.get(item.solicitado_por);
                  const aprovador = item.aprovado_por ? profilesMap.get(item.aprovado_por) : null;
                  
                  return (
                    <div key={item.id || idx} className="p-2 rounded-lg bg-muted/30 border">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{getStatusLabel(item.status)}</p>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Solicitado: {formatDate(new Date(item.solicitado_em))}
                          </p>
                          
                          {solicitante && (
                            <p className="text-xs text-muted-foreground">
                              Por: {solicitante.full_name || solicitante.email}
                            </p>
                          )}
                          
                          {item.aprovado_em && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.status === 'aprovada' ? 'Aprovado' : 'Respondido'}: {formatDate(new Date(item.aprovado_em))}
                              {aprovador && ` por ${aprovador.full_name || aprovador.email}`}
                            </p>
                          )}
                          
                          {item.observacoes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{item.observacoes}"
                            </p>
                          )}
                          
                          {item.motivo_rejeicao && (
                            <p className="text-xs text-destructive mt-1">
                              Motivo: {item.motivo_rejeicao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {aguardandoSolicitacao && !temHistorico && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Valor acima de {formatCurrency(valorMinimoAprovacao)}</p>
                    <p className="text-xs">Requer aprovação antes do pagamento</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("gap-1", status?.color)}>
          <StatusIcon className="h-3 w-3" />
          {status?.label || conta.status}
        </Badge>
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
            <DropdownMenuItem className="gap-2" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {aguardandoSolicitacao && (
              <DropdownMenuItem 
                className="gap-2 text-warning"
                onClick={onSolicitarAprovacao}
              >
                <ShieldAlert className="h-4 w-4" />
                Solicitar Aprovação
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="gap-2"
              onClick={onRegistrarPagamento}
              disabled={conta.status === 'pago' || conta.status === 'cancelado' || aguardandoSolicitacao || temSolicitacaoPendente}
            >
              <CheckCircle2 className="h-4 w-4" />
              Registrar Pagamento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 text-destructive"
              onClick={onDelete}
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
