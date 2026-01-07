import { useNFContext } from '../context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

export function NFFilters() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 bg-card p-3 sm:p-4 rounded-lg">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar nota fiscal..." 
          className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
        />
      </div>
      <div className="flex gap-2 sm:gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40 lg:w-48 h-9 sm:h-10 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="autorizada">Autorizada</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        {(status !== 'all' || search) && (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
            onClick={() => { setStatus('all'); setSearch(''); }}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
