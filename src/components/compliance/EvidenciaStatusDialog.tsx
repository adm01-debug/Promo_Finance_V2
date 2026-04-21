import { useMemo } from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle, Download, Copy, RefreshCw, FileArchive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import type { GerarStatus, ProgressEvent, GerarResult } from "@/hooks/useGerarEvidenciasStream";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  status: GerarStatus;
  events: ProgressEvent[];
  current: ProgressEvent | null;
  percent: number;
  result: GerarResult | null;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
}

function formatBytes(b: number | null | undefined) {
  if (!b) return "—";
  const mb = b / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;
}

export function EvidenciaStatusDialog({
  open,
  onOpenChange,
  status,
  events,
  current,
  percent,
  result,
  error,
  onRetry,
  onCancel,
}: Props) {
  const arquivos = useMemo(() => {
    if (!result?.manifest) return [];
    const arq = (result.manifest as { arquivos?: Record<string, { linhas: number; sha256: string }> }).arquivos ?? {};
    return Object.entries(arq).map(([nome, info]) => ({ nome, ...info }));
  }, [result]);

  const totalSteps = current?.total ?? events[0]?.total ?? 0;

  const title =
    status === "running" ? "Gerando pacote de evidências"
    : status === "success" ? "Pacote pronto"
    : status === "error" ? "Falha ao gerar pacote"
    : "Status do pacote";

  const copyLink = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.signed_url);
    toast.success("Link copiado.");
  };

  const copyHash = (h: string) => {
    navigator.clipboard.writeText(h);
    toast.success("Hash copiado.");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (status !== "running") onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === "running" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-success" />}
            {status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
        </DialogHeader>

        {status === "running" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{current?.label ?? "Iniciando..."}{current?.detail ? ` · ${current.detail}` : ""}</span>
                <span className="font-mono">{percent}%</span>
              </div>
              <Progress value={percent} />
              {totalSteps > 0 && (
                <p className="text-xs text-muted-foreground">
                  Etapa {current?.index ?? 0} de {totalSteps}
                </p>
              )}
            </div>

            <ul className="space-y-1.5">
              {events.map((ev, i) => {
                const isLast = i === events.length - 1;
                const done = !isLast || percent === 100;
                return (
                  <li key={`${ev.step}-${i}`} className="flex items-start gap-2 text-sm">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{ev.label}</span>
                      {ev.detail && <span className="text-muted-foreground"> · {ev.detail}</span>}
                    </div>
                  </li>
                );
              })}
              {events.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Circle className="h-4 w-4" /> Aguardando primeiro evento do servidor...
                </li>
              )}
            </ul>
          </div>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription className="break-words">{error}</AlertDescription>
          </Alert>
        )}

        {status === "success" && result && (
          <div className="space-y-4">
            <Progress value={100} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="font-medium">{result.pacote.periodo_inicio} → {result.pacote.periodo_fim}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tamanho</p>
                <p className="font-medium">{formatBytes(result.pacote.tamanho_bytes)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gerado por</p>
                <p className="font-medium truncate">{result.pacote.gerado_por_email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gerado em</p>
                <p className="font-medium">{new Date(result.pacote.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Escopos</p>
                <div className="flex flex-wrap gap-1">
                  {result.pacote.escopos.map((e) => (
                    <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {arquivos.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs font-medium flex items-center gap-2">
                  <FileArchive className="h-3.5 w-3.5" /> Conteúdo do ZIP ({arquivos.length} arquivo{arquivos.length > 1 ? "s" : ""})
                </div>
                <ul className="divide-y text-xs">
                  {arquivos.map((a) => (
                    <li key={a.nome} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono truncate">{a.nome}</p>
                        <p className="text-muted-foreground">
                          {a.linhas.toLocaleString("pt-BR")} linhas · sha256: <span className="font-mono" title={a.sha256}>{a.sha256.slice(0, 16)}…</span>
                        </p>
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => copyHash(a.sha256)} title="Copiar hash">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Alert>
              <AlertDescription className="text-xs">
                Link de download válido por 7 dias. Hashes SHA-256 garantem integridade dos CSVs.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="gap-2">
          {status === "running" && onCancel && (
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          )}
          {status === "error" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              <Button onClick={onRetry}><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button>
            </>
          )}
          {status === "success" && result && (
            <>
              <Button variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copiar link</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              <Button onClick={() => window.open(result.signed_url, "_blank")}>
                <Download className="h-4 w-4 mr-2" />Baixar ZIP
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
