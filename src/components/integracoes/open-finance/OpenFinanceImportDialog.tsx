import { Download, Calendar, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ContaBancariaOpenFinance {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  empresa_id: string;
  empresas: { razao_social: string } | null;
}

interface OpenFinanceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contasBancarias?: ContaBancariaOpenFinance[];
  selectedContaBancaria: string;
  setSelectedContaBancaria: (id: string) => void;
  selectedPeriod: string;
  setSelectedPeriod: (p: string) => void;
  importing: boolean;
  onImport: () => void;
}

export function OpenFinanceImportDialog({
  open,
  onOpenChange,
  contasBancarias,
  selectedContaBancaria,
  setSelectedContaBancaria,
  selectedPeriod,
  setSelectedPeriod,
  importing,
  onImport,
}: OpenFinanceImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar Transações
          </DialogTitle>
          <DialogDescription>
            Importe as transações do Open Finance para conciliação bancária
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Conta Bancária de Destino</Label>
            <Select value={selectedContaBancaria} onValueChange={setSelectedContaBancaria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta no sistema" />
              </SelectTrigger>
              <SelectContent>
                {contasBancarias?.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.banco} - Ag: {conta.agencia} / Cc: {conta.conta}
                    {conta.empresas && ` (${conta.empresas.razao_social})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincule a conta do Open Finance com uma conta cadastrada no sistema
            </p>
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Transações duplicadas serão ignoradas</p>
                <p className="text-muted-foreground text-xs mt-1">
                  O sistema identifica automaticamente transações já importadas
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onImport} disabled={!selectedContaBancaria || importing} className="gap-2">
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Importar Transações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
