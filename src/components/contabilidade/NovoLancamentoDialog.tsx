import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, CalendarIcon, Wand2, CheckCircle2, AlertTriangle, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCriarLancamento } from '@/hooks/useLancamentosContabeis';
import type { PlanoContaRow } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PartidaForm { conta_id: string; tipo: 'D' | 'C'; valor: number }

interface Props {
  empresaId?: string;
  planoContas: PlanoContaRow[];
}

export function NovoLancamentoDialog({ empresaId, planoContas }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState<PartidaForm[]>([
    { conta_id: '', tipo: 'D', valor: 0 },
    { conta_id: '', tipo: 'C', valor: 0 },
  ]);
  const criar = useCriarLancamento();

  const totalD = partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
  const totalC = partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
  const balanceado = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

  const handleSalvar = async () => {
    if (!empresaId || !balanceado) return;
    await criar.mutateAsync({
      empresa_id: empresaId, data_lancamento: data, historico,
      partidas: partidas.filter(p => p.conta_id && p.valor > 0),
    });
    setOpen(false); setHistorico(''); setPartidas([{ conta_id: '', tipo: 'D', valor: 0 }, { conta_id: '', tipo: 'C', valor: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!empresaId} className="h-12 rounded-2xl font-black px-6 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]">
          <Plus className="h-5 w-5 mr-2" />
          Novo Lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-none bg-background/95 backdrop-blur-2xl shadow-3xl rounded-[3rem] p-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <DialogHeader className="p-8 pb-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-2xl">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">Escrituração Contábil</DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Registro de Partida Dobrada (Débito/Crédito)</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Data do Fato Contábil</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40" />
                <Input type="date" value={data} onChange={e => setData(e.target.value)} className="h-14 pl-12 bg-card/5 border-white/5 rounded-2xl font-bold transition-all focus:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Histórico Narrativo</Label>
              <Input value={historico} onChange={e => setHistorico(e.target.value)} placeholder="Ex: Recebimento duplicata nº 552..." className="h-14 bg-card/5 border-white/5 rounded-2xl font-bold transition-all focus:ring-primary/20" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary opacity-40" />
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Itens do Lançamento</Label>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPartidas([...partidas, { conta_id: '', tipo: 'D', valor: 0 }])} className="rounded-xl hover:bg-primary/10 text-primary gap-2 font-black h-9 text-[10px] uppercase tracking-widest">
                <Plus className="h-4 w-4" />Adicionar Partida
              </Button>
            </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-4 custom-scrollbar">
            <AnimatePresence>
              {partidas.map((p, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-[1fr_140px_180px_50px] gap-4 items-center group/item p-2 rounded-2xl hover:bg-card/[0.02] transition-colors"
                >
                  <Select value={p.conta_id} onValueChange={v => setPartidas(partidas.map((x, j) => j === i ? { ...x, conta_id: v } : x))}>
                    <SelectTrigger className="h-14 rounded-2xl border-white/5 bg-card/5 font-bold transition-all focus:ring-primary/20">
                      <SelectValue placeholder="Conta Analítica" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                      {planoContas.map(c => (
                        <SelectItem key={c.id} value={c.id} className="font-mono text-[11px]">
                          <span className="text-primary font-black">{c.codigo}</span> — {c.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={p.tipo} onValueChange={v => setPartidas(partidas.map((x, j) => j === i ? { ...x, tipo: v as 'D' | 'C' } : x))}>
                    <SelectTrigger className="h-14 rounded-2xl border-white/5 bg-card/5 font-bold transition-all focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                      <SelectItem value="D" className="text-success font-black uppercase text-[10px] tracking-widest">Débito</SelectItem>
                      <SelectItem value="C" className="text-destructive font-black uppercase text-[10px] tracking-widest">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20">R$</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={p.valor} 
                      onChange={e => setPartidas(partidas.map((x, j) => j === i ? { ...x, valor: Number(e.target.value) } : x))} 
                      className="h-14 pl-10 bg-card/5 border-white/5 rounded-2xl font-mono text-right font-black transition-all focus:ring-primary/20" 
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setPartidas(partidas.filter((_, j) => j !== i))} className="h-12 w-12 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className={cn(
            "flex flex-wrap justify-between items-center gap-4 p-5 rounded-2xl border backdrop-blur-md transition-all shadow-lg",
            balanceado ? 'bg-success/5 border-success/20 text-success shadow-success/10' : 'bg-warning/5 border-warning/20 text-warning shadow-warning/10'
          )}>
            <div className="flex gap-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Débito</p>
                <p className="font-mono font-black text-xl">{formatCurrency(totalD)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Crédito</p>
                <p className="font-mono font-black text-xl">{formatCurrency(totalC)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {balanceado ? (
                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest bg-success/20 px-4 py-2 rounded-full">
                  <CheckCircle2 className="h-4 w-4" /> Consistente
                </div>
              ) : (
                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest bg-warning/20 px-4 py-2 rounded-full">
                  <AlertTriangle className="h-4 w-4" /> Dif: {formatCurrency(Math.abs(totalD - totalC))}
                </div>
              )}
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSalvar} 
          disabled={!balanceado || !historico || criar.isPending} 
          className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
        >
          {criar.isPending ? <Wand2 className="h-5 w-5 animate-spin mr-2" /> : "Registrar Lançamento"}
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
