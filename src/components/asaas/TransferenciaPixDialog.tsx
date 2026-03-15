// ============================================
// DIALOG: Transferência Pix ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Loader2, Send } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
}

export function TransferenciaPixDialog({ open, onOpenChange, empresaId }: Props) {
  const { transferirPix } = useAsaas(empresaId);

  const [valor, setValor] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoChave, setTipoChave] = useState('CPF');
  const [descricao, setDescricao] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmar = () => {
    const valorNum = parseFloat(valor);
    if (!chavePix || isNaN(valorNum) || valorNum <= 0) {
      toast.error('Preencha valor e chave Pix');
      return;
    }
    setConfirmOpen(true);
  };

  const handleTransferir = async () => {
    setConfirmOpen(false);
    try {
      await transferirPix.mutateAsync({
        valor: parseFloat(valor),
        chave_pix: chavePix,
        tipo_chave: tipoChave,
        descricao: descricao || undefined,
      });
      setValor(''); setChavePix(''); setDescricao('');
      onOpenChange(false);
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Transferência Pix</DialogTitle>
          <DialogDescription>Envie um Pix diretamente da conta ASAAS</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" min="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="100.00" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoChave} onValueChange={setTipoChave}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="EVP">Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Chave Pix *</Label>
              <Input value={chavePix} onChange={e => setChavePix(e.target.value)} placeholder="Chave Pix do destinatário" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição da transferência..." rows={2} />
          </div>
          <Button className="w-full" onClick={handleTransferir} disabled={transferirPix.isPending || !chavePix || !valor}>
            {transferirPix.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Transferindo...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Enviar Pix</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
