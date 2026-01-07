import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function NFHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold dark:text-white">Notas Fiscais</h1>
      <Button className="w-full sm:w-auto h-9 sm:h-10 text-sm">
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span className="hidden sm:inline">Emitir NFe</span>
        <span className="sm:hidden">Nova NFe</span>
      </Button>
    </div>
  );
}
