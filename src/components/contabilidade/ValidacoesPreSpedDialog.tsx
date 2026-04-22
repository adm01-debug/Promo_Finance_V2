import { Download, FileArchive, AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ValidacoesPreSpedArquivo {
  tipo: 'ECD' | 'ECF';
  ano_calendario: number;
  hash_sha256: string | null;
  status: string;
  validacoes: { erros: string[]; avisos: string[] };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  arquivo: ValidacoesPreSpedArquivo | null;
  onDownloadTxt: () => void;
  onDownloadZip: () => void;
}

export function ValidacoesPreSpedDialog({ open, onOpenChange, arquivo, onDownloadTxt, onDownloadZip }: Props) {
  if (!arquivo) return null;

  const erros = arquivo.validacoes?.erros ?? [];
  const avisos = arquivo.validacoes?.avisos ?? [];
  const isRejeitado = arquivo.status === 'rejeitado';
  const bloqueado = erros.length > 0 || isRejeitado;
  const hashCurto = arquivo.hash_sha256 ? `${arquivo.hash_sha256.slice(0, 12)}…` : '—';

  const handleDownloadTxt = () => {
    if (bloqueado) return;
    onDownloadTxt();
    onOpenChange(false);
  };

  const handleDownloadZip = () => {
    if (bloqueado) return;
    onDownloadZip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Validações SPED {arquivo.tipo} · {arquivo.ano_calendario}
          </DialogTitle>
          <DialogDescription>
            Revise erros e avisos antes de baixar e transmitir o arquivo no PVA-{arquivo.tipo}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Erros</div>
            <div
              data-testid="contador-erros"
              className={`text-2xl font-bold ${erros.length > 0 ? 'text-destructive' : 'text-success'}`}
            >
              {erros.length}
            </div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Avisos</div>
            <div
              data-testid="contador-avisos"
              className={`text-2xl font-bold ${avisos.length > 0 ? 'text-warning' : 'text-muted-foreground'}`}
            >
              {avisos.length}
            </div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Hash</div>
            <div className="text-xs font-mono mt-2 truncate" title={arquivo.hash_sha256 ?? ''}>
              {hashCurto}
            </div>
          </div>
        </div>

        {bloqueado && (
          <Alert variant="error" data-testid="banner-bloqueio">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{isRejeitado ? 'Arquivo rejeitado pela transmissão' : 'Download bloqueado'}</AlertTitle>
            <AlertDescription>
              {isRejeitado
                ? `A transmissão deste SPED foi rejeitada${erros.length > 0 ? ` com ${erros.length} erro(s)` : ''}. Corrija as inconsistências e gere o arquivo novamente antes de retransmitir ao PVA.`
                : `Este SPED contém ${erros.length} erro(s) bloqueante(s). Corrija as inconsistências e gere o arquivo novamente antes de transmitir ao PVA.`}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={erros.length > 0 ? 'erros' : 'avisos'}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="erros" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Erros
              <Badge variant={erros.length > 0 ? 'destructive' : 'outline'} className="ml-1">
                {erros.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="avisos" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Avisos
              <Badge variant="outline" className="ml-1">
                {avisos.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="erros">
            {erros.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-success p-4 justify-center">
                <CheckCircle2 className="h-4 w-4" /> Nenhum erro encontrado
              </div>
            ) : (
              <ScrollArea className="max-h-72 border rounded-md p-3">
                <ol data-testid="lista-erros" className="space-y-2 text-xs font-mono list-decimal list-inside">
                  {erros.map((e, i) => (
                    <li key={i} className="text-destructive">
                      {e}
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="avisos">
            {avisos.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 justify-center">
                <CheckCircle2 className="h-4 w-4" /> Nenhum aviso
              </div>
            ) : (
              <ScrollArea className="max-h-72 border rounded-md p-3">
                <ol data-testid="lista-avisos" className="space-y-2 text-xs font-mono list-decimal list-inside">
                  {avisos.map((a, i) => (
                    <li key={i} className="text-warning">
                      {a}
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={handleDownloadZip}
                    disabled={bloqueado}
                    aria-disabled={bloqueado}
                    data-testid="btn-download-zip"
                  >
                    <FileArchive className="h-4 w-4 mr-2" />
                    Baixar .zip
                  </Button>
                </span>
              </TooltipTrigger>
              {bloqueado && <TooltipContent>{isRejeitado ? 'Bloqueado: arquivo rejeitado' : 'Bloqueado por erros de validação'}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleDownloadTxt}
                    disabled={bloqueado}
                    aria-disabled={bloqueado}
                    data-testid="btn-download-txt"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar .txt
                  </Button>
                </span>
              </TooltipTrigger>
              {bloqueado && <TooltipContent>{isRejeitado ? 'Bloqueado: arquivo rejeitado' : 'Bloqueado por erros de validação'}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
