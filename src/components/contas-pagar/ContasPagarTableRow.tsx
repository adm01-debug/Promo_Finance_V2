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
      {...(getRowAnimation(index).transition ? getRowAnimation(index) : {})}
      className={cn(
        "group hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/5"
      )}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onChange={onToggleSelect}
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
        {conta.categoria && (
          <Badge variant="secondary" className="text-xs mt-1 gap-1">
            <Tag className="h-3 w-3" />
            {conta.categoria}
          </Badge>
        )}
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
      <TableCell>
        <Badge variant="outline" className={cn("gap-1", status?.color)}>
          <StatusIcon className="h-3 w-3" />
          {status?.label || conta.status}
        </Badge>
      </TableCell>
      <TableCell>
        <ContaPagarRowActions
          status={conta.status}
          aguardandoSolicitacao={aguardandoSolicitacao}
          temSolicitacaoPendente={temSolicitacaoPendente}
          onEdit={onEdit}
          onDelete={onDelete}
          onRegistrarPagamento={onRegistrarPagamento}
          onSolicitarAprovacao={onSolicitarAprovacao}
        />
      </TableCell>
    </RowComponent>
  );
}
