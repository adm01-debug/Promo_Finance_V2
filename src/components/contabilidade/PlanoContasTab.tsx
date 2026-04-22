import { useState } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
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
import { useEmpresas } from '@/hooks/useFinancialData';
import { AuditoriaCFCPanel } from './AuditoriaCFCPanel';

interface Props { empresaId?: string }

export function PlanoContasTab({ empresaId }: Props) {
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', descricao: '', natureza: 'ativo', tipo: 'analitica', codigo_referencial: '' });
  const { data: contas = [], isLoading } = usePlanoContas(empresaId);
  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === empresaId);
  const auditoria = useAuditoriaCFC(empresaId);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plano de Contas</CardTitle>
            <CardDescription>Estrutura contábil para ECD/ECF</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAuditOpen(true)} disabled={!empresaId}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Auditar CFC
              {!auditoria.isLoading && auditoria.totalProblemas > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                  {auditoria.totalProblemas}
                </Badge>
              )}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nova conta</Button>
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
    </Card>
  );
}
