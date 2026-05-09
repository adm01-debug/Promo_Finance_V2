import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ShieldCheck,
  Building2,
  Calendar,
  Repeat,
  Tag,
  Banknote,
  QrCode,
  CreditCard,
  DollarSign,
  TrendingUp,
  History
} from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ContaPagarRowAprovacaoBadge } from './ContaPagarRowAprovacaoBadge';
import { CategorizacaoIABadge } from './CategorizacaoIABadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ContasPagarTableRowProps {
  conta: any;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: (data?: any) => void;
  onDelete: () => void;
  onRegistrarPagamento: () => void;
  onSolicitarAprovacao: () => void;
  estaAprovado: boolean;
  temSolicitacaoPendente: boolean;
  foiRejeitado: boolean;
  aguardandoSolicitacao: boolean;
  historico: any[];
  profilesMap: Map<string, any>;
  valorMinimoAprovacao: number;
  getRowAnimation: (index: number) => any;
  isVirtual?: boolean;
}

export const ContasPagarTableRow = memo(({
  conta,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onRegistrarPagamento,
  onSolicitarAprovacao,
  estaAprovado,
  temSolicitacaoPendente,
  foiRejeitado,
  aguardandoSolicitacao,
  historico,
  profilesMap,
  valorMinimoAprovacao,
  getRowAnimation,
  isVirtual = false
}: ContasPagarTableRowProps) => {
  const status = statusConfig[conta.status as StatusPagamento];
  const StatusIcon = status?.icon || Clock;
  const TipoIcon = tipoCobrancaIcons[conta.tipo_cobranca as TipoCobranca] || Banknote;
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));

  const Content = (
    <>
      <TableCell className="p-6 text-center">
        <Checkbox
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${conta.descricao}`}
        />
      </TableCell>
      
      <TableCell className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[1rem] bg-white/5 border border-white/10 flex items-center justify-center relative shadow-sm transition-transform group-hover:scale-110 duration-500">
            <Building2 className="h-6 w-6 text-secondary/60" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-base tracking-tight text-foreground truncate">{conta.fornecedor_nome}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <TipoIcon className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 capitalize">{conta.tipo_cobranca}</span>
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[200px] leading-none">{conta.descricao}</span>
            <CategorizacaoIABadge
              despesa={{
                id: conta.id,
                descricao: conta.descricao,
                valor: conta.valor,
                fornecedor_nome: conta.fornecedor_nome,
                data_vencimento: conta.data_vencimento,
              }}
              categoriaAtual={conta.categoria || undefined}
              onAplicar={async (cat) => {
                const { error } = await supabase
                  .from('contas_pagar')
                  .update({ categoria: cat.categoria, tags: cat.tags || [] })
                  .eq('id', conta.id);
                if (error) {
                  toast.error('Erro ao aplicar categoria');
                } else {
                  toast.success(`Categoria "${cat.categoria}" aplicada`);
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {conta.categoria && (
              <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 rounded-md border-secondary/20 bg-secondary/5 text-secondary tracking-wider">
                <Tag className="h-2 w-2 mr-1" />
                {conta.categoria}
              </Badge>
            )}
            {conta.numero_documento && (
              <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 rounded-md border-white/5 bg-white/5 text-muted-foreground/60 tracking-wider">REF: {conta.numero_documento}</Badge>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="space-y-1">
          <p className="text-lg font-black tabular-nums tracking-tighter text-foreground">{formatCurrency(conta.valor)}</p>
          {conta.recorrente && (
            <div className="flex items-center gap-1">
              <Repeat className="h-2.5 w-2.5 text-primary" />
              <span className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">Subscription Flux</span>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-sm",
            overdueDays > 0 && conta.status !== 'pago' ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-white/5 border-white/10 text-muted-foreground/40"
          )}>
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tabular-nums tracking-tight">{formatDate(new Date(conta.data_vencimento))}</p>
            {overdueDays > 0 && conta.status !== 'pago' ? (
              <p className="text-[10px] font-black text-destructive uppercase tracking-widest mt-0.5">Payment Critical</p>
            ) : overdueDays < 0 && conta.status !== 'pago' ? (
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">{getRelativeTime(new Date(conta.data_vencimento))}</p>
            ) : null}
          </div>
        </div>
      </TableCell>

      <TableCell className="p-6">
        {conta.centro_custo_nome || conta.centros_custo?.nome ? (
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 border-white/5 bg-white/5 px-2 py-0.5">
            {conta.centro_custo_nome || conta.centros_custo?.nome}
          </Badge>
        ) : (
          <span className="text-[10px] font-black text-muted-foreground/20 tracking-widest uppercase">—</span>
        )}
      </TableCell>

      <TableCell className="p-6 text-center">
        <ContaPagarRowAprovacaoBadge
          estaAprovado={estaAprovado}
          temSolicitacaoPendente={temSolicitacaoPendente}
          foiRejeitado={foiRejeitado}
          aguardandoSolicitacao={aguardandoSolicitacao}
          historico={historico}
          profilesMap={profilesMap}
          valorMinimoAprovacao={valorMinimoAprovacao}
          aprovado_por={conta.aprovado_por}
          aprovado_em={conta.aprovado_em}
        />
      </TableCell>

      <TableCell className="p-6 text-center">
        <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest shadow-sm", status?.color)}>
          <StatusIcon className="h-3.5 w-3.5" />
          {status?.label || conta.status}
        </Badge>
      </TableCell>

      <TableCell className="p-6 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(conta)} className="gap-2 focus:bg-primary/10">
              <Edit className="h-4 w-4" /> Edit Record
            </DropdownMenuItem>
            
            {(conta.status === 'pendente' || conta.status === 'vencido' || conta.status === 'parcial') && (
              <DropdownMenuItem onClick={onRegistrarPagamento} className="gap-2 text-success focus:text-success focus:bg-success/10">
                <CheckCircle2 className="h-4 w-4" /> Register Payment
              </DropdownMenuItem>
            )}

            {aguardandoSolicitacao && (
              <DropdownMenuItem onClick={onSolicitarAprovacao} className="gap-2 text-warning focus:text-warning focus:bg-warning/10">
                <ShieldCheck className="h-4 w-4" /> Request Approval
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> Purge Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </>
  );

  if (isVirtual) {
    return (
      <tr className="group hover:bg-white/[0.03] transition-all duration-300 border-none">
        {Content}
      </tr>
    );
  }

  const animation = getRowAnimation(index);
  const isMotion = !!animation.transition;

  if (isMotion) {
    return (
      <motion.tr 
        {...animation}
        className="group hover:bg-white/[0.03] transition-all duration-300 border-none"
      >
        {Content}
      </motion.tr>
    );
  }

  return (
    <tr className="group hover:bg-white/[0.03] transition-all duration-300 border-none">
      {Content}
    </tr>
  );
});

ContasPagarTableRow.displayName = 'ContasPagarTableRow';
