import { motion } from 'framer-motion';
import { CategorizacaoIABadge } from './CategorizacaoIABadge';
import { CategoriaDetectada } from '@/hooks/useCategorizacaoIA';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
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
  Tag,
  Trash2,
  Sparkles,
  Repeat,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ContaPagarRowAprovacaoBadge } from './ContaPagarRowAprovacaoBadge';
import { ContaPagarRowActions } from './ContaPagarRowActions';

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

interface CentroCustoInfo {
  nome: string;
}

interface ContaPagarRow {
  id: string;
  fornecedor_nome: string;
  descricao: string;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  status: string;
  tipo_cobranca: string;
  numero_documento: string | null;
  recorrente: boolean;
  categoria: string | null;
  tags: string[] | null;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  centros_custo?: CentroCustoInfo | null;
  empresa_id: string;
  conta_bancaria_id: string | null;
}

interface ContasPagarTableRowProps {
  conta: ContaPagarRow;
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
  getRowAnimation: (index: number) => Record<string, unknown>;
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

  const RowComponent = getRowAnimation(index).transition ? motion.tr : 'tr';

  return (
    <RowComponent
      key={conta.id}
      data-highlight-id={conta.id}
      {...(getRowAnimation(index).transition ? getRowAnimation(index) : {})}
      className={cn(
        "group transition-all duration-300 border-white/5 relative", 
        isSelected ? "bg-primary/5" : "hover:bg-white/[0.03]"
      )}
    >
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
              onAplicar={async (cat: CategoriaDetectada) => {
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
        {conta.centros_custo?.nome ? (
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 border-white/5 bg-white/5 px-2 py-0.5">
            {conta.centros_custo.nome}
          </Badge>
        ) : (
          <span className="text-[10px] font-black text-muted-foreground/20 tracking-widest uppercase">—</span>
        )}
      </TableCell>

      <TableCell className="p-6">
        <div className="flex justify-center">
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
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="flex justify-center">
          <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest shadow-sm", status?.color)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status?.label || conta.status}
          </Badge>
        </div>
      </TableCell>

      <TableCell className="p-6">
        <div className="flex justify-end">
          <ContaPagarRowActions
            status={conta.status}
            aguardandoSolicitacao={aguardandoSolicitacao}
            temSolicitacaoPendente={temSolicitacaoPendente}
            onEdit={onEdit}
            onDelete={onDelete}
            onRegistrarPagamento={onRegistrarPagamento}
            onSolicitarAprovacao={onSolicitarAprovacao}
          />
        </div>
      </TableCell>
    </RowComponent>
  );
}
