import { useState } from 'react';
import { AlertTriangle, Shield, Gavel, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNegativacoes, useCreateNegativacao, useUpdateNegativacao } from '@/hooks/useNegativacoes';
import { useProtestos, useCreateProtesto, useUpdateProtesto } from '@/hooks/useProtestos';
import { formatCurrency, formatDate } from '@/lib/formatters';

const statusColorNeg: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning',
  incluido: 'bg-destructive/10 text-destructive',
  excluido: 'bg-success/10 text-success',
  erro: 'bg-destructive/10 text-destructive',
  cancelado: 'bg-muted text-muted-foreground',
};

const statusColorProt: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning',
  protocolado: 'bg-primary/10 text-primary',
  protestado: 'bg-destructive/10 text-destructive',
  pago: 'bg-success/10 text-success',
  cancelado: 'bg-muted text-muted-foreground',
  sustado: 'bg-secondary/10 text-secondary',
  erro: 'bg-destructive/10 text-destructive',
};

export function NegativacoesProtestosPanel() {
  const { data: negativacoes, isLoading: loadingNeg } = useNegativacoes();
  const { data: protestos, isLoading: loadingProt } = useProtestos();
  const createNeg = useCreateNegativacao();
  const createProt = useCreateProtesto();
  const updateNeg = useUpdateNegativacao();
  const updateProt = useUpdateProtesto();

  const [negOpen, setNegOpen] = useState(false);
  const [protOpen, setProtOpen] = useState(false);
  const [negForm, setNegForm] = useState({ bureau: 'serasa', valor: '', motivo: '', observacoes: '' });
  const [protForm, setProtForm] = useState({ valor: '', cartorio: '', cidade_cartorio: '', estado_cartorio: '', observacoes: '' });

  const handleCreateNeg = () => {
    createNeg.mutate({ bureau: negForm.bureau, valor: Number(negForm.valor), motivo: negForm.motivo, observacoes: negForm.observacoes }, {
      onSuccess: () => { setNegOpen(false); setNegForm({ bureau: 'serasa', valor: '', motivo: '', observacoes: '' }); },
    });
  };

  const handleCreateProt = () => {
    createProt.mutate({ valor: Number(protForm.valor), cartorio: protForm.cartorio, cidade_cartorio: protForm.cidade_cartorio, estado_cartorio: protForm.estado_cartorio, observacoes: protForm.observacoes }, {
      onSuccess: () => { setProtOpen(false); setProtForm({ valor: '', cartorio: '', cidade_cartorio: '', estado_cartorio: '', observacoes: '' }); },
    });
  };

  return (
    <Tabs defaultValue="negativacoes">
      <TabsList className="mb-4">
        <TabsTrigger value="negativacoes" className="gap-2"><Shield className="h-4 w-4" />Negativações</TabsTrigger>
        <TabsTrigger value="protestos" className="gap-2"><Gavel className="h-4 w-4" />Protestos</TabsTrigger>
      </TabsList>

      <TabsContent value="negativacoes" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Inclusões em Serasa/SPC/Boa Vista</p>
          <Dialog open={negOpen} onOpenChange={setNegOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nova Negativação</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Negativação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Bureau</Label>
                  <Select value={negForm.bureau} onValueChange={(v) => setNegForm(f => ({ ...f, bureau: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serasa">Serasa</SelectItem>
                      <SelectItem value="spc">SPC</SelectItem>
                      <SelectItem value="boa_vista">Boa Vista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Valor</Label><Input type="number" value={negForm.valor} onChange={(e) => setNegForm(f => ({ ...f, valor: e.target.value }))} /></div>
                <div><Label>Motivo</Label><Input value={negForm.motivo} onChange={(e) => setNegForm(f => ({ ...f, motivo: e.target.value }))} /></div>
                <div><Label>Observações</Label><Textarea value={negForm.observacoes} onChange={(e) => setNegForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
                <Button onClick={handleCreateNeg} disabled={createNeg.isPending || !negForm.valor} className="w-full">
                  {createNeg.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadingNeg ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />) : negativacoes && negativacoes.length > 0 ? (
          <div className="space-y-2">
            {negativacoes.map((neg) => (
              <div key={neg.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-sm">{formatCurrency(neg.valor)}</p>
                    <p className="text-xs text-muted-foreground">{neg.bureau.toUpperCase()} • {neg.motivo || 'Sem motivo'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColorNeg[neg.status] || ''} variant="outline">{neg.status}</Badge>
                  {neg.protocolo && <Badge variant="outline" className="text-xs">{neg.protocolo}</Badge>}
                  <span className="text-xs text-muted-foreground">{formatDate(neg.created_at)}</span>
                  {neg.status === 'pendente' && (
                    <Button size="sm" variant="outline" onClick={() => updateNeg.mutate({ id: neg.id, status: 'incluido', data_inclusao: new Date().toISOString().split('T')[0] })}>
                      Confirmar Inclusão
                    </Button>
                  )}
                  {neg.status === 'incluido' && (
                    <Button size="sm" variant="outline" onClick={() => updateNeg.mutate({ id: neg.id, status: 'excluido', data_exclusao: new Date().toISOString().split('T')[0] })}>
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>Nenhuma negativação registrada</p></div>
        )}
      </TabsContent>

      <TabsContent value="protestos" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Protestos em cartório</p>
          <Dialog open={protOpen} onOpenChange={setProtOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Novo Protesto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Protesto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Valor</Label><Input type="number" value={protForm.valor} onChange={(e) => setProtForm(f => ({ ...f, valor: e.target.value }))} /></div>
                <div><Label>Cartório</Label><Input value={protForm.cartorio} onChange={(e) => setProtForm(f => ({ ...f, cartorio: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Cidade</Label><Input value={protForm.cidade_cartorio} onChange={(e) => setProtForm(f => ({ ...f, cidade_cartorio: e.target.value }))} /></div>
                  <div><Label>Estado</Label><Input value={protForm.estado_cartorio} onChange={(e) => setProtForm(f => ({ ...f, estado_cartorio: e.target.value }))} maxLength={2} /></div>
                </div>
                <div><Label>Observações</Label><Textarea value={protForm.observacoes} onChange={(e) => setProtForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
                <Button onClick={handleCreateProt} disabled={createProt.isPending || !protForm.valor} className="w-full">
                  {createProt.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadingProt ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />) : protestos && protestos.length > 0 ? (
          <div className="space-y-2">
            {protestos.map((prot) => (
              <div key={prot.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-sm">{formatCurrency(prot.valor)}</p>
                    <p className="text-xs text-muted-foreground">{prot.cartorio || 'Cartório não informado'} • {prot.cidade_cartorio}/{prot.estado_cartorio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColorProt[prot.status] || ''} variant="outline">{prot.status}</Badge>
                  {prot.custas != null && prot.custas > 0 && <Badge variant="outline" className="text-xs">Custas: {formatCurrency(prot.custas)}</Badge>}
                  <span className="text-xs text-muted-foreground">{formatDate(prot.created_at)}</span>
                  {prot.status === 'pendente' && (
                    <Button size="sm" variant="outline" onClick={() => updateProt.mutate({ id: prot.id, status: 'protocolado', data_protocolo: new Date().toISOString().split('T')[0] })}>
                      Protocolar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground"><Gavel className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>Nenhum protesto registrado</p></div>
        )}
      </TabsContent>
    </Tabs>
  );
}
