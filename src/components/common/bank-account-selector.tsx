import { useState, useMemo } from 'react';
import {
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  ChevronDown,
  Check,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';

// Types
interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  agency?: string;
  balance: number;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// Bank icons mapping
const accountTypeIcons = {
  checking: Building2,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  cash: Wallet,
};

const accountTypeLabels = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit: 'Cartão de Crédito',
  investment: 'Investimentos',
  cash: 'Dinheiro',
};

// Single account display
interface AccountBadgeProps {
  account: BankAccount;
  showBalance?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function AccountBadge({
  account,
  showBalance = false,
  size = 'md',
  onClick,
  className,
}: AccountBadgeProps) {
  const Icon = accountTypeIcons[account.type] || Building2;
  const color = account.color || '#3b82f6';

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <Icon className={iconSizes[size]} />
      <span>{account.name}</span>
      {showBalance && (
        <span className="font-semibold">
          {formatCurrency(account.balance)}
        </span>
      )}
    </div>
  );
}

// Account selector dropdown
interface AccountSelectorProps {
  accounts: BankAccount[];
  selectedId?: string;
  onChange: (account: BankAccount) => void;
  placeholder?: string;
  showBalance?: boolean;
  showSearch?: boolean;
  filterType?: BankAccount['type'][];
  disabled?: boolean;
  className?: string;
}

export function AccountSelector({
  accounts,
  selectedId,
  onChange,
  placeholder = 'Selecionar conta',
  showBalance = true,
  showSearch = false,
  filterType,
  disabled = false,
  className,
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = useMemo(() => {
    let result = accounts.filter((a) => a.isActive !== false);
    
    if (filterType && filterType.length > 0) {
      result = result.filter((a) => filterType.includes(a.type));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.bankName?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [accounts, filterType, searchQuery]);

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  return (
    <div className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors',
          'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
      >
        {selectedAccount ? (
          <div className="flex items-center gap-3">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${selectedAccount.color || '#3b82f6'}15` }}
            >
              {(() => {
                const Icon = accountTypeIcons[selectedAccount.type];
                return <Icon className="w-4 h-4" style={{ color: selectedAccount.color || '#3b82f6' }} />;
              })()}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedAccount.name}
              </p>
              {showBalance && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(selectedAccount.balance)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            {/* Search */}
            {showSearch && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar conta..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredAccounts.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Nenhuma conta encontrada
                </div>
              ) : (
                filteredAccounts.map((account) => {
                  const Icon = accountTypeIcons[account.type];
                  const isSelected = account.id === selectedId;
                  
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        onChange(account);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${account.color || '#3b82f6'}15` }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: account.color || '#3b82f6' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {account.bankName || accountTypeLabels[account.type]}
                        </p>
                      </div>
                      {showBalance && (
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              account.balance >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            {formatCurrency(account.balance)}
                          </p>
                        </div>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Account card (for dashboard)
interface AccountCardProps {
  account: BankAccount;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function AccountCard({
  account,
  onClick,
  showDetails = true,
  className,
}: AccountCardProps) {
  const Icon = accountTypeIcons[account.type] || Building2;
  const color = account.color || '#3b82f6';

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {account.isDefault && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
            Padrão
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {accountTypeLabels[account.type]}
        </p>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {account.name}
        </h3>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">Saldo atual</p>
        <p
          className={cn(
            'text-2xl font-bold',
            account.balance >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {formatCurrency(account.balance)}
        </p>
      </div>

      {showDetails && account.bankName && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Banco</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {account.bankName}
            </span>
          </div>
          {account.agency && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Agência</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {account.agency}
              </span>
            </div>
          )}
          {account.accountNumber && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Conta</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {account.accountNumber}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Accounts list/grid
interface AccountsListProps {
  accounts: BankAccount[];
  layout?: 'grid' | 'list';
  onSelect?: (account: BankAccount) => void;
  onAdd?: () => void;
  showTotal?: boolean;
  className?: string;
}

export function AccountsList({
  accounts,
  layout = 'grid',
  onSelect,
  onAdd,
  showTotal = true,
  className,
}: AccountsListProps) {
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className={className}>
      {/* Total */}
      {showTotal && (
        <div className="mb-4 p-4 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl text-white">
          <p className="text-sm opacity-80">Saldo total</p>
          <p className="text-3xl font-bold">{formatCurrency(total)}</p>
        </div>
      )}

      {/* Accounts */}
      <div
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        )}
      >
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onClick={() => onSelect?.(account)}
            showDetails={layout === 'grid'}
          />
        ))}

        {/* Add account button */}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600',
              'text-gray-500 hover:text-primary-600 hover:border-primary-400',
              'transition-colors',
              layout === 'grid' ? 'min-h-[200px]' : ''
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Adicionar conta</span>
          </button>
        )}
      </div>
    </div>
  );
}

export type { BankAccount };
export { accountTypeIcons, accountTypeLabels };
export default AccountSelector;
