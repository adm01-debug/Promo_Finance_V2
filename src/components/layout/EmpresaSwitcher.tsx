import { useEffect, useState } from 'react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useUserEmpresas, getCurrentEmpresaId, setCurrentEmpresaId } from '@/hooks/useUserEmpresas';
import { cn } from '@/lib/utils';

export function EmpresaSwitcher() {
  const { data: vinculos = [], isLoading } = useUserEmpresas();
  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(getCurrentEmpresaId());

  useEffect(() => {
    if (!currentId && vinculos.length) {
      const def = vinculos.find(v => v.is_default) ?? vinculos[0];
      setCurrentEmpresaId(def.empresa_id);
      setCurrentId(def.empresa_id);
    }
  }, [vinculos, currentId]);

  // Sincroniza quando outra parte da UI troca a empresa
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setCurrentId(detail);
    };
    window.addEventListener('current-empresa-changed', handler);
    return () => window.removeEventListener('current-empresa-changed', handler);
  }, []);

  if (isLoading || vinculos.length === 0) return null;

  const current = vinculos.find(v => v.empresa_id === currentId) ?? vinculos[0];
  const isSingle = vinculos.length === 1;
  const isSso = current?.provisioned_via === 'sso' || current?.provisioned_via === 'scim';

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      className="gap-2 max-w-[280px] h-10"
      disabled={isSingle}
      aria-label="Trocar empresa"
    >
      <Building2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate text-sm font-medium">
        {current?.empresa.nome_fantasia || current?.empresa.razao_social}
      </span>
      <Badge variant="secondary" className="text-[10px] uppercase">{current?.role}</Badge>
      {isSso && <Badge variant="outline" className="text-[10px] uppercase">SSO</Badge>}
      {!isSingle && <ChevronsUpDown className="h-3 w-3 ml-auto opacity-50" />}
    </Button>
  );

  if (isSingle) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar empresa…" />
          <CommandList>
            <CommandEmpty>Nenhuma empresa</CommandEmpty>
            <CommandGroup>
              {vinculos.map(v => {
                const sso = v.provisioned_via === 'sso' || v.provisioned_via === 'scim';
                return (
                  <CommandItem
                    key={v.empresa_id}
                    onSelect={() => {
                      setCurrentEmpresaId(v.empresa_id);
                      setCurrentId(v.empresa_id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', currentId === v.empresa_id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">
                        {v.empresa.nome_fantasia || v.empresa.razao_social}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{v.empresa.cnpj}</div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{v.role}</Badge>
                      {sso && <Badge variant="outline" className="text-[10px] uppercase">SSO</Badge>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
