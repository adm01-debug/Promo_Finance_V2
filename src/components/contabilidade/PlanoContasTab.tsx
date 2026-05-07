import { useState } from 'react';
import { Plus, Search, ShieldCheck, History, Wand2, Filter, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanoContas, useUpsertPlanoConta } from '@/hooks/usePlanoContas';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { usePlanoContaHistory } from '@/hooks/usePlanoContaHistory';
import { useEmpresas } from '@/hooks/useFinancialData';
import { AuditoriaCFCPanel } from './AuditoriaCFCPanel';
import { PlanoContaHistoryPanel } from './PlanoContaHistoryPanel';

interface Props { empresaId?: string }

export function PlanoContasTab({ empresaId }: Props) {
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', descricao: '', natureza: 'ativo', tipo: 'analitica', codigo_referencial: '' });
  const { data: contas = [], isLoading } = usePlanoContas(empresaId);
  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === empresaId);
  const auditoria = useAuditoriaCFC(empresaId);
  const history = usePlanoContaHistory({ empresaId, limit: 200 });
  const upsert = useUpsertPlanoConta();

  const filtered = contas.filter(c =>
    c.codigo.includes(busca) || (c.descricao || '').toLowerCase().includes(busca.toLowerCase()),
  );

  const handleSalvar = async () => {
    await upsert.mutateAsync({ ...form, empresa_id: empresaId } as never);
    setOpen(false);
    setForm({ codigo: '', descricao: '', natureza: 'ativo', tipo: 'analitica', codigo_referencial: '' });
  };

  return (
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <CardHeader className="p-8 pb-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tighter">Plano de Contas</CardTitle>
              <CardDescription className="text-sm font-medium opacity-60">Governança & Estrutura contábil para ECD/ECF</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setHistoryOpen(true)} 
              disabled={!empresaId}
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold px-5 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
            >
              <History className="h-4 w-4 mr-2 text-primary" />
              Histórico
              {!history.isLoading && (history.data?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-black bg-primary/20 text-primary border-none">
                  {history.data!.length}
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAuditOpen(true)} 
              disabled={!empresaId}
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold px-5 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
            >
              <ShieldCheck className="h-4 w-4 mr-2 text-success" />
              Auditar CFC
              {!auditoria.isLoading && auditoria.totalProblemas > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px] font-black border-none">
                  {auditoria.totalProblemas}
                </Badge>
              )}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-12 rounded-2xl font-black px-6 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]">
                  <Plus className="h-5 w-5 mr-2" />
                  Nova Conta
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova conta contábil</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Código</Label><Input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="1.1.01.001" /></div>
                  <div><Label>Cód. referencial CFC</Label><Input value={form.codigo_referencial} onChange={e => setForm({ ...form, codigo_referencial: e.target.value })} placeholder="1.01.01.01.01" /></div>
                </div>
                <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Natureza</Label>
                    <Select value={form.natureza} onValueChange={v => setForm({ ...form, natureza: v })}>
                      <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="passivo">Passivo</SelectItem>
                        <SelectItem value="patrimonio">Patrimônio Líquido</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="resultado">Resultado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                      <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                        <SelectItem value="sintetica">Sintética</SelectItem>
                        <SelectItem value="analitica">Analítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSalvar} disabled={!form.codigo || !form.descricao || upsert.isPending} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2 relative z-10 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[320px] group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
            <Input 
              placeholder="Buscar por código, descrição ou referencial..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl font-bold text-lg transition-all focus:ring-primary/20 placeholder:text-muted-foreground/40" 
            />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 bg-white/5 px-5 py-4 rounded-2xl border border-white/5">
            {filtered.length} / {contas.length} registros
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
            <Wand2 className="h-8 w-8 animate-spin mr-3 opacity-20" /> 
            <span className="font-black uppercase tracking-widest text-xs">Mapeando estrutura...</span>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-white/[0.01] shadow-inner">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-40 text-[10px] font-black uppercase tracking-widest p-6">Código</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Descrição</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Natureza</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Tipo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Cód. Referencial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.slice(0, 200).map((c, idx) => (
                    <motion.tr 
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.005 }}
                      className="border-white/5 hover:bg-white/5 transition-colors group/row"
                    >
                      <TableCell className="p-6">
                        <Badge variant="outline" className="font-mono font-black text-xs border-none bg-primary/10 text-primary px-3 py-1 rounded-lg">
                          {c.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-foreground/80">{c.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "uppercase text-[10px] font-black tracking-widest border-none px-3 rounded-full",
                          c.natureza === 'ativo' ? "bg-success/20 text-success" : 
                          c.natureza === 'passivo' ? "bg-destructive/20 text-destructive" :
                          "bg-primary/20 text-primary"
                        )}>
                          {c.natureza}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          c.tipo === 'analitica' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {c.tipo}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs opacity-60 font-black tracking-tighter">
                        {c.codigo_referencial || <span className="opacity-20">—</span>}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
        {filtered.length > 200 && <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center mt-4">Exibindo 200 de {filtered.length} contas. Refine a busca para ver mais.</p>}
      </CardContent>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auditoria de códigos referenciais CFC</DialogTitle>
          </DialogHeader>
          <AuditoriaCFCPanel resultado={auditoria} empresa={empresa} />
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Histórico do Plano de Contas</DialogTitle>
          </DialogHeader>
          <PlanoContaHistoryPanel entries={history.data ?? []} isLoading={history.isLoading} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
