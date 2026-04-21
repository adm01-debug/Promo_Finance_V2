import { useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, FileArchive, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGerarSpedContabil, useSpedContabilHistorico } from '@/hooks/useSpedContabil';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SpedEcdWizard } from './SpedEcdWizard';
import { baixarSpedZip } from '@/lib/sped-zip';

interface Props {
  tipo: 'ECD' | 'ECF';
  empresaId?: string;
}

export function SpedContabilTab({ tipo, empresaId }: Props) {
  const [ano, setAno] = useState(new Date().getFullYear() - 1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const gerar = useGerarSpedContabil();
  const { data: historico = [], isLoading } = useSpedContabilHistorico(empresaId);
  const historicoTipo = historico.filter((h: { tipo: string }) => h.tipo === tipo);

  const handleDownload = async (storage_path: string) => {
    const { data, error } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleDownloadZip = async (h: { storage_path: string; hash_sha256: string | null; ano_calendario: number; total_linhas: number; total_lancamentos: number }) => {
    const { data, error } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    const fileName = h.storage_path.split('/').pop() || `ECD-${h.ano_calendario}.txt`;
    try {
      await baixarSpedZip({
        txtUrl: data.signedUrl, fileName, hash: h.hash_sha256 || 'N/A',
        empresa: { razao_social: '—', cnpj: '—' },
        periodo: { inicio: `${h.ano_calendario}-01-01`, fim: `${h.ano_calendario}-12-31` },
        totalLinhas: h.total_linhas, totalLancamentos: h.total_lancamentos,
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  return (
    <div className="space-y-6">
      {tipo === 'ECD' && empresaId && (
        <SpedEcdWizard open={wizardOpen} onOpenChange={setWizardOpen} empresaId={empresaId} anoCalendario={ano} />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar SPED {tipo}
          </CardTitle>
          <CardDescription>
            {tipo === 'ECD'
              ? 'Escrituração Contábil Digital — Layout 9 (livro Diário)'
              : 'Escrituração Contábil Fiscal — Layout 10 (LALUR/LACS, IRPJ/CSLL)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Ano-calendário</Label>
              <Input type="number" min={2010} max={new Date().getFullYear()} value={ano}
                onChange={e => setAno(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2 flex items-end">
              {tipo === 'ECD' ? (
                <Button disabled={!empresaId} onClick={() => setWizardOpen(true)} className="w-full">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Abrir wizard de geração SPED ECD · {ano}
                </Button>
              ) : (
                <Button
                  disabled={!empresaId || gerar.isPending}
                  onClick={() => empresaId && gerar.mutate({ empresaId, anoCalendario: ano, tipo })}
                  className="w-full"
                >
                  {gerar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Gerar e baixar SPED {tipo} de {ano}
                </Button>
              )}
            </div>
          </div>

          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Arquivo preliminar</AlertTitle>
            <AlertDescription>
              Sempre valide no PVA-{tipo} da Receita Federal antes da transmissão oficial.
              {tipo === 'ECF' && ' A ECF requer ECD do mesmo período já transmitida.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de gerações</CardTitle>
          <CardDescription>Arquivos {tipo} gerados anteriormente</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : historicoTipo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo gerado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead>Lançamentos</TableHead>
                  <TableHead>Linhas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hash SHA-256</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoTipo.map((row) => {
                  const h = row as unknown as {
                    id: string; ano_calendario: number; created_at: string; total_lancamentos: number; total_linhas: number;
                    status: string; hash_sha256: string | null; storage_path: string;
                    validacoes: { erros: string[]; avisos: string[] };
                  };
                  return (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.ano_calendario}</TableCell>
                    <TableCell>{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{h.total_lancamentos}</TableCell>
                    <TableCell>{h.total_linhas}</TableCell>
                    <TableCell>
                      {h.status === 'rejeitado' ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{h.validacoes.erros.length} erros</Badge>
                      ) : h.status === 'transmitido' ? (
                        <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" />Transmitido</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Gerado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{h.hash_sha256?.substring(0, 16)}…</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(h.storage_path)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
