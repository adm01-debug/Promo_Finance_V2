// ============================================
// TAB: Folha de Pagamento — Histórico Tributário
// Extraído de HistoricoFinanceiro.tsx (modularização)
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, Download } from 'lucide-react';
import { useHistoricoFinanceiro } from '@/hooks/useHistoricoFinanceiro';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { CsvImportDialog } from '@/components/tributario/CsvImportDialog';
import { downloadCsvTemplate, type FaturamentoRow, type FolhaRow } from '@/lib/csv-importer';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function FolhaTab({ empresaId }: { empresaId: string }) {
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsvTemplate('folha')}
              aria-label="Baixar template CSV de folha"
            >
              <Download className="h-4 w-4 mr-1" /> Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              aria-label="Importar CSV de folha"
            >
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

        <div className="border rounded-lg overflow-hidden overflow-x-auto">
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
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteFolha.mutate(f.id)}
                        aria-label={`Remover folha ${MESES[f.mes - 1]}/${f.ano}`}
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
        kind="folha"
        empresaId={empresaId}
        onImport={handleImport}
      />
    </Card>
  );
}
