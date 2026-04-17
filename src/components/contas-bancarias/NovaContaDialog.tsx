import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface Empresa { id: string; nome_fantasia?: string | null; razao_social: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresas: Empresa[];
  bancos: string[];
}

export function NovaContaDialog({ open, onOpenChange, empresas, bancos }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Conta Bancária</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Empresa</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {empresas.map(empresa => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Banco</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
              <SelectContent>
                {bancos.map(banco => (
                  <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Agência</Label>
              <Input placeholder="0000" />
            </div>
            <div className="grid gap-2">
              <Label>Conta</Label>
              <Input placeholder="00000-0" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Conta</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Saldo Inicial</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <Button className="w-full mt-2">Adicionar Conta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
