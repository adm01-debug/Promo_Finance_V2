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
        <Button className="fixed bottom-6 right-6 gap-2 shadow-lg">
          <Plus className="h-4 w-4" />
          Nova NFe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Emitir Nota Fiscal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Input placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>CNPJ/CPF</Label>
              <Input placeholder="00.000.000/0000-00" />
            </div>
            <div className="grid gap-2">
              <Label>Valor Total</Label>
              <Input type="number" placeholder="0,00" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input placeholder="Descrição dos produtos/serviços" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button>Emitir NFe</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
