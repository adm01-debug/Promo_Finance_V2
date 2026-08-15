import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NovaSimulacaoElisaoDialog({ open, onOpenChange }: Props) {
  const [premissas, setPremissas] = useState({
    aliquota_cbs: 0.088,
    aliquota_ibs: 0.177,
    crescimento: 5,
    folha_prolabore: 28
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cenário de Elisão Fiscal</DialogTitle>
          <DialogDescription>
            Projete o impacto tributário para 2025 cruzando faturamento e despesas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome do Cenário</Label>
            <Input id="nome" placeholder="Ex: Planejamento 2025 v1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Alíquota CBS (%)</Label>
              <Input type="number" value={premissas.aliquota_cbs * 100} onChange={(e) => setPremissas({...premissas, aliquota_cbs: Number(e.target.value)/100})} />
            </div>
            <div className="grid gap-2">
              <Label>Alíquota IBS (%)</Label>
              <Input type="number" value={premissas.aliquota_ibs * 100} onChange={(e) => setPremissas({...premissas, aliquota_ibs: Number(e.target.value)/100})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Crescimento Projetado (%)</Label>
              <Input type="number" value={premissas.crescimento} onChange={(e) => setPremissas({...premissas, crescimento: Number(e.target.value)})} />
            </div>
            <div className="grid gap-2">
              <Label>Peso Folha/Prolabore (%)</Label>
              <Input type="number" value={premissas.folha_prolabore} onChange={(e) => setPremissas({...premissas, folha_prolabore: Number(e.target.value)})} />
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" className="w-full gap-2 text-xs border-dashed" onClick={() => toast.info("Importando dados do diário e centros de custo...")}>
              <RefreshCcw className="h-4 w-4" /> Sincronizar com Contabilidade (Automático)
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => {
            toast.success("Simulação iniciada! O motor está processando os dados históricos.");
            onOpenChange(false);
          }}>Criar Cenário</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
