import { useState } from 'react';
import { Plus, Search, ShieldCheck, History, Wand2, Filter, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Natureza</Label>
                    <Select value={form.natureza} onValueChange={v => setForm({ ...form, natureza: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="passivo">Passivo</SelectItem>
                        <SelectItem value="patrimonio">Patrimônio Líquido</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="resultado">Resultado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
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
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código ou descrição..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Natureza</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cód. referencial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.codigo}</TableCell>
                  <TableCell>{c.descricao}</TableCell>
                  <TableCell><Badge variant="outline">{c.natureza}</Badge></TableCell>
                  <TableCell>{c.tipo}</TableCell>
                  <TableCell className="font-mono text-xs">{c.codigo_referencial || <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {filtered.length > 200 && <p className="text-xs text-muted-foreground">Exibindo 200 de {filtered.length} contas. Refine a busca.</p>}
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
