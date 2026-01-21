import { cn } from '@/lib/utils';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  Bell,
} from 'lucide-react';

interface Bill {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  daysUntilDue: number;
  type: 'pagar' | 'receber';
  entity?: string;
  isPaid?: boolean;
}

interface UpcomingBillsProps {
  bills: Bill[];
  title?: string;
  maxItems?: number;
  onViewAll?: () => void;
  onPayBill?: (id: string) => void;
  className?: string;
}

function getDueDateStatus(daysUntilDue: number, isPaid?: boolean) {
  if (isPaid) {
    return {
      label: 'Pago',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: CheckCircle,
    };
  }
  if (daysUntilDue < 0) {
    return {
      label: `${Math.abs(daysUntilDue)} dias vencido`,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: AlertTriangle,
    };
  }
  if (daysUntilDue === 0) {
    return {
      label: 'Vence hoje',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: Bell,
    };
  }
  if (daysUntilDue <= 3) {
    return {
      label: `${daysUntilDue} dias`,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: Clock,
    };
  }
  if (daysUntilDue <= 7) {
    return {
      label: `${daysUntilDue} dias`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: Calendar,
    };
  }
  return {
    label: `${daysUntilDue} dias`,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700',
    icon: Calendar,
  };
}

export function UpcomingBills({
  bills,
  title = 'Próximos Vencimentos',
  maxItems = 5,
  onViewAll,
  onPayBill,
  className,
}: UpcomingBillsProps) {
  const sortedBills = [...bills]
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, maxItems);

  const overdueCount = bills.filter((b) => b.daysUntilDue < 0 && !b.isPaid).length;
  const todayCount = bills.filter((b) => b.daysUntilDue === 0 && !b.isPaid).length;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-3 mt-1">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {overdueCount} vencidas
              </span>
            )}
            {todayCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Bell className="h-3 w-3" />
                {todayCount} hoje
              </span>
            )}
          </div>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedBills.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma conta próxima</p>
          </div>
        ) : (
          sortedBills.map((bill) => (
            <BillItem key={bill.id} bill={bill} onPay={onPayBill} />
          ))
        )}
      </div>
    </div>
  );
}

interface BillItemProps {
  bill: Bill;
  onPay?: (id: string) => void;
}

function BillItem({ bill, onPay }: BillItemProps) {
  const status = getDueDateStatus(bill.daysUntilDue, bill.isPaid);
  const StatusIcon = status.icon;
  const isPagar = bill.type === 'pagar';

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Status Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-lg', status.bg)}>
        <StatusIcon className={cn('h-5 w-5', status.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {bill.description}
          </p>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              isPagar
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            )}
          >
            {isPagar ? 'Pagar' : 'Receber'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {bill.entity && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {bill.entity}
            </span>
          )}
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {bill.dueDate}
          </span>
        </div>
      </div>

      {/* Value & Status */}
      <div className="flex-shrink-0 text-right">
        <p
          className={cn(
            'font-semibold',
            isPagar
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          )}
        >
          {bill.value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </p>
        <p className={cn('text-xs mt-0.5', status.color)}>{status.label}</p>
      </div>

      {/* Action */}
      {onPay && !bill.isPaid && (
        <button
          onClick={() => onPay(bill.id)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title={isPagar ? 'Marcar como pago' : 'Marcar como recebido'}
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Resumo de vencimentos
interface BillsSummaryProps {
  totalPagar: number;
  totalReceber: number;
  vencidasPagar: number;
  vencidasReceber: number;
  className?: string;
}

export function BillsSummary({
  totalPagar,
  totalReceber,
  vencidasPagar,
  vencidasReceber,
  className,
}: BillsSummaryProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          A Pagar
        </p>
        <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
          {totalPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        {vencidasPagar > 0 && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {vencidasPagar} vencidas
          </p>
        )}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          A Receber
        </p>
        <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
          {totalReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        {vencidasReceber > 0 && (
          <p className="text-xs text-amber-500 dark:text-amber-400 mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {vencidasReceber} atrasadas
          </p>
        )}
      </div>
    </div>
  );
}

export default UpcomingBills;
