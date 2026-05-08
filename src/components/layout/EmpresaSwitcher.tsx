import { useEffect, useState } from 'react';
import { Building2, Check, ChevronsUpDown, BarChart3, ArrowUpCircle, ArrowDownCircle, RefreshCcw, Receipt, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserEmpresas, getCurrentEmpresaId, setCurrentEmpresaId } from '@/hooks/useUserEmpresas';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';


function getInitials(label: string): string {
  return label
    .replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '??';
}

export function EmpresaSwitcher() {
  const { data: vinculos = [], isLoading } = useUserEmpresas();
  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(getCurrentEmpresaId());

  useEffect(() => {
    if (!currentId && vinculos.length) {
      const def = vinculos.find((v) => v.is_default) ?? vinculos[0];
      setCurrentEmpresaId(def.empresa_id);
      setCurrentId(def.empresa_id);
    }
  }, [vinculos, currentId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setCurrentId(detail);
    };
    window.addEventListener('current-empresa-changed', handler);
    return () => window.removeEventListener('current-empresa-changed', handler);
  }, []);

  if (isLoading || vinculos.length === 0) return null;

  const switchTo = (id: string) => {
    setCurrentEmpresaId(id);
    setCurrentId(id);
    setOpen(false);
  };

  const current = vinculos.find((v) => v.empresa_id === currentId) ?? vinculos[0];
  const isSingle = vinculos.length === 1;

  // Quick access: até 4 empresas como "pills" diretas no header
  const quickAccess = vinculos.slice(0, 4);
  const overflow = vinculos.slice(4);

  if (isSingle) {
    return (
      <div className="flex items-center gap-2 px-3 h-11">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-white truncate max-w-[200px]">
          {current?.empresa.nome_fantasia || current?.empresa.razao_social}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Quick switch pills - 4 empresas do Grupo Promo Brindes */}
      <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        {quickAccess.map((v) => {
          const label = v.empresa.nome_fantasia || v.empresa.razao_social;
          const isActive = v.empresa_id === currentId;
          return (
            <Tooltip key={v.empresa_id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => switchTo(v.empresa_id)}
                  aria-label={`Trocar para ${label}`}
                  aria-pressed={isActive}
                  className={cn(
                    'relative h-9 px-3 rounded-xl flex items-center gap-2 text-[10px] font-black transition-all duration-500 border group',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_8px_20px_-4px_rgba(var(--primary),0.4)] scale-105 z-10'
                      : 'bg-transparent text-white/40 border-transparent hover:bg-white/10 hover:text-white hover:border-white/10',
                  )}
                >
                  <span className="tracking-tighter uppercase whitespace-nowrap">
                    {getInitials(label)}
                  </span>
                  {isActive && (
                    <motion.span 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      className="truncate max-w-[80px] font-bold"
                    >
                      {label}
                    </motion.span>
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 blur-md rounded-xl transition-opacity" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-bold bg-background/95 backdrop-blur-md border-white/10">
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground uppercase tracking-wider">{label}</span>
                  <span className="text-muted-foreground font-mono">{v.empresa.cnpj}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="hidden lg:block w-px h-6 bg-white/10 mx-1" />


      {/* Dropdown completo (sempre visível) */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="gap-2 max-w-[260px] h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300"
            aria-label="Selecionar empresa"
          >
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-semibold xl:hidden">
              {current?.empresa.nome_fantasia || current?.empresa.razao_social}
            </span>
            <span className="hidden xl:inline text-xs font-semibold">Empresas</span>
            {overflow.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                +{overflow.length}
              </Badge>
            )}
            <ChevronsUpDown className="h-3 w-3 ml-auto opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] p-0 rounded-2xl overflow-hidden border-border/40 shadow-2xl"
          align="end"
        >
          <Command>
            <CommandInput placeholder="Buscar empresa…" />
            <CommandList>
              <CommandEmpty>Nenhuma empresa</CommandEmpty>
              <CommandGroup heading="Grupo Promo Brindes">
                {vinculos.map((v) => {
                  const label = v.empresa.nome_fantasia || v.empresa.razao_social;
                  const sso = v.provisioned_via === 'sso' || v.provisioned_via === 'scim';
                  return (
                    <CommandItem
                      key={v.empresa_id}
                      className="p-3 rounded-xl m-1 transition-all duration-300 hover:bg-primary/5 cursor-pointer"
                      onSelect={() => switchTo(v.empresa_id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 text-primary',
                          currentId === v.empresa_id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-semibold">{label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {v.empresa.cnpj}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {v.role}
                        </Badge>
                        {sso && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            SSO
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
