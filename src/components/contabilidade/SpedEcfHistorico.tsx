import { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Download, FileArchive, Lock, FileText, ScrollText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpedEcfHistorico, type SpedEcfHistoricoRow } from '@/hooks/useSpedEcfHistorico';
import { supabase } from '@/integrations/supabase/client';
import { baixarSpedZip } from '@/lib/sped-zip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  empresaId?: string;
}

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function SpedEcfHistorico({ empresaId }: Props) {
  const { data: historico = [], isLoading } = useSpedEcfHistorico(empresaId);
  const [errosAbertos, setErrosAbertos] = useState<SpedEcfHistoricoRow | null>(null);

  const handleDownloadTxt = async (h: SpedEcfHistoricoRow) => {
    const { data, error } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleDownloadZip = async (h: SpedEcfHistoricoRow) => {
    const { data, error } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    const fileName = h.storage_path.split('/').pop() || `ECF-${h.ano_calendario}.txt`;
    try {
      await baixarSpedZip({
        txtUrl: data.signedUrl, fileName, hash: h.hash_sha256 || 'N/A',
        empresa: { razao_social: h.razao_social, cnpj: h.cnpj },
        periodo: { inicio: `${h.ano_calendario}-01-01`, fim: `${h.ano_calendario}-12-31` },
        totalLinhas: h.total_linhas ?? 0, totalLancamentos: h.total_lancamentos ?? 0,
        tipo: 'ECF',
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de gerações — SPED ECF
          </CardTitle>
          <CardDescription>
            Data/hora, CNPJ e status de cada arquivo ECF gerado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo ECF gerado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((h) => {
                  const erros = h.validacoes?.erros ?? [];
                  const avisos = h.validacoes?.avisos ?? [];
                  const bloqueada = h.status === 'rejeitado' || erros.length > 0;
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{format(new Date(h.created_at), 'dd/MM/yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(h.created_at), 'HH:mm')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{formatCnpj(h.cnpj)}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={h.razao_social}>
                          {h.razao_social}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{h.ano_calendario}</TableCell>
                      <TableCell>
                        {bloqueada ? (
                          <Badge variant="destructive" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </Badge>
                        ) : h.status === 'transmitido' ? (
                          <Badge className="gap-1 bg-success hover:bg-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Transmitido
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Gerado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TooltipProvider>
                            {(erros.length > 0 || avisos.length > 0) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant={erros.length > 0 ? 'destructive' : 'outline'}
                                    onClick={() => setErrosAbertos(h)}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    {erros.length > 0 ? `${erros.length} erro(s)` : `${avisos.length} aviso(s)`}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes das validações</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={bloqueada}
                                  onClick={() => handleDownloadTxt(h)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {bloqueada ? 'Download bloqueado por erros' : 'Baixar .txt'}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={bloqueada}
                                  onClick={() => handleDownloadZip(h)}
                                >
                                  <FileArchive className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {bloqueada ? 'Download bloqueado por erros' : 'Baixar .zip (com relatório)'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!errosAbertos} onOpenChange={(v) => { if (!v) setErrosAbertos(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Validações — ECF {errosAbertos?.ano_calendario}
            </DialogTitle>
            <DialogDescription>
              {errosAbertos && format(new Date(errosAbertos.created_at), "dd/MM/yyyy 'às' HH:mm")}
              {' · '}{errosAbertos && formatCnpj(errosAbertos.cnpj)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {errosAbertos && errosAbertos.validacoes.erros.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Erros ({errosAbertos.validacoes.erros.length})
                  </h4>
                  <ul className="space-y-1">
                    {errosAbertos.validacoes.erros.map((e, i) => (
                      <li key={i} className={cn(
                        'rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive',
                      )}>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {errosAbertos && errosAbertos.validacoes.avisos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-warning mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Avisos ({errosAbertos.validacoes.avisos.length})
                  </h4>
                  <ul className="space-y-1">
                    {errosAbertos.validacoes.avisos.map((a, i) => (
                      <li key={i} className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning-foreground">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
