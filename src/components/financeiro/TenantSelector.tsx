import { useTenant } from '@/contexts/TenantContext';
import { useEmpresas } from '@/hooks/useFinancialData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TenantSelector() {
  const { selectedTenantId, setSelectedTenantId, isLoading: tenantLoading } = useTenant();
  const { data: empresas, isLoading: empresasLoading } = useEmpresas();

  if (tenantLoading || empresasLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  if (!empresas || empresas.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTenantId || ''} onValueChange={setSelectedTenantId}>
        <SelectTrigger className="w-[250px] bg-background/50 backdrop-blur-sm border-white/10">
          <SelectValue placeholder="Selecionar Empresa (CNPJ)" />
        </SelectTrigger>
        <SelectContent>
          {empresas.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{emp.nome_fantasia || emp.razao_social}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{emp.cnpj}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
