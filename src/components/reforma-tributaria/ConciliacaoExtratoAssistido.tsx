/**
 * ConciliacaoExtratoAssistido — Etapa 89
 *
 * Compara os creditos IBS/CBS calculados pelo sistema contra um extrato
 * de "apuracao assistida" (DeRE / SEFAZ) colado em CSV.
 *
 * Formato CSV esperado (1a linha = cabecalho, separador virgula ou ponto-e-virgula):
 *   chave_acesso,cbs_credito,ibs_credito
 *   431240000000...44 digitos...,150.00,120.00
 */

import { useState, useCallback } from 'react';
import { FileText, Upload, CheckCircle2, AlertTriangle, XCircle, Clipboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { useCreditosPorChaves } from '@/hooks/useCreditosTributarios';

import { parseCsv, buildDiff, type LinhaExtrato } from '@/lib/tributario/conciliacao-extrato';

const BADGE = {
  ok: { label: 'OK', Icon: CheckCircle2, cls: 'text-green-700 bg-green-100' },
  divergencia: { label: 'Divergencia', Icon: AlertTriangle, cls: 'text-yellow-700 bg-yellow-100' },
  nao_encontrada: { label: 'Nao encontrada', Icon: XCircle, cls: 'text-gray-700 bg-gray-100' },
};

export function ConciliacaoExtratoAssistido({ empresaId }: { empresaId?: string }) {
  const [rawCsv, setRawCsv] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [extrato, setExtrato] = useState<LinhaExtrato[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText().catch(() => '');
    if (text) setRawCsv(text);
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawCsv((ev.target?.result as string) ?? '');
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleAnalisar = useCallback(() => {
    const linhas = parseCsv(rawCsv);
    if (linhas.length === 0) {
      setParseError(
        'CSV invalido ou sem linhas. Cabecalho esperado: chave_acesso,cbs_credito,ibs_credito'
      );
      setExtrato([]);
      return;
    }
    setParseError(null);
    setExtrato(linhas);
    setSubmitted(true);
  }, [rawCsv]);

  const chaves = extrato.map((e) => e.chave_acesso);
  const { data: creditosSistema, isLoading, error: erroConsulta } = useCreditosPorChaves(
    submitted ? chaves : [],
    empresaId
  );

  const diff = submitted && creditosSistema ? buildDiff(extrato, creditosSistema) : [];
  const totalOk = diff.filter((d) => d.status === 'ok').length;
  const totalDiv = diff.filter((d) => d.status === 'divergencia').length;
  const totalNE = diff.filter((d) => d.status === 'nao_encontrada').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Conciliacao — Apuracao Assistida</CardTitle>
            <CardDescription>
              Cole ou importe o extrato CSV da apuracao assistida (DeRE/SEFAZ) para conferir contra
              os creditos IBS/CBS calculados pelo sistema.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handlePaste}>
              <Clipboard className="h-4 w-4 mr-1" /> Colar da area de transferencia
            </Button>
            <label>
              <Button size="sm" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" /> Importar CSV
                </span>
              </Button>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <Textarea
            placeholder={
              'chave_acesso,cbs_credito,ibs_credito\n4312400000000000000000000000000000000000000000,150.00,120.00'
            }
            className="font-mono text-xs h-32"
            value={rawCsv}
            onChange={(e) => setRawCsv(e.target.value)}
          />
          {parseError && <p className="text-xs text-destructive">{parseError}</p>}
          <Button onClick={handleAnalisar} disabled={!rawCsv.trim()}>
            Analisar
          </Button>
        </div>

        {submitted && !isLoading && diff.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {totalOk} OK
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalDiv} divergencia{totalDiv !== 1 ? 's' : ''}
            </Badge>
            <Badge className="bg-gray-100 text-gray-700">
              <XCircle className="h-3 w-3 mr-1" />
              {totalNE} nao encontrada{totalNE !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {submitted && !isLoading && diff.length > 0 && (
          <div className="overflow-auto max-h-[480px] rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave de Acesso</TableHead>
                  <TableHead className="text-right">CBS Sistema</TableHead>
                  <TableHead className="text-right">CBS Extrato</TableHead>
                  <TableHead className="text-right">IBS Sistema</TableHead>
                  <TableHead className="text-right">IBS Extrato</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diff.map((linha) => {
                  const { label, Icon, cls } = BADGE[linha.status];
                  return (
                    <TableRow
                      key={linha.chave_acesso}
                      className={
                        linha.status === 'divergencia'
                          ? 'bg-yellow-50/50'
                          : linha.status === 'nao_encontrada'
                            ? 'bg-gray-50/50'
                            : ''
                      }
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                        {linha.chave_acesso.slice(0, 9)}&hellip;{linha.chave_acesso.slice(-6)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {linha.cbs_sistema !== null ? formatCurrency(linha.cbs_sistema) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(linha.cbs_extrato)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {linha.ibs_sistema !== null ? formatCurrency(linha.ibs_sistema) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(linha.ibs_extrato)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Consultando creditos do sistema...
          </p>
        )}
        {submitted && erroConsulta && (
          <p className="text-sm text-destructive">
            Falha ao consultar os créditos do sistema ({erroConsulta.message}). O CSV pode estar
            correto; tente novamente ou verifique a empresa selecionada.
          </p>
        )}
        {submitted && !isLoading && !erroConsulta && diff.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma linha do extrato casou com crédito do sistema. Verifique se o CSV pertence a
            esta empresa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
