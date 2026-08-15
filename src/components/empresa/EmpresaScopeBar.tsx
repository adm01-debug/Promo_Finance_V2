/**
 * EmpresaScopeBar — substitui o EmpresaSwitcher legado.
 *
 * - Mostra badges das empresas em escopo
 * - Toggle "📊 Consolidado" / "🎯 Focado"
 * - Multi-select via popover (consolidado)
 * - Single-select via popover (focado)
 * - Suporta atalho Cmd+E (ou Ctrl+E) para abrir
 */
import { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Crosshair, ChevronDown, Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEmpresaScope } from '@/contexts/useEmpresaScope';
import { EmpresaBadge } from '@/components/empresa/EmpresaBadge';

export function EmpresaScopeBar() {
  const { mode, ids, availableEmpresas, isLoading, setMode, toggleEmpresa, selectAll, focusEmpresa } = useEmpresaScope();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Atalho Cmd+E / Ctrl+E
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        const target = e.target as HTMLElement | null;
        // Não interferir em inputs
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        setOpen((v) => !v);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (isLoading || availableEmpresas.length === 0) return null;

  // Empresa única: simplificado
  if (availableEmpresas.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-card/40 border border-border/40">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
          {availableEmpresas[0].empresa.nome_fantasia || availableEmpresas[0].empresa.razao_social}
        </span>
      </div>
    );
  }

  const isConsolidated = mode === 'consolidated';
  const totalSelected = ids.length;
  const totalAvail = availableEmpresas.length;

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Consolidado/Focado */}
      <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/40 border border-border/40">
        <Button
          variant={isConsolidated ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('consolidated')}
          className="h-8 px-2.5 text-[11px] font-bold uppercase tracking-wider gap-1.5"
          aria-pressed={isConsolidated}
          aria-label="Modo consolidado: ver várias empresas"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Consolidado
        </Button>
        <Button
          variant={!isConsolidated ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('focused')}
          className="h-8 px-2.5 text-[11px] font-bold uppercase tracking-wider gap-1.5"
          aria-pressed={!isConsolidated}
          aria-label="Modo focado: trabalhar em uma só"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Focado
        </Button>
      </div>

      {/* Trigger do popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            className="h-10 px-3 rounded-xl gap-2 border-border/60 bg-card/40 hover:bg-card/60"
            aria-label={`Selecionar empresas (${totalSelected} de ${totalAvail})`}
          >
            <div className="flex items-center -space-x-1.5">
              {availableEmpresas
                .filter((v) => ids.includes(v.empresa_id))
                .slice(0, 4)
                .map((v) => (
                  <EmpresaBadge key={v.empresa_id} empresaId={v.empresa_id} size="sm" />
                ))}
            </div>
            {totalSelected > 4 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                +{totalSelected - 4}
              </Badge>
            )}
            <span className="text-xs font-semibold text-muted-foreground hidden lg:inline">
              {isConsolidated ? `${totalSelected}/${totalAvail}` : 'foco'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0 rounded-2xl overflow-hidden" align="end">
          <Command>
            <CommandInput placeholder="Buscar empresa…" className="h-11" />
            <CommandList className="max-h-[420px]">
              <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>

              {isConsolidated && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {totalSelected} de {totalAvail} selecionadas
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] font-bold uppercase tracking-wider"
                    onClick={selectAll}
                  >
                    Selecionar todas
                  </Button>
                </div>
              )}

              <CommandGroup heading={isConsolidated ? 'Empresas em escopo' : 'Foque em uma empresa'}>
                {availableEmpresas.map((v) => {
                  const selected = ids.includes(v.empresa_id);
                  const label = v.empresa.nome_fantasia || v.empresa.razao_social;
                  return (
                    <CommandItem
                      key={v.empresa_id}
                      value={`${label} ${v.empresa.cnpj}`}
                      onSelect={() => {
                        if (isConsolidated) toggleEmpresa(v.empresa_id);
                        else {
                          focusEmpresa(v.empresa_id);
                          setOpen(false);
                        }
                      }}
                      className="cursor-pointer gap-3 py-2.5"
                    >
                      <EmpresaBadge empresaId={v.empresa_id} />
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-semibold truncate', selected && 'text-primary')}>
                          {label}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{v.empresa.cnpj}</div>
                      </div>
                      {isConsolidated && selected && <Check className="h-4 w-4 text-primary" />}
                      {!isConsolidated && selected && <Crosshair className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <div className="px-3 py-2 border-t border-border/40 text-[10px] text-muted-foreground">
                Atalho: <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌘E</kbd> para abrir
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
