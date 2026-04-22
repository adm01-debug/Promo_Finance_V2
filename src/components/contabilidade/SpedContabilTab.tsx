import { useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, AlertTriangle, CheckCircle2, ShieldAlert, FileArchive, Wand2, Send, FileSearch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSpedContabilHistorico, useRegistrarTransmissaoSped } from '@/hooks/useSpedContabil';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SpedEcdWizard } from './SpedEcdWizard';
import { SpedEcfWizard } from './SpedEcfWizard';
import { SpedEcdPreviewDialog } from './SpedEcdPreviewDialog';
import { baixarSpedZip } from '@/lib/sped-zip';

interface Props {
  tipo: 'ECD' | 'ECF';
  empresaId?: string;
}

interface HistoricoRow {
  id: string;
  ano_calendario: number;
  created_at: string;
  total_lancamentos: number;
  total_linhas: number;
  status: string;
  hash_sha256: string | null;
  storage_path: string;
  recibo_transmissao: string | null;
  validacoes: { erros: string[]; avisos: string[] };
  tipo: string;
}

export function SpedContabilTab({ tipo, empresaId }: Props) {
  const [ano, setAno] = useState(new Date().getFullYear() - 1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [transmissaoArquivo, setTransmissaoArquivo] = useState<HistoricoRow | null>(null);
  const [reciboInput, setReciboInput] = useState('');
  const transmitir = useRegistrarTransmissaoSped();
  const { data: historico = [], isLoading } = useSpedContabilHistorico(empresaId);
  const historicoTipo = (historico as unknown as HistoricoRow[]).filter((h) => h.tipo === tipo);

  const handleDownload = async (storage_path: string) => {
    const { data, error } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleDownloadZip = async (h: HistoricoRow) => {
    const { data, error } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    const fileName = h.storage_path.split('/').pop() || `${tipo}-${h.ano_calendario}.txt`;
    try {
      await baixarSpedZip({
        txtUrl: data.signedUrl, fileName, hash: h.hash_sha256 || 'N/A',
        empresa: { razao_social: '—', cnpj: '—' },
        periodo: { inicio: `${h.ano_calendario}-01-01`, fim: `${h.ano_calendario}-12-31` },
        totalLinhas: h.total_linhas, totalLancamentos: h.total_lancamentos,
        tipo,
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  const handleConfirmarTransmissao = async () => {
    if (!transmissaoArquivo || !reciboInput.trim()) return;
    await transmitir.mutateAsync({ arquivoId: transmissaoArquivo.id, recibo: reciboInput.trim() });
    setTransmissaoArquivo(null);
    setReciboInput('');
  };

  return (
    <div className="space-y-6">
      {tipo === 'ECD' && empresaId && (
        <>
          <SpedEcdWizard open={wizardOpen} onOpenChange={setWizardOpen} empresaId={empresaId} anoCalendario={ano} />
          <SpedEcdPreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            empresaId={empresaId}
            anoCalendario={ano}
            onAbrirWizard={() => setWizardOpen(true)}
          />
        </>
      )}
      {tipo === 'ECF' && empresaId && (
        <SpedEcfWizard open={wizardOpen} onOpenChange={setWizardOpen} empresaId={empresaId} anoCalendario={ano} />
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
            <div className="md:col-span-2 flex items-end gap-2">
              {tipo === 'ECD' && (
                <Button
                  disabled={!empresaId}
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  className="flex-1"
                >
                  <FileSearch className="mr-2 h-4 w-4" />
                  Pré-visualizar
                </Button>
              )}
              <Button disabled={!empresaId} onClick={() => setWizardOpen(true)} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Abrir wizard · {ano}
              </Button>
            </div>
          </div>

          <Alert variant="warning" title="Arquivo preliminar">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Sempre valide no PVA-{tipo} da Receita Federal antes da transmissão oficial.
                {tipo === 'ECF' && ' A ECF requer ECD do mesmo período já gerada.'}
              </span>
            </div>
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
                  <TableHead>Recibo</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoTipo.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.ano_calendario}</TableCell>
                    <TableCell>{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{h.total_lancamentos}</TableCell>
                    <TableCell>{h.total_linhas}</TableCell>
                    <TableCell>
                      {h.status === 'rejeitado' ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{h.validacoes?.erros?.length ?? 0} erros</Badge>
                      ) : h.status === 'transmitido' ? (
                        <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3" />Transmitido</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Gerado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {h.recibo_transmissao ? (
                        <span className="font-mono text-xs">{h.recibo_transmissao.substring(0, 12)}…</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{h.hash_sha256?.substring(0, 12)}…</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(h.storage_path)} title="Baixar .txt">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadZip(h)} title="Baixar .zip">
                          <FileArchive className="h-4 w-4" />
                        </Button>
                        {h.status !== 'transmitido' && h.status !== 'rejeitado' && (
                          <Button size="sm" variant="outline" onClick={() => { setTransmissaoArquivo(h); setReciboInput(''); }} title="Registrar transmissão">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!transmissaoArquivo} onOpenChange={(v) => !v && setTransmissaoArquivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar transmissão SPED {tipo}</DialogTitle>
            <DialogDescription>
              Cole o nº do recibo gerado pelo PVA-{tipo} após a transmissão oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recibo-historico">Nº do recibo</Label>
            <Input
              id="recibo-historico"
              value={reciboInput}
              onChange={e => setReciboInput(e.target.value)}
              placeholder="Ex.: 12345678901234567890"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransmissaoArquivo(null)}>Cancelar</Button>
            <Button onClick={handleConfirmarTransmissao} disabled={!reciboInput.trim() || transmitir.isPending}>
              Marcar como transmitido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
