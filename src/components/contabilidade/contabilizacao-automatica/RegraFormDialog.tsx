import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Categoria, PlanoConta, RegraFormState, TipoEvento } from './types';
import { EVENTOS } from './types';

const INITIAL_FORM: RegraFormState = {
  nome: '',
  tipo_evento: 'conta_pagar',
  categoria_id: null,
  conta_debito_id: '',
  conta_credito_id: '',
  historico_template: '{descricao}',
  prioridade: 100,
};

export interface RegraFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contas: PlanoConta[];
  categorias: Categoria[];
  onSubmit: (form: RegraFormState) => void;
  isSubmitting: boolean;
}

export function RegraFormDialog({
  open,
  onOpenChange,
  contas,
  categorias,
  onSubmit,
  isSubmitting,
}: RegraFormDialogProps) {
  const [form, setForm] = useState<RegraFormState>(INITIAL_FORM);

  useEffect(() => {
    if (!open) setForm(INITIAL_FORM);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova regra de contabilização</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Pagamento de fornecedores via banco"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de evento</Label>
              <Select
                value={form.tipo_evento}
                onValueChange={(v) =>
                  setForm({ ...form, tipo_evento: v as TipoEvento })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENTOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria (Filtro)</Label>
              <Select
                value={form.categoria_id || 'all'}
                onValueChange={(v) =>
                  setForm({ ...form, categoria_id: v === 'all' ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer uma</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Conta de débito</Label>
              <Select
                value={form.conta_debito_id}
                onValueChange={(v) => setForm({ ...form, conta_debito_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome ?? c.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta de crédito</Label>
              <Select
                value={form.conta_credito_id}
                onValueChange={(v) => setForm({ ...form, conta_credito_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nome ?? c.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Histórico (template)</Label>
            <Input
              value={form.historico_template}
              onChange={(e) =>
                setForm({ ...form, historico_template: e.target.value })
              }
              placeholder="Use {descricao}, {valor}, {data}"
            />
          </div>
          <div>
            <Label>Prioridade (menor = mais alta)</Label>
            <Input
              type="number"
              value={form.prioridade}
              onChange={(e) =>
                setForm({ ...form, prioridade: Number(e.target.value) || 100 })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={isSubmitting}>
            Criar regra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
