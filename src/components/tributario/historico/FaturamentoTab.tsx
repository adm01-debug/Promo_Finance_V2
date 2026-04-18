// ============================================
// TAB: Faturamento Mensal — Histórico Tributário
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
import { EvolucaoChart } from '@/components/tributario/historico/EvolucaoChart';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function FaturamentoTab({ empresaId }: { empresaId: string }) {
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsvTemplate('faturamento')}
              aria-label="Baixar template CSV de faturamento"
            >
              <Download className="h-4 w-4 mr-1" /> Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              aria-label="Importar CSV de faturamento"
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

        <div className="border rounded-lg overflow-hidden overflow-x-auto">
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
                        aria-label={`Remover faturamento ${MESES[f.mes - 1]}/${f.ano}`}
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
      {faturamento.length > 0 && (
        <CardContent className="pt-0">
          <EvolucaoChart
            titulo="Evolução da Receita Bruta"
            descricao="Últimos 24 meses (cronológico)"
            pontos={faturamento.map((f) => ({ ano: f.ano, mes: f.mes, valor: f.receita_bruta }))}
            corHsl="var(--primary)"
          />
        </CardContent>
      )}
    </Card>
  );
}
