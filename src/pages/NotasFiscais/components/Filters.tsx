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
    <div className="flex flex-wrap gap-4 bg-card p-4 rounded-lg">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar nota fiscal..." 
          className="pl-10"
        />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-48">
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
          onClick={() => { setStatus('all'); setSearch(''); }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
