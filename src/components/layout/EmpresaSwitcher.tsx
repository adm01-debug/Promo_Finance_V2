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

  if (isLoading || vinculos.length <= 1) return null;

  const current = vinculos.find(v => v.empresa_id === currentId) ?? vinculos[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="gap-2 max-w-[260px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{current?.empresa.nome_fantasia || current?.empresa.razao_social}</span>
          <Badge variant="secondary" className="text-[10px] uppercase">{current?.role}</Badge>
          <ChevronsUpDown className="h-3 w-3 ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa…" />
          <CommandList>
            <CommandEmpty>Nenhuma empresa</CommandEmpty>
            <CommandGroup>
              {vinculos.map(v => (
                <CommandItem
                  key={v.empresa_id}
                  onSelect={() => {
                    setCurrentEmpresaId(v.empresa_id);
                    setCurrentId(v.empresa_id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', currentId === v.empresa_id ? 'opacity-100' : 'opacity-0')} />
                  <div className="flex-1 truncate">
                    <div className="truncate">{v.empresa.nome_fantasia || v.empresa.razao_social}</div>
                    <div className="text-xs text-muted-foreground">{v.empresa.cnpj}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">{v.role}</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
