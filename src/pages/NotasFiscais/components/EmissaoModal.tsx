import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

export function NFEmissaoModal() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 gap-1.5 sm:gap-2 shadow-lg h-10 sm:h-11 px-3 sm:px-4 text-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova NFe</span>
          <span className="sm:hidden">NFe</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-2xl mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Emitir Nota Fiscal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label className="text-xs sm:text-sm">Cliente</Label>
            <Input placeholder="Nome do cliente" className="h-9 sm:h-10 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">CNPJ/CPF</Label>
              <Input placeholder="00.000.000/0000-00" className="h-9 sm:h-10 text-sm" />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">Valor Total</Label>
              <Input type="number" placeholder="0,00" className="h-9 sm:h-10 text-sm" />
            </div>
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label className="text-xs sm:text-sm">Descrição</Label>
            <Input placeholder="Descrição dos produtos/serviços" className="h-9 sm:h-10 text-sm" />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto h-9 sm:h-10 text-sm">Emitir NFe</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
