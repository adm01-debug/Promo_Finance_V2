import { useState, useMemo } from 'react';
import {
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  Smartphone,
  Receipt,
  CheckCircle,
  ChevronDown,
  Plus,
  Trash2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type PaymentMethodType =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'boleto'
  | 'transfer'
  | 'cash'
  | 'check'
  | 'wallet';

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  description?: string;
  details?: {
    cardLast4?: string;
    cardBrand?: string;
    pixKey?: string;
    bankName?: string;
    walletProvider?: string;
  };
  isDefault?: boolean;
  isActive?: boolean;
}

interface InstallmentOption {
  installments: number;
  amount: number;
  total: number;
  interestRate?: number;
  hasInterest: boolean;
}

// Icons mapping
const paymentMethodIcons: Record<PaymentMethodType, typeof CreditCard> = {
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  boleto: Receipt,
  transfer: Building2,
  cash: Banknote,
  check: Receipt,
  wallet: Smartphone,
};

const paymentMethodLabels: Record<PaymentMethodType, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  transfer: 'Transferência Bancária',
  cash: 'Dinheiro',
  check: 'Cheque',
  wallet: 'Carteira Digital',
};

const paymentMethodColors: Record<PaymentMethodType, string> = {
  pix: '#00D4AA',
  credit_card: '#3b82f6',
  debit_card: '#8b5cf6',
  boleto: '#f59e0b',
  transfer: '#10b981',
  cash: '#22c55e',
  check: '#6b7280',
  wallet: '#ec4899',
};

// Card brand icons (simplified)
const cardBrands: Record<string, { name: string; color: string }> = {
  visa: { name: 'Visa', color: '#1A1F71' },
  mastercard: { name: 'Mastercard', color: '#EB001B' },
  elo: { name: 'Elo', color: '#FFCB05' },
  amex: { name: 'Amex', color: '#006FCF' },
  hipercard: { name: 'Hipercard', color: '#B3131B' },
};

// Payment method badge
interface PaymentMethodBadgeProps {
  type: PaymentMethodType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function PaymentMethodBadge({
  type,
  size = 'md',
  showLabel = true,
  className,
}: PaymentMethodBadgeProps) {
  const Icon = paymentMethodIcons[type];
  const color = paymentMethodColors[type];

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-2.5 py-1.5 text-sm gap-1.5',
    lg: 'px-3 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg font-medium',
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{paymentMethodLabels[type]}</span>}
    </div>
  );
}

// Payment method card
interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
  className?: string;
}

export function PaymentMethodCard({
  method,
  isSelected = false,
  onSelect,
  onDelete,
  onSetDefault,
  showActions = false,
  className,
}: PaymentMethodCardProps) {
  const Icon = paymentMethodIcons[method.type];
  const color = paymentMethodColors[method.type];

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all',
        onSelect && 'cursor-pointer',
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        className
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="w-5 h-5 text-primary-600" />
        </div>
      )}

      {/* Default badge */}
      {method.isDefault && !isSelected && (
        <div className="absolute top-3 right-3">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {method.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {paymentMethodLabels[method.type]}
          </p>

          {/* Card details */}
          {method.details?.cardLast4 && (
            <p className="text-sm text-gray-500 mt-1">
              •••• {method.details.cardLast4}
              {method.details.cardBrand && (
                <span
                  className="ml-2 font-medium"
                  style={{ color: cardBrands[method.details.cardBrand]?.color }}
                >
                  {cardBrands[method.details.cardBrand]?.name || method.details.cardBrand}
                </span>
              )}
            </p>
          )}

          {/* PIX key */}
          {method.details?.pixKey && (
            <p className="text-sm text-gray-500 mt-1">
              Chave: {method.details.pixKey}
            </p>
          )}

          {/* Bank */}
          {method.details?.bankName && (
            <p className="text-sm text-gray-500 mt-1">
              {method.details.bankName}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {!method.isDefault && onSetDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
            >
              <Star className="w-3 h-3" />
              Definir padrão
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 ml-auto"
            >
              <Trash2 className="w-3 h-3" />
              Remover
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Payment method selector
interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedId?: string;
  onChange: (method: PaymentMethod) => void;
  showAddButton?: boolean;
  onAddNew?: () => void;
  layout?: 'grid' | 'list';
  className?: string;
}

export function PaymentMethodSelector({
  methods,
  selectedId,
  onChange,
  showAddButton = false,
  onAddNew,
  layout = 'grid',
  className,
}: PaymentMethodSelectorProps) {
  const activeMethods = methods.filter((m) => m.isActive !== false);

  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
          : 'space-y-3',
        className
      )}
    >
      {activeMethods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          isSelected={method.id === selectedId}
          onSelect={() => onChange(method)}
        />
      ))}

      {showAddButton && (
        <button
          type="button"
          onClick={onAddNew}
          className={cn(
            'flex items-center justify-center gap-2 p-4 rounded-xl',
            'border-2 border-dashed border-gray-300 dark:border-gray-600',
            'text-gray-500 hover:text-primary-600 hover:border-primary-400',
            'transition-colors'
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Adicionar forma de pagamento</span>
        </button>
      )}
    </div>
  );
}

// Payment type quick select
interface PaymentTypeSelectProps {
  selectedType?: PaymentMethodType;
  onChange: (type: PaymentMethodType) => void;
  availableTypes?: PaymentMethodType[];
  className?: string;
}

export function PaymentTypeSelect({
  selectedType,
  onChange,
  availableTypes = ['pix', 'credit_card', 'debit_card', 'boleto', 'transfer', 'cash'],
  className,
}: PaymentTypeSelectProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {availableTypes.map((type) => {
        const Icon = paymentMethodIcons[type];
        const isSelected = type === selectedType;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              isSelected
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {paymentMethodLabels[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Installments selector
interface InstallmentSelectorProps {
  total: number;
  maxInstallments?: number;
  interestRate?: number; // Monthly interest rate
  minInstallmentValue?: number;
  selectedInstallments: number;
  onChange: (option: InstallmentOption) => void;
  className?: string;
}

export function InstallmentSelector({
  total,
  maxInstallments = 12,
  interestRate = 0,
  minInstallmentValue = 10,
  selectedInstallments,
  onChange,
  className,
}: InstallmentSelectorProps) {
  const options = useMemo(() => {
    const result: InstallmentOption[] = [];

    for (let i = 1; i <= maxInstallments; i++) {
      const hasInterest = i > 1 && interestRate > 0;
      let installmentTotal = total;
      let amount = total / i;

      if (hasInterest) {
        // Simple interest calculation
        installmentTotal = total * (1 + interestRate * (i - 1));
        amount = installmentTotal / i;
      }

      if (amount >= minInstallmentValue) {
        result.push({
          installments: i,
          amount,
          total: installmentTotal,
          interestRate: hasInterest ? interestRate * 100 : undefined,
          hasInterest,
        });
      }
    }

    return result;
  }, [total, maxInstallments, interestRate, minInstallmentValue]);

  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.installments === selectedInstallments) || options[0];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors',
          'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
          'hover:border-gray-400 focus:ring-2 focus:ring-primary-500',
          isOpen && 'ring-2 ring-primary-500'
        )}
      >
        <div>
          <span className="font-medium text-gray-900 dark:text-white">
            {selected.installments}x de {formatCurrency(selected.amount)}
          </span>
          {selected.hasInterest && (
            <span className="ml-2 text-sm text-gray-500">
              (Total: {formatCurrency(selected.total)})
            </span>
          )}
          {!selected.hasInterest && selected.installments > 1 && (
            <span className="ml-2 text-sm text-green-600">sem juros</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.installments}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                  option.installments === selectedInstallments
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.installments}x de {formatCurrency(option.amount)}
                  </span>
                  {option.hasInterest && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({option.interestRate?.toFixed(1)}% a.m.)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {option.hasInterest ? (
                    <span className="text-sm text-gray-500">
                      Total: {formatCurrency(option.total)}
                    </span>
                  ) : option.installments > 1 ? (
                    <span className="text-sm text-green-600 font-medium">
                      sem juros
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">à vista</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export type { PaymentMethod, PaymentMethodType, InstallmentOption };
export { paymentMethodIcons, paymentMethodLabels, paymentMethodColors };
export default PaymentMethodSelector;
