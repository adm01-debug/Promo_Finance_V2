import { useState } from 'react';
import {
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  Wallet,
  Receipt,
  Check,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';

// Types
type PaymentMethodType = 
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'boleto'
  | 'transfer'
  | 'cash'
  | 'check'
  | 'other';

interface PaymentMethod {
  type: PaymentMethodType;
  label: string;
  icon: typeof CreditCard;
  description?: string;
  fee?: number; // Percentage
  installments?: number[];
  processingDays?: number;
  enabled?: boolean;
}

interface PaymentMethodSelectorProps {
  amount: number;
  methods?: PaymentMethod[];
  selectedMethod?: PaymentMethodType;
  onSelect: (method: PaymentMethodType, installments?: number) => void;
  showFees?: boolean;
  showInstallments?: boolean;
  className?: string;
}

// Default payment methods for Brazil
const DEFAULT_METHODS: PaymentMethod[] = [
  {
    type: 'pix',
    label: 'PIX',
    icon: QrCode,
    description: 'Transferência instantânea',
    fee: 0,
    processingDays: 0,
    enabled: true,
  },
  {
    type: 'credit_card',
    label: 'Cartão de Crédito',
    icon: CreditCard,
    description: 'Parcele em até 12x',
    fee: 2.99,
    installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    processingDays: 30,
    enabled: true,
  },
  {
    type: 'debit_card',
    label: 'Cartão de Débito',
    icon: CreditCard,
    description: 'Débito na hora',
    fee: 1.49,
    processingDays: 1,
    enabled: true,
  },
  {
    type: 'boleto',
    label: 'Boleto Bancário',
    icon: Receipt,
    description: 'Vencimento em 3 dias úteis',
    fee: 0,
    processingDays: 3,
    enabled: true,
  },
  {
    type: 'transfer',
    label: 'Transferência Bancária',
    icon: Building2,
    description: 'TED ou DOC',
    fee: 0,
    processingDays: 1,
    enabled: true,
  },
  {
    type: 'cash',
    label: 'Dinheiro',
    icon: Banknote,
    description: 'Pagamento em espécie',
    fee: 0,
    processingDays: 0,
    enabled: true,
  },
  {
    type: 'check',
    label: 'Cheque',
    icon: Check,
    description: 'Cheque à vista ou pré-datado',
    fee: 0,
    processingDays: 3,
    enabled: false,
  },
];

export function PaymentMethodSelector({
  amount,
  methods = DEFAULT_METHODS,
  selectedMethod,
  onSelect,
  showFees = true,
  showInstallments = true,
  className,
}: PaymentMethodSelectorProps) {
  const [selectedInstallments, setSelectedInstallments] = useState(1);

  const enabledMethods = methods.filter(m => m.enabled !== false);
  const currentMethod = enabledMethods.find(m => m.type === selectedMethod);

  const handleMethodSelect = (type: PaymentMethodType) => {
    const method = methods.find(m => m.type === type);
    if (method?.installments && method.installments.length > 1) {
      setSelectedInstallments(1);
    }
    onSelect(type, 1);
  };

  const handleInstallmentSelect = (installments: number) => {
    setSelectedInstallments(installments);
    if (selectedMethod) {
      onSelect(selectedMethod, installments);
    }
  };

  // Calculate fee amount
  const calculateFee = (fee: number = 0) => {
    return (amount * fee) / 100;
  };

  // Calculate installment value
  const calculateInstallment = (installments: number, fee: number = 0) => {
    const totalWithFee = amount + calculateFee(fee);
    return totalWithFee / installments;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Method Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {enabledMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.type;
          const feeAmount = calculateFee(method.fee);

          return (
            <button
              key={method.type}
              onClick={() => handleMethodSelect(method.type)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    isSelected ? 'text-primary-600' : 'text-gray-500'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium',
                    isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-900 dark:text-white'
                  )}>
                    {method.label}
                  </p>
                  {method.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {method.description}
                    </p>
                  )}
                  {showFees && method.fee !== undefined && method.fee > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      +{method.fee}% taxa ({formatCurrency(feeAmount)})
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Installments Selection (for credit card) */}
      {showInstallments && currentMethod?.installments && currentMethod.installments.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Parcelamento
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {currentMethod.installments.map((n) => {
              const installmentValue = calculateInstallment(n, currentMethod.fee);
              const isSelected = selectedInstallments === n;
              const hasInterest = n > 1 && (currentMethod.fee || 0) > 0;

              return (
                <button
                  key={n}
                  onClick={() => handleInstallmentSelect(n)}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  )}
                >
                  <p className={cn(
                    'text-lg font-bold',
                    isSelected ? 'text-primary-600' : 'text-gray-900 dark:text-white'
                  )}>
                    {n}x
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(installmentValue)}
                  </p>
                  {hasInterest && (
                    <p className="text-xs text-amber-600 mt-1">com juros</p>
                  )}
                  {n === 1 && (
                    <p className="text-xs text-green-600 mt-1">à vista</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedMethod && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Resumo do Pagamento
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Valor original</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            
            {currentMethod?.fee && currentMethod.fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Taxa ({currentMethod.fee}%)
                </span>
                <span className="text-amber-600">
                  +{formatCurrency(calculateFee(currentMethod.fee))}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Total</span>
              <span className="text-primary-600">
                {formatCurrency(amount + calculateFee(currentMethod?.fee))}
              </span>
            </div>

            {currentMethod?.installments && selectedInstallments > 1 && (
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Parcelas</span>
                <span>
                  {selectedInstallments}x de {formatCurrency(
                    calculateInstallment(selectedInstallments, currentMethod.fee)
                  )}
                </span>
              </div>
            )}

            {currentMethod?.processingDays !== undefined && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <Clock className="w-4 h-4" />
                <span>
                  {currentMethod.processingDays === 0
                    ? 'Confirmação imediata'
                    : `Confirmação em até ${currentMethod.processingDays} dia(s) útil(is)`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple payment method badge
interface PaymentBadgeProps {
  method: PaymentMethodType;
  className?: string;
}

export function PaymentBadge({ method, className }: PaymentBadgeProps) {
  const methodInfo = DEFAULT_METHODS.find(m => m.type === method);
  if (!methodInfo) return null;

  const Icon = methodInfo.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      className
    )}>
      <Icon className="w-3 h-3" />
      {methodInfo.label}
    </span>
  );
}

// Payment method icon only
interface PaymentIconProps {
  method: PaymentMethodType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PaymentIcon({ method, size = 'md', className }: PaymentIconProps) {
  const methodInfo = DEFAULT_METHODS.find(m => m.type === method);
  if (!methodInfo) return null;

  const Icon = methodInfo.icon;
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return <Icon className={cn(sizeClasses[size], 'text-gray-500', className)} />;
}

export type { PaymentMethod, PaymentMethodType };
export { DEFAULT_METHODS };
export default PaymentMethodSelector;
