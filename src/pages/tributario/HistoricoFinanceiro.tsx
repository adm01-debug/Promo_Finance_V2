// ============================================
// PÁGINA: Histórico Financeiro (Faturamento + Folha)
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Database, Upload, Download } from 'lucide-react';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useHistoricoFinanceiro } from '@/hooks/useHistoricoFinanceiro';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { CsvImportDialog } from '@/components/tributario/CsvImportDialog';
import { downloadCsvTemplate, type FaturamentoRow, type FolhaRow } from '@/lib/csv-importer';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function HistoricoFinanceiro() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          Histórico Financeiro Tributário
        </h1>
        <p className="text-muted-foreground mt-1">
          Cadastre faturamento e folha mensal — base para RBT12, Fator R e simulações de regime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Selecionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {empresaId && (
        <Tabs defaultValue="faturamento">
          <TabsList>
            <TabsTrigger value="faturamento">Faturamento Mensal</TabsTrigger>
            <TabsTrigger value="folha">Folha de Pagamento</TabsTrigger>
          </TabsList>
          <TabsContent value="faturamento">
            <FaturamentoTab empresaId={empresaId} />
          </TabsContent>
          <TabsContent value="folha">
            <FolhaTab empresaId={empresaId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function FaturamentoTab({ empresaId }: { empresaId: string }) {
  const { faturamento, upsertFaturamento, deleteFaturamento } = useHistoricoFinanceiro(empresaId);
  const [importOpen, setImportOpen] = useState(false);
  const [novo, setNovo] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    receita_bruta: 0,
    receita_servicos: 0,
    receita_revenda: 0,
    receita_industria: 0,
    receita_exportacao: 0,
  });

  const adicionar = () => {
    if (novo.receita_bruta <= 0) {
      toast.error('Informe a receita bruta');
      return;
    }
    upsertFaturamento.mutate({ empresa_id: empresaId, ...novo });
  };

  const handleImport = async (rows: (FaturamentoRow | FolhaRow)[]) => {
    for (const r of rows as FaturamentoRow[]) {
      await upsertFaturamento.mutateAsync({ empresa_id: empresaId, ...r });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">Faturamento Mensal</CardTitle>
            <CardDescription>{faturamento.length} meses cadastrados (mínimo 12 para precisão)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate('faturamento')} aria-label="Baixar template CSV de faturamento">
              <Download className="h-4 w-4 mr-1" /> Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} aria-label="Importar CSV de faturamento">
              <Upload className="h-4 w-4 mr-1" /> Importar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label className="text-xs">Ano</Label>
            <Input
              type="number"
              value={novo.ano}
              onChange={(e) => setNovo({ ...novo, ano: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Mês</Label>
            <Select value={String(novo.mes)} onValueChange={(v) => setNovo({ ...novo, mes: Number(v) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Receita Bruta</Label>
            <Input
              type="number"
              value={novo.receita_bruta}
              onChange={(e) => setNovo({ ...novo, receita_bruta: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Serviços</Label>
            <Input
              type="number"
              value={novo.receita_servicos}
              onChange={(e) => setNovo({ ...novo, receita_servicos: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Revenda</Label>
            <Input
              type="number"
              value={novo.receita_revenda}
              onChange={(e) => setNovo({ ...novo, receita_revenda: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Indústria</Label>
            <Input
              type="number"
              value={novo.receita_industria}
              onChange={(e) => setNovo({ ...novo, receita_industria: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={adicionar} className="w-full" disabled={upsertFaturamento.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Receita Bruta</TableHead>
                <TableHead className="text-right">Serviços</TableHead>
                <TableHead className="text-right">Revenda</TableHead>
                <TableHead className="text-right">Indústria</TableHead>
                <TableHead className="text-right">Exportação</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(faturamento || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum registro
                  </TableCell>
                </TableRow>
              ) : (
                faturamento.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      {MESES[f.mes - 1]}/{f.ano}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(f.receita_bruta)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.receita_servicos)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.receita_revenda)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.receita_industria)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.receita_exportacao)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteFaturamento.mutate(f.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        kind="faturamento"
        empresaId={empresaId}
        onImport={handleImport}
      />
    </Card>
  );
}

function FolhaTab({ empresaId }: { empresaId: string }) {
  const { folha, upsertFolha, deleteFolha } = useHistoricoFinanceiro(empresaId);
  const [importOpen, setImportOpen] = useState(false);
  const [novo, setNovo] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    salarios: 0,
    pro_labore: 0,
    encargos: 0,
    total_folha: 0,
    numero_funcionarios: 0,
  });

  const adicionar = () => {
    const total = novo.total_folha || (novo.salarios + novo.pro_labore + novo.encargos);
    if (total <= 0) {
      toast.error('Informe valores da folha');
      return;
    }
    upsertFolha.mutate({ empresa_id: empresaId, ...novo, total_folha: total });
  };

  const handleImport = async (rows: (FaturamentoRow | FolhaRow)[]) => {
    for (const r of rows as FolhaRow[]) {
      const total = r.total_folha || r.salarios + r.pro_labore + r.encargos;
      await upsertFolha.mutateAsync({ empresa_id: empresaId, ...r, total_folha: total });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">Folha de Pagamento Mensal</CardTitle>
            <CardDescription>{folha.length} meses cadastrados (necessário para Fator R)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate('folha')} aria-label="Baixar template CSV de folha">
              <Download className="h-4 w-4 mr-1" /> Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} aria-label="Importar CSV de folha">
              <Upload className="h-4 w-4 mr-1" /> Importar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label className="text-xs">Ano</Label>
            <Input type="number" value={novo.ano} onChange={(e) => setNovo({ ...novo, ano: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Mês</Label>
            <Select value={String(novo.mes)} onValueChange={(v) => setNovo({ ...novo, mes: Number(v) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Salários</Label>
            <Input
              type="number"
              value={novo.salarios}
              onChange={(e) => setNovo({ ...novo, salarios: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Pró-labore</Label>
            <Input
              type="number"
              value={novo.pro_labore}
              onChange={(e) => setNovo({ ...novo, pro_labore: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Encargos</Label>
            <Input
              type="number"
              value={novo.encargos}
              onChange={(e) => setNovo({ ...novo, encargos: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Funcionários</Label>
            <Input
              type="number"
              value={novo.numero_funcionarios}
              onChange={(e) => setNovo({ ...novo, numero_funcionarios: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={adicionar} className="w-full" disabled={upsertFolha.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Salários</TableHead>
                <TableHead className="text-right">Pró-labore</TableHead>
                <TableHead className="text-right">Encargos</TableHead>
                <TableHead className="text-right">Total Folha</TableHead>
                <TableHead className="text-right">Funcionários</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(folha || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum registro
                  </TableCell>
                </TableRow>
              ) : (
                folha.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      {MESES[f.mes - 1]}/{f.ano}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(f.salarios)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.pro_labore)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(f.encargos)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(f.total_folha)}</TableCell>
                    <TableCell className="text-right">{f.numero_funcionarios ?? 0}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteFolha.mutate(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
