import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ContingencyMode, TIPO_EMISSAO, MOTIVOS_CONTINGENCIA } from '@/lib/sefaz-contingency';

interface ActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: (mode: ContingencyMode, reason: string, estimatedHours: number) => void;
}

export function ActivateContingencyDialog({ open, onOpenChange, onActivate }: ActivateDialogProps) {
  const [selectedMode, setSelectedMode] = useState<ContingencyMode>('offline');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');

  const handleActivate = () => {
    const reason = selectedReason === 'Outro motivo' ? customReason : selectedReason;
    onActivate(selectedMode, reason, parseInt(estimatedHours));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />Ativar Contingência
          </DialogTitle>
          <DialogDescription>Selecione o modo e motivo da contingência</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Modo de Contingência</Label>
            <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as ContingencyMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_EMISSAO).filter(([k]) => k !== 'normal').map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">{info.label} - {info.description}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                {MOTIVOS_CONTINGENCIA.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedReason === 'Outro motivo' && (
            <div className="space-y-2">
              <Label>Motivo personalizado</Label>
              <Textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Descreva o motivo..." />
            </div>
          )}
          <div className="space-y-2">
            <Label>Previsão de retorno (horas)</Label>
            <Input type="number" min="1" max="72" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleActivate} disabled={!selectedReason && !customReason}>Ativar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeactivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPending: boolean;
  onDeactivate: () => void;
}

export function DeactivateContingencyDialog({ open, onOpenChange, hasPending, onDeactivate }: DeactivateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />Desativar Contingência
          </DialogTitle>
          <DialogDescription>O sistema voltará ao modo normal de operação</DialogDescription>
        </DialogHeader>
        {hasPending ? (
          <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 text-warning"><AlertTriangle className="h-4 w-4" /><span className="font-medium">NF-e pendentes</span></div>
            <p className="text-sm text-muted-foreground mt-1">Transmita todas as NF-e pendentes antes de desativar</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Confirma a desativação do modo de contingência?</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onDeactivate} disabled={hasPending}>Desativar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
