import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBIContext } from '../context';

export function BIFilters() {
  const { period, setPeriod } = useBIContext();
  
  return (
    <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg">
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Diário</SelectItem>
          <SelectItem value="week">Semanal</SelectItem>
          <SelectItem value="month">Mensal</SelectItem>
          <SelectItem value="year">Anual</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
