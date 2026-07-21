import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Layers,
  Play,
  X,
  Zap,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { todayISOLocal } from '@/lib/formatters';
import type {
  Categoria,
  DryRunEntry,
  DryRunOutcome,
  PlanoConta,
  SimFormState,
  TipoEvento,
} from './types';
import { EVENTOS } from './types';
import type { ContabilizacaoMutations } from './useContabilizacaoMutations';

const INITIAL_SIM: SimFormState = {
  tipo_evento: 'conta_pagar',
  valor: 100,
  data: todayISOLocal(),
  descricao: 'Simulação de teste',
  categoria_id: '',
  lote_quantidade: 1,
};

export interface SimulacaoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contas: PlanoConta[];
  categorias: Categoria[];
  mutation: ContabilizacaoMutations['dryRunSimulation'];
}

export function SimulacaoDialog({
  open,
  onOpenChange,
  contas,
  categorias,
  mutation,
}: SimulacaoDialogProps) {
  const [simForm, setSimForm] = useState<SimFormState>(INITIAL_SIM);
  const [isLote, setIsLote] = useState(false);
  const [simResult, setSimResult] = useState<DryRunOutcome | null>(null);
  const [dryRunBefore, setDryRunBefore] = useState<DryRunEntry | null>(null);

  useEffect(() => {
    if (!open) {
      setSimResult(null);
      setDryRunBefore(null);
    }
  }, [open]);

  const handleRun = () => {
    setSimResult(null);
    setDryRunBefore(null);
    mutation.mutate(
      { simForm, isLote, onBefore: setDryRunBefore },
      { onSuccess: (data) => setSimResult(data) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Simulação de Contabilização (Dry-run)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 bg-muted/30 p-1 rounded-md">
            <Button
              variant={!isLote ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setIsLote(false)}
            >
              Evento Único
            </Button>
            <Button
              variant={isLote ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setIsLote(true)}
            >
              Lote (Stress Test)
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Select
                value={simForm.tipo_evento}
                onValueChange={(v) =>
                  setSimForm({ ...simForm, tipo_evento: v as TipoEvento })
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
            <div className="space-y-2">
              <Label>{isLote ? 'Valor base' : 'Valor'}</Label>
              <Input
                type="number"
                value={simForm.valor}
                onChange={(e) =>
                  setSimForm({ ...simForm, valor: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={simForm.descricao}
                onChange={(e) =>
                  setSimForm({ ...simForm, descricao: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria (Opcional)</Label>
              <Select
                value={simForm.categoria_id}
                onValueChange={(v) => setSimForm({ ...simForm, categoria_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer uma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLote && (
            <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Quantidade no lote
                </Label>
                <Badge variant="secondary">{simForm.lote_quantidade} eventos</Badge>
              </div>
              <Input
                type="range"
                min="1"
                max="20"
                value={simForm.lote_quantidade}
                onChange={(e) =>
                  setSimForm({
                    ...simForm,
                    lote_quantidade: parseInt(e.target.value, 10),
                  })
                }
                className="h-4"
              />
            </div>
          )}

          {simResult && simResult.type === 'single' && (
            <SingleResultView
              contas={contas}
              before={dryRunBefore}
              after={simResult.after}
            />
          )}

          {simResult && simResult.type === 'lote' && (
            <LoteResultView contas={contas} results={simResult.results} />
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              setSimResult(null);
            }}
          >
            Fechar
          </Button>
          <Button
            onClick={handleRun}
            disabled={mutation.isPending}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Executar teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SingleResultView({
  contas,
  before,
  after,
}: {
  contas: PlanoConta[];
  before: DryRunEntry | null;
  after: DryRunEntry;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium border-b pb-2">
        <ArrowRightLeft className="h-4 w-4 text-primary" />
        Visualização Comparativa "Antes e Depois"
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-muted-foreground font-bold">
            Estado Atual (Sem Regras)
          </Label>
          <div className="min-h-[120px] rounded-lg border border-dashed flex flex-col p-3 bg-muted/10">
            {before?.status === 'sem_regra' ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <X className="h-6 w-6 text-muted-foreground/30 mb-1" />
                <span className="text-[10px] text-muted-foreground">
                  Nenhum lançamento automático configurado para este evento.
                </span>
              </div>
            ) : (
              <div className="text-[10px] space-y-2">
                <div className="flex justify-between items-center border-b border-muted pb-1 mb-1">
                  <span className="font-bold text-muted-foreground">
                    Lançamento Padrão
                  </span>
                  <Badge variant="outline" className="text-[8px] h-3 px-1">
                    ATIVO
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-1 font-mono">
                  <span className="col-span-1 text-muted-foreground">D:</span>
                  <span className="col-span-4">
                    {contas.find((c) => c.id === before?.debito)?.codigo || '—'}
                  </span>
                  <span className="col-span-1 text-muted-foreground">C:</span>
                  <span className="col-span-4">
                    {contas.find((c) => c.id === before?.credito)?.codigo || '—'}
                  </span>
                  <span className="col-span-1 text-muted-foreground">V:</span>
                  <span className="col-span-4 text-emerald-600 font-bold">
                    R$ {before?.valor?.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-emerald-600 font-bold">
            Simulação (Com Regras)
          </Label>
          <div
            className={`min-h-[120px] rounded-lg border ${
              after.status === 'simulado'
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-amber-500/30 bg-amber-500/5'
            } p-3`}
          >
            {after.status === 'simulado' ? (
              <div className="text-[10px] space-y-2">
                <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1 mb-1">
                  <Badge
                    variant="outline"
                    className="text-[8px] h-3 px-1 border-emerald-500/50 text-emerald-700 bg-emerald-100/50"
                  >
                    NOVO FLUXO
                  </Badge>
                  <span className="font-bold text-emerald-700">
                    R$ {after.valor?.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 font-mono">
                  <span className="col-span-1 text-emerald-600/70">D:</span>
                  <span className="col-span-4 font-bold">
                    {contas.find((c) => c.id === after.debito)?.codigo || '?'}
                  </span>
                  <span className="col-span-1 text-emerald-600/70">C:</span>
                  <span className="col-span-4 font-bold">
                    {contas.find((c) => c.id === after.credito)?.codigo || '?'}
                  </span>
                </div>
                {after.regra?.nome && (
                  <div className="mt-2 pt-1 border-t border-emerald-500/10 text-[9px] text-emerald-800/70 flex items-center gap-1">
                    <Zap className="h-2 w-2" /> {after.regra.nome}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 mb-1" />
                <span className="text-[10px] text-amber-600 text-center font-medium">
                  Nenhuma regra compatível encontrada.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoteResultView({
  contas,
  results,
}: {
  contas: PlanoConta[];
  results: DryRunEntry[];
}) {
  const sucessos = results.filter((r) => r.status === 'simulado').length;
  const semRegra = results.filter((r) => r.status === 'sem_regra').length;
  const falhas = results.filter((r) => !!r.error).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-medium border-b pb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Resumo do Processamento em Lote
        </div>
        <Badge variant="outline">{results.length} Eventos</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-emerald-700">{sucessos}</div>
          <div className="text-[10px] uppercase text-emerald-600 font-bold">
            Sucesso
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-amber-700">{semRegra}</div>
          <div className="text-[10px] uppercase text-amber-600 font-bold">
            Sem Regra
          </div>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-destructive">{falhas}</div>
          <div className="text-[10px] uppercase text-destructive font-bold">
            Falhas
          </div>
        </div>
      </div>

      <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
        {results.map((r, idx) => (
          <div
            key={idx}
            className="text-[9px] flex items-center justify-between p-1 border-b last:border-0 hover:bg-muted/50"
          >
            <span className="text-muted-foreground">Evento #{idx + 1}</span>
            <div className="flex items-center gap-2">
              {r.status === 'simulado' ? (
                <>
                  <span className="font-mono">
                    {contas.find((c) => c.id === r.debito)?.codigo} /{' '}
                    {contas.find((c) => c.id === r.credito)?.codigo}
                  </span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </>
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
