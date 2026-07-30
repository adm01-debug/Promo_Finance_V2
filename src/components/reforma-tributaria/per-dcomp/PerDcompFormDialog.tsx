import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DollarSign, ArrowLeftRight } from 'lucide-react';
import type { TipoPedido, TipoCreditoOrigem } from '@/hooks/usePerDcomp';

export interface PerDcompFormData {
  tipo: TipoPedido;
  tipo_credito_origem: TipoCreditoOrigem;
  tributo_origem: string;
  competencia_origem: string;
  valor_original: number;
  tributo_destino: string;
  competencia_destino: string;
  justificativa: string;
}

interface Tributo { codigo: string; nome: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PerDcompFormData;
  setFormData: (updater: (prev: PerDcompFormData) => PerDcompFormData) => void;
  onSubmit: () => void;
  TRIBUTOS_VALIDOS: Tributo[];
  TIPOS_CREDITO_ORIGEM: Tributo[];
}

export function PerDcompFormDialog({
  open, onOpenChange, formData, setFormData, onSubmit,
  TRIBUTOS_VALIDOS, TIPOS_CREDITO_ORIGEM,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo PER/DCOMP</DialogTitle>
          <DialogDescription>
            Crie um pedido de restituição ou compensação de créditos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={formData.tipo === 'per' ? 'default' : 'outline'}
              className="h-20 flex-col"
              onClick={() => setFormData(prev => ({ ...prev, tipo: 'per' }))}
            >
              <DollarSign className="h-6 w-6 mb-1" />
              <span>PER - Restituição</span>
              <span className="text-xs opacity-70">Receber de volta</span>
            </Button>
            <Button
              variant={formData.tipo === 'dcomp' ? 'default' : 'outline'}
              className="h-20 flex-col"
              onClick={() => setFormData(prev => ({ ...prev, tipo: 'dcomp' }))}
            >
              <ArrowLeftRight className="h-6 w-6 mb-1" />
              <span>DCOMP - Compensação</span>
              <span className="text-xs opacity-70">Abater de débitos</span>
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo do Crédito</Label>
              <Select
                value={formData.tipo_credito_origem}
                onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_credito_origem: v as TipoCreditoOrigem }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CREDITO_ORIGEM.map((tipo) => (
                    <SelectItem key={tipo.codigo} value={tipo.codigo}>{tipo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tributo Origem</Label>
              <Select
                value={formData.tributo_origem}
                onValueChange={(v) => setFormData(prev => ({ ...prev, tributo_origem: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIBUTOS_VALIDOS.map((tributo) => (
                    <SelectItem key={tributo.codigo} value={tributo.codigo}>{tributo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Competência Origem</Label>
              <Input
                type="month"
                value={formData.competencia_origem}
                onChange={(e) => setFormData(prev => ({ ...prev, competencia_origem: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Original do Crédito</Label>
              <Input
                type="number"
                value={formData.valor_original}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_original: Number(e.target.value) }))}
                min={0}
                step={0.01}
              />
            </div>
          </div>

          {formData.tipo === 'dcomp' && (
            <>
              <Separator />
              <p className="text-sm font-medium">Débito a Compensar</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tributo Destino</Label>
                  <Select
                    value={formData.tributo_destino}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, tributo_destino: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {TRIBUTOS_VALIDOS.map((tributo) => (
                        <SelectItem key={tributo.codigo} value={tributo.codigo}>{tributo.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Competência Destino</Label>
                  <Input
                    type="month"
                    value={formData.competencia_destino}
                    onChange={(e) => setFormData(prev => ({ ...prev, competencia_destino: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Justificativa</Label>
            <Textarea
              value={formData.justificativa}
              onChange={(e) => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
              placeholder="Descreva o motivo do pedido..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={formData.valor_original <= 0}>
            Criar Rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
