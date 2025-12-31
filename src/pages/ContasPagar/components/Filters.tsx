import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContasPagarContext } from '../context';

export function ContasPagarFilters() {
  const { filters, setFilters } = useContasPagarContext();
  
  return (
    <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
      <Input 
        placeholder="Buscar por descrição..." 
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        className="flex-1"
      />
      <Select 
        value={filters.status} 
        onValueChange={(value) => setFilters({ ...filters, status: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="pago">Pago</SelectItem>
          <SelectItem value="vencida">Vencida</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
