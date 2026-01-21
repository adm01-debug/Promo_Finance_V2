import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, ChevronRight, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatDate, formatRelativeDate, isOverdue, isDueSoon } from '@/lib/date-utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado';
  fornecedor?: {
    razao_social: string;
  };
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'recebido' | 'atrasado';
  cliente?: {
    nome: string;
  };
}

interface UpcomingPaymentsProps {
  contasPagar?: ContaPagar[];
  contasReceber?: ContaReceber[];
  isLoading?: boolean;
  maxItems?: number;
}

function PaymentItem({
  tipo,
  descricao,
  valor,
  vencimento,
  status,
  entidade,
}: {
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  entidade?: string;
}) {
  const overdue = isOverdue(vencimento);
  const dueSoon = isDueSoon(vencimento, 3);

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          'p-2 rounded-lg',
          tipo === 'pagar' 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
        )}>
          <DollarSign className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {descricao}
          </p>
          {entidade && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {entidade}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className={cn(
              'text-xs',
              overdue && 'text-red-600 dark:text-red-400',
              dueSoon && !overdue && 'text-yellow-600 dark:text-yellow-400',
              !overdue && !dueSoon && 'text-gray-500 dark:text-gray-400'
            )}>
              {formatRelativeDate(vencimento)}
            </span>
            {overdue && (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className={cn(
          'font-semibold',
          tipo === 'pagar' 
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        )}>
          {tipo === 'pagar' ? '-' : '+'}{formatCurrency(valor)}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function UpcomingPayments({
  contasPagar = [],
  contasReceber = [],
  isLoading,
  maxItems = 5,
}: UpcomingPaymentsProps) {
  // Combine and sort by due date
  const allItems = [
    ...contasPagar.map(c => ({ ...c, tipo: 'pagar' as const })),
    ...contasReceber.map(c => ({ ...c, tipo: 'receber' as const })),
  ]
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
    .slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Próximos Vencimentos
          </h3>
          <Link to="/contas-pagar">
            <Button variant="ghost" size="sm">
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-2">
        {isLoading ? (
          <LoadingSkeleton />
        ) : allItems.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma conta próxima do vencimento
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {allItems.map((item) => (
              <PaymentItem
                key={`${item.tipo}-${item.id}`}
                tipo={item.tipo}
                descricao={item.descricao}
                valor={item.valor}
                vencimento={item.data_vencimento}
                status={item.status}
                entidade={item.tipo === 'pagar' 
                  ? (item as ContaPagar).fornecedor?.razao_social 
                  : (item as ContaReceber).cliente?.nome
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function OverduePayments({
  contasPagar = [],
  contasReceber = [],
  isLoading,
}: Omit<UpcomingPaymentsProps, 'maxItems'>) {
  const overdueItems = [
    ...contasPagar.filter(c => c.status === 'atrasado').map(c => ({ ...c, tipo: 'pagar' as const })),
    ...contasReceber.filter(c => c.status === 'atrasado').map(c => ({ ...c, tipo: 'receber' as const })),
  ].sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

  if (!isLoading && overdueItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="p-4 border-b border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Contas Atrasadas ({overdueItems.length})
          </h3>
        </div>
      </div>

      <div className="p-2">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-1">
            {overdueItems.map((item) => (
              <PaymentItem
                key={`${item.tipo}-${item.id}`}
                tipo={item.tipo}
                descricao={item.descricao}
                valor={item.valor}
                vencimento={item.data_vencimento}
                status={item.status}
                entidade={item.tipo === 'pagar' 
                  ? (item as ContaPagar).fornecedor?.razao_social 
                  : (item as ContaReceber).cliente?.nome
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UpcomingPayments;
