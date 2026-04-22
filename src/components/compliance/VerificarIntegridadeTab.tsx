import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
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
  ShieldCheck,
  ShieldAlert,
  FileArchive,
  FileJson,
  Files,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

// ---------- Tipos do manifest produzido pela edge function ----------
interface ManifestArquivo {
  linhas: number;
  sha256: string;
}
interface Manifest {
  gerado_em?: string;
  gerado_por?: string;
  gerado_por_id?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  escopos?: string[];
  arquivos: Record<string, ManifestArquivo>;
}

type ResultadoArquivo =
  | { nome: string; status: "ok"; hashEsperado: string; hashCalculado: string }
  | {
      nome: string;
      status: "divergente";
      hashEsperado: string;
      hashCalculado: string;
    }
  | { nome: string; status: "ausente"; hashEsperado: string }
  | { nome: string; status: "extra"; hashCalculado: string };

interface Resumo {
  totalManifest: number;
  ok: number;
  divergentes: number;
  ausentes: number;
  extras: number;
  resultados: ResultadoArquivo[];
}

// ---------- Utilidades ----------
async function sha256OfBytes(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isManifest(obj: unknown): obj is Manifest {
  if (!obj || typeof obj !== "object") return false;
  const m = obj as { arquivos?: unknown };
  if (!m.arquivos || typeof m.arquivos !== "object") return false;
  return Object.values(m.arquivos as Record<string, unknown>).every((v) => {
    if (!v || typeof v !== "object") return false;
    const a = v as { sha256?: unknown; linhas?: unknown };
    return typeof a.sha256 === "string" && typeof a.linhas === "number";
  });
}

// ---------- Componente principal ----------
export function VerificarIntegridadeTab() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestNome, setManifestNome] = useState<string | null>(null);
  const [arquivos, setArquivos] = useState<Map<string, Uint8Array>>(new Map());
  const [verificando, setVerificando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const inputZipRef = useRef<HTMLInputElement>(null);
  const inputManifestRef = useRef<HTMLInputElement>(null);
  const inputArquivosRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setManifest(null);
    setManifestNome(null);
    setArquivos(new Map());
    setResumo(null);
    setProgresso(0);
    if (inputZipRef.current) inputZipRef.current.value = "";
    if (inputManifestRef.current) inputManifestRef.current.value = "";
    if (inputArquivosRef.current) inputArquivosRef.current.value = "";
  };

  // ---------- Handler ZIP completo ----------
  const handleZip = async (file: File) => {
    try {
      setVerificando(true);
      setResumo(null);
      const zip = await JSZip.loadAsync(file);
      const novoMap = new Map<string, Uint8Array>();
      let manifestObj: Manifest | null = null;

      const entradas = Object.values(zip.files).filter((f) => !f.dir);
      for (const entrada of entradas) {
        const bytes = await entrada.async("uint8array");
        if (entrada.name === "manifest.json") {
          try {
            const txt = new TextDecoder().decode(bytes);
            const parsed = JSON.parse(txt);
            if (isManifest(parsed)) manifestObj = parsed;
          } catch {
            // segue — será tratado abaixo
          }
        } else {
          // só os CSVs nos interessam para o cálculo de hash
          novoMap.set(entrada.name, bytes);
        }
      }

      if (!manifestObj) {
        toast.error("manifest.json não encontrado ou inválido dentro do ZIP.");
        setVerificando(false);
        return;
      }
      setManifest(manifestObj);
      setManifestNome(file.name);
      setArquivos(novoMap);
      toast.success(`ZIP carregado: ${entradas.length} arquivo(s).`);
    } catch (e) {
      toast.error(`Falha ao ler ZIP: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setVerificando(false);
    }
  };

  // ---------- Handler manifest.json isolado ----------
  const handleManifest = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!isManifest(parsed)) {
        toast.error("Arquivo não parece um manifest.json válido.");
        return;
      }
      setManifest(parsed);
      setManifestNome(file.name);
      setResumo(null);
      toast.success(
        `Manifest carregado — ${Object.keys(parsed.arquivos).length} arquivo(s) declarado(s).`,
      );
    } catch (e) {
      toast.error(`JSON inválido: ${e instanceof Error ? e.message : "erro"}`);
    }
  };

  // ---------- Handler arquivos avulsos (CSVs) ----------
  const handleArquivos = async (files: FileList) => {
    const novoMap = new Map(arquivos);
    for (const f of Array.from(files)) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      novoMap.set(f.name, bytes);
    }
    setArquivos(novoMap);
    setResumo(null);
    toast.success(`${files.length} arquivo(s) adicionado(s).`);
  };

  // ---------- Verificação ----------
  const verificar = async () => {
    if (!manifest) return;
    setVerificando(true);
    setProgresso(0);
    setResumo(null);

    const declarados = Object.entries(manifest.arquivos);
    const resultados: ResultadoArquivo[] = [];
    let ok = 0;
    let divergentes = 0;
    let ausentes = 0;

    for (let i = 0; i < declarados.length; i++) {
      const [nome, info] = declarados[i];
      const bytes = arquivos.get(nome);
      if (!bytes) {
        resultados.push({ nome, status: "ausente", hashEsperado: info.sha256 });
        ausentes++;
      } else {
        const hash = await sha256OfBytes(bytes);
        if (hash === info.sha256) {
          resultados.push({
            nome,
            status: "ok",
            hashEsperado: info.sha256,
            hashCalculado: hash,
          });
          ok++;
        } else {
          resultados.push({
            nome,
            status: "divergente",
            hashEsperado: info.sha256,
            hashCalculado: hash,
          });
          divergentes++;
        }
      }
      setProgresso(Math.round(((i + 1) / declarados.length) * 100));
    }

    // arquivos que vieram além do que o manifest declara
    let extras = 0;
    for (const [nome, bytes] of arquivos.entries()) {
      if (!manifest.arquivos[nome]) {
        const hash = await sha256OfBytes(bytes);
        resultados.push({ nome, status: "extra", hashCalculado: hash });
        extras++;
      }
    }

    setResumo({
      totalManifest: declarados.length,
      ok,
      divergentes,
      ausentes,
      extras,
      resultados,
    });
    setVerificando(false);
  };

  const podeVerificar = !!manifest && arquivos.size > 0 && !verificando;

  const integridadeOk =
    !!resumo && resumo.divergentes === 0 && resumo.ausentes === 0;

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

          {/* inputs ocultos */}
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

          {/* Estado carregado */}
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
            <Button
              onClick={verificar}
              disabled={!podeVerificar}
              className="gap-2"
            >
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

      {/* Resumo */}
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
            <Alert variant={integridadeOk ? "default" : "destructive"}>
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

// ---------- Subcomponentes ----------
function KpiBox({
  label,
  valor,
  icon,
  destaque,
}: {
  label: string;
  valor: number;
  icon: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        destaque ? "border-destructive/40 bg-destructive/5" : "bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{valor}</div>
    </div>
  );
}

function LinhaResultado({ item }: { item: ResultadoArquivo }) {
  const cfg = {
    ok: {
      Icon: CheckCircle2,
      cls: "text-success",
      label: "Conferiu",
      variant: "secondary" as const,
    },
    divergente: {
      Icon: XCircle,
      cls: "text-destructive",
      label: "Hash divergente",
      variant: "destructive" as const,
    },
    ausente: {
      Icon: AlertTriangle,
      cls: "text-warning",
      label: "Arquivo não enviado",
      variant: "outline" as const,
    },
    extra: {
      Icon: AlertTriangle,
      cls: "text-muted-foreground",
      label: "Não declarado no manifest",
      variant: "outline" as const,
    },
  }[item.status];

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <cfg.Icon className={`h-4 w-4 shrink-0 ${cfg.cls}`} />
          <span className="font-medium truncate">{item.nome}</span>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>
      {(item.status === "ok" || item.status === "divergente") && (
        <div className="mt-2 grid gap-1 text-xs font-mono break-all">
          <div>
            <span className="text-muted-foreground">esperado: </span>
            {item.hashEsperado}
          </div>
          <div>
            <span className="text-muted-foreground">calculado: </span>
            <span
              className={
                item.status === "divergente" ? "text-destructive" : ""
              }
            >
              {item.hashCalculado}
            </span>
          </div>
        </div>
      )}
      {item.status === "ausente" && (
        <div className="mt-2 text-xs font-mono break-all">
          <span className="text-muted-foreground">esperado: </span>
          {item.hashEsperado}
        </div>
      )}
      {item.status === "extra" && (
        <div className="mt-2 text-xs font-mono break-all">
          <span className="text-muted-foreground">calculado: </span>
          {item.hashCalculado}
        </div>
      )}
    </div>
  );
}
