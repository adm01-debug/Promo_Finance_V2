import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function NFHeader() {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold dark:text-white">Notas Fiscais</h1>
      <Button><Plus className="w-4 h-4 mr-2" />Emitir NFe</Button>
    </div>
  );
}
