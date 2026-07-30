import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  FileJson,
  Files,
  Hash,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { KpiBox } from "./verificar-integridade/KpiBox";
import { LinhaResultado } from "./verificar-integridade/LinhaResultado";
import { useIntegridadeVerifier } from "./verificar-integridade/useIntegridadeVerifier";

export function VerificarIntegridadeTab() {
  const {
    manifest,
    manifestNome,
    arquivos,
    verificando,
    progresso,
    resumo,
    inputZipRef,
    inputManifestRef,
    inputArquivosRef,
    reset,
    handleZip,
    handleManifest,
    handleArquivos,
    verificar,
    podeVerificar,
    integridadeOk,
  } = useIntegridadeVerifier();

  return (
    <div className="space-y-4">
      {/* Cartão de upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Verificar integridade do pacote
          </CardTitle>
          <CardDescription>
            Recalcule o SHA-256 dos CSVs localmente (no seu navegador) e compare
            com os hashes declarados no <code>manifest.json</code>. Nenhum
            arquivo é enviado a nenhum servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => inputZipRef.current?.click()}
              disabled={verificando}
            >
              <FileArchive className="h-5 w-5" />
              <span className="text-sm font-medium">Carregar ZIP completo</span>
              <span className="text-xs text-muted-foreground">
                Lê manifest + CSVs
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => inputManifestRef.current?.click()}
              disabled={verificando}
            >
              <FileJson className="h-5 w-5" />
              <span className="text-sm font-medium">Carregar manifest.json</span>
              <span className="text-xs text-muted-foreground">
                Apenas os hashes de referência
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => inputArquivosRef.current?.click()}
              disabled={verificando || !manifest}
            >
              <Files className="h-5 w-5" />
              <span className="text-sm font-medium">Adicionar CSVs</span>
              <span className="text-xs text-muted-foreground">
                {manifest ? "Para conferir contra o manifest" : "Carregue o manifest primeiro"}
              </span>
            </Button>
          </div>

          <input
            ref={inputZipRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleZip(f);
            }}
          />
          <input
            ref={inputManifestRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleManifest(f);
            }}
          />
          <input
            ref={inputArquivosRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0)
                handleArquivos(e.target.files);
            }}
          />

          {manifest && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileJson className="h-3 w-3" />
                  {manifestNome ?? "manifest.json"}
                </Badge>
                <Badge variant="outline">
                  {Object.keys(manifest.arquivos).length} arquivo(s) declarado(s)
                </Badge>
                <Badge variant="outline">{arquivos.size} arquivo(s) carregado(s)</Badge>
                {manifest.periodo_inicio && manifest.periodo_fim && (
                  <Badge variant="outline">
                    Período {manifest.periodo_inicio} → {manifest.periodo_fim}
                  </Badge>
                )}
                {manifest.gerado_em && (
                  <Badge variant="outline">
                    Gerado em {new Date(manifest.gerado_em).toLocaleString("pt-BR")}
                  </Badge>
                )}
                {manifest.gerado_por && (
                  <Badge variant="outline">por {manifest.gerado_por}</Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button onClick={verificar} disabled={!podeVerificar} className="gap-2">
              {verificando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Hash className="h-4 w-4" />
              )}
              Verificar integridade
            </Button>
            <Button
              variant="ghost"
              onClick={reset}
              disabled={verificando}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Limpar
            </Button>
          </div>

          {verificando && (
            <div className="space-y-1">
              <Progress value={progresso} />
              <p className="text-xs text-muted-foreground">
                Calculando SHA-256… {progresso}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {resumo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {integridadeOk ? (
                <ShieldCheck className="h-4 w-4 text-success" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              )}
              Resumo de integridade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={integridadeOk ? "success" : "error"}>
              {integridadeOk ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              <AlertTitle>
                {integridadeOk
                  ? "Pacote íntegro"
                  : "Foram encontradas divergências"}
              </AlertTitle>
              <AlertDescription>
                {integridadeOk
                  ? "Todos os arquivos declarados no manifest conferem com os hashes calculados."
                  : "Ao menos um arquivo está ausente ou com hash diferente. Não confie nestes dados sem reemitir o pacote."}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiBox
                label="Conferem"
                valor={resumo.ok}
                icon={<CheckCircle2 className="h-4 w-4 text-success" />}
              />
              <KpiBox
                label="Divergentes"
                valor={resumo.divergentes}
                icon={<XCircle className="h-4 w-4 text-destructive" />}
                destaque={resumo.divergentes > 0}
              />
              <KpiBox
                label="Ausentes"
                valor={resumo.ausentes}
                icon={<AlertTriangle className="h-4 w-4 text-warning" />}
                destaque={resumo.ausentes > 0}
              />
              <KpiBox
                label="Não declarados"
                valor={resumo.extras}
                icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              {resumo.resultados.map((r) => (
                <LinhaResultado key={`${r.status}-${r.nome}`} item={r} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
