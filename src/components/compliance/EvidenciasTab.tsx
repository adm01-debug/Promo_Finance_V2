import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Download, Loader2, FileArchive, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEvidenciasPacotes } from "@/hooks/useEvidenciasPack";
import { useGerarEvidenciasStream } from "@/hooks/useGerarEvidenciasStream";
import { EvidenciaStatusDialog } from "./EvidenciaStatusDialog";
import { AuditFiltersBar, type FiltrosState } from "./AuditFiltersBar";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";
import { toast } from "sonner";

const ESCOPOS = [
  { value: "financeiro", label: "Trilha Financeira" },
  { value: "tributario", label: "Trilha Tributária" },
  { value: "sistema", label: "Trilha de Sistema" },
  { value: "conformidade", label: "Conformidade Fiscal" },
];

function isoDays(dias: number) {
  return new Date(Date.now() - dias * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

function formatBytes(b: number | null) {
  if (!b) return "—";
  const mb = b / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;
}

export function EvidenciasTab() {
  const [inicio, setInicio] = useState(isoDays(30));
  const [fim, setFim] = useState(isoDays(0));
  const [escopos, setEscopos] = useState<string[]>(["financeiro", "tributario", "sistema", "conformidade"]);
  const { data, isLoading, baixar } = useEvidenciasPacotes();
  const stream = useGerarEvidenciasStream();
  const [statusOpen, setStatusOpen] = useState(false);

  const handleGerar = () => {
    setStatusOpen(true);
    stream.start({ periodo_inicio: inicio, periodo_fim: fim, escopos });
  };

  const [filtros, setFiltros] = useState<FiltrosState>({
    inicio: "",
    fim: "",
    busca: "",
    acao: "todas",
    usuario: "",
  });

  // Filtros adicionais específicos da aba Evidências
  const [coberturaInicio, setCoberturaInicio] = useState("");
  const [coberturaFim, setCoberturaFim] = useState("");
  const [escoposFiltro, setEscoposFiltro] = useState<string[]>([]);

  const aplicarPresetGeracao = (dias: number) => {
    setFiltros((f) => ({ ...f, inicio: isoDays(dias), fim: isoDays(0) }));
  };

  const limparFiltrosHistorico = () => {
    setFiltros({ inicio: "", fim: "", busca: "", acao: "todas", usuario: "" });
    setCoberturaInicio("");
    setCoberturaFim("");
    setEscoposFiltro([]);
  };

  const toggleEscopoFiltro = (v: string) => {
    setEscoposFiltro((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const filtrosAtivos =
    !!filtros.inicio ||
    !!filtros.fim ||
    !!filtros.busca ||
    !!filtros.usuario ||
    !!coberturaInicio ||
    !!coberturaFim ||
    escoposFiltro.length > 0;

  const usuarios = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((p) => p.gerado_por_email && set.add(p.gerado_por_email));
    return Array.from(set).sort();
  }, [data]);

  const pacotesFiltrados = useMemo(() => {
    return (data ?? []).filter((p) => {
      const dt = new Date(p.created_at);
      if (filtros.inicio && dt < new Date(`${filtros.inicio}T00:00:00`)) return false;
      if (filtros.fim && dt > new Date(`${filtros.fim}T23:59:59`)) return false;
      if (filtros.usuario && p.gerado_por_email !== filtros.usuario) return false;
      if (filtros.busca) {
        const hay =
          `${p.periodo_inicio} ${p.periodo_fim} ${p.escopos.join(" ")} ${p.gerado_por_email ?? ""}`.toLowerCase();
        if (!hay.includes(filtros.busca.toLowerCase())) return false;
      }
      // Filtro por período de cobertura do pacote (sobreposição com [coberturaInicio, coberturaFim])
      if (coberturaInicio && p.periodo_fim < coberturaInicio) return false;
      if (coberturaFim && p.periodo_inicio > coberturaFim) return false;
      // Filtro por escopos: pacote deve conter ao menos um dos escopos selecionados
      if (escoposFiltro.length > 0 && !p.escopos.some((e) => escoposFiltro.includes(e))) return false;
      return true;
    });
  }, [data, filtros, coberturaInicio, coberturaFim, escoposFiltro]);

  const toggleEscopo = (v: string) => {
    setEscopos((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const colunasExport: ExportColumn<Record<string, string>>[] = [
    { header: "Início", key: "Início" },
    { header: "Fim", key: "Fim" },
    { header: "Escopos", key: "Escopos" },
    { header: "Gerado por", key: "Gerado por" },
    { header: "Data geração", key: "Data geração" },
    { header: "Tamanho", key: "Tamanho" },
  ];

  const handleExport = (formato: "csv" | "pdf") => {
    if (pacotesFiltrados.length === 0) {
      toast.warning("Nada para exportar com os filtros atuais.");
      return;
    }
    const linhas = pacotesFiltrados.map((p) => ({
      Início: p.periodo_inicio,
      Fim: p.periodo_fim,
      Escopos: p.escopos.join(", "),
      "Gerado por": p.gerado_por_email ?? "—",
      "Data geração": new Date(p.created_at).toLocaleString("pt-BR"),
      Tamanho: formatBytes(p.tamanho_bytes),
    }));
    const periodoSuffix = filtros.inicio && filtros.fim ? `_${filtros.inicio}_${filtros.fim}` : "";
    if (formato === "csv") exportToCSV(linhas, colunasExport, `evidencias-historico${periodoSuffix}`);
    else exportToPDF(linhas, colunasExport, "Histórico de Pacotes de Evidências");
    toast.success(`${linhas.length} pacote(s) exportado(s).`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> Gerar pacote de evidências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Início</label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Fim</label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Escopos</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ESCOPOS.map((e) => (
                <label
                  key={e.value}
                  className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox checked={escopos.includes(e.value)} onChange={() => toggleEscopo(e.value)} />
                  <span className="text-sm">{e.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded text-xs text-muted-foreground">
            O pacote ZIP contém um CSV por escopo, um <code>manifest.json</code> com hashes SHA-256 para validação de
            integridade e um <code>README.txt</code> com instruções. URL assinada válida por 7 dias.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleGerar}
              disabled={stream.status === "running" || escopos.length === 0 || !inicio || !fim}
            >
              {stream.status === "running" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando pacote...</>
              ) : (
                <><FileArchive className="h-4 w-4 mr-2" /> Gerar pacote</>
              )}
            </Button>
            {(stream.status === "success" || stream.status === "error") && (
              <Button variant="outline" onClick={() => setStatusOpen(true)}>
                Ver último status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de pacotes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AuditFiltersBar value={filtros} onChange={setFiltros} usuarios={usuarios} />

          <div className="rounded-md border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" /> Filtros adicionais
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Geração:</span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => aplicarPresetGeracao(7)}>
                  7d
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => aplicarPresetGeracao(30)}>
                  30d
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => aplicarPresetGeracao(90)}>
                  90d
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => aplicarPresetGeracao(365)}>
                  1a
                </Button>
                {filtrosAtivos && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={limparFiltrosHistorico}
                  >
                    <X className="h-3 w-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cobertura — início</Label>
                <Input
                  type="date"
                  value={coberturaInicio}
                  onChange={(e) => setCoberturaInicio(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cobertura — fim</Label>
                <Input
                  type="date"
                  value={coberturaFim}
                  onChange={(e) => setCoberturaFim(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Escopos incluídos no pacote</Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ESCOPOS.map((e) => {
                  const ativo = escoposFiltro.includes(e.value);
                  return (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => toggleEscopoFiltro(e.value)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    >
                      <Badge
                        variant={ativo ? "default" : "outline"}
                        className="cursor-pointer text-[11px] px-2.5 py-0.5"
                      >
                        {e.label}
                      </Badge>
                    </button>
                  );
                })}
                {escoposFiltro.length === 0 && (
                  <span className="text-xs text-muted-foreground self-center ml-1">
                    (qualquer escopo)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isLoading
                ? "Carregando..."
                : `${pacotesFiltrados.length.toLocaleString("pt-BR")} de ${(data ?? []).length.toLocaleString("pt-BR")} pacotes`}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={pacotesFiltrados.length === 0}>
                  <Download className="h-3 w-3 mr-1" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2">
                  <FileText className="h-4 w-4" /> Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pacotesFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pacote encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {pacotesFiltrados.map((p) => (
                <li key={p.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {p.periodo_inicio} → {p.periodo_fim}
                      </span>
                      {p.escopos.map((e) => (
                        <Badge key={e} variant="outline" className="text-[10px]">
                          {e}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gerado por {p.gerado_por_email ?? "—"} em{" "}
                      {new Date(p.created_at).toLocaleString("pt-BR")} · {formatBytes(p.tamanho_bytes)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => baixar.mutate(p.storage_path)}>
                    <Download className="h-3 w-3 mr-1" /> Baixar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <EvidenciaStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        status={stream.status}
        events={stream.events}
        current={stream.current}
        percent={stream.percent}
        result={stream.result}
        error={stream.error}
        onRetry={stream.retry}
        onCancel={stream.cancel}
      />
    </div>
  );
}
