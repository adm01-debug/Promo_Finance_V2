import { useState, useEffect } from 'react';
import { Landmark, Check, ChevronsUpDown, CreditCard, Wallet, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useBankAccounts, BankAccount } from '@/hooks/useBankAccounts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

const STORAGE_KEY = 'pf:current-bank-account-id';

export function getCurrentBankAccountId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setCurrentBankAccountId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY, id);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent('current-bank-account-changed', { detail: id }));
}

export function BankAccountSwitcher() {
  const { data: accounts = [], isLoading } = useBankAccounts();
  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(getCurrentBankAccountId());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setCurrentId(detail);
    };
    window.addEventListener('current-bank-account-changed', handler);
    return () => window.removeEventListener('current-bank-account-changed', handler);
  }, []);

  // Se não tiver conta selecionada mas houver contas disponíveis, seleciona a primeira ou a que tiver maior saldo
  useEffect(() => {
    if (!currentId && accounts.length > 0) {
      const bestAccount = accounts.sort((a, b) => (b.saldo_atual || 0) - (a.saldo_atual || 0))[0];
      setCurrentBankAccountId(bestAccount.id);
      setCurrentId(bestAccount.id);
    }
  }, [accounts, currentId]);

  if (isLoading || accounts.length === 0) return null;

  const current = accounts.find((a) => a.id === currentId);

  const handleSelect = (id: string | null) => {
    setCurrentBankAccountId(id);
    setCurrentId(id);
    setOpen(false);
    toast.success('Conta bancária selecionada', {
      description: id ? `Filtrando dados para a conta ${accounts.find(a => a.id === id)?.banco}` : 'Mostrando todas as contas',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[240px] justify-between h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl backdrop-blur-sm group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={cn(
                "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                current?.cor || "bg-primary/20 text-primary"
              )} style={{ backgroundColor: current?.cor ? `${current.cor}20` : undefined, color: current?.cor }}>
                <Landmark className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col items-start truncate">
                <span className="text-xs font-bold text-white truncate">
                  {current ? `${current.banco} (${current.conta})` : 'Todas as Contas'}
                </span>
                {current && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatCurrency(current.saldo_atual)}
                  </span>
                )}
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-y-0.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-[#0A0D12]/95 border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden" align="start">
          <Command className="bg-transparent">
            <CommandInput placeholder="Buscar conta..." className="h-12 border-none bg-transparent focus:ring-0" />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
              <CommandGroup heading="Contas Ativas">
                <CommandItem
                  onSelect={() => handleSelect(null)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Todas as Contas</span>
                  </div>
                  {!currentId && <Check className="h-4 w-4 text-primary" />}
                </CommandItem>
                {accounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    onSelect={() => handleSelect(account.id)}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${account.cor || '#3b82f6'}20`, color: account.cor || '#3b82f6' }}
                      >
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-medium truncate">{account.banco}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Ag: {account.agencia} | Cc: {account.conta}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {formatCurrency(account.saldo_atual)}
                      </span>
                      {currentId === account.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="p-2 border-t border-white/5 bg-white/5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Consolidado Bancário</span>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] hover:bg-white/10" onClick={() => window.location.href = '/contas-bancarias'}>
              Gerenciar Contas
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
