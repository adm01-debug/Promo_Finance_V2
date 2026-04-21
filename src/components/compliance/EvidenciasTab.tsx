import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Download, Loader2, FileArchive } from "lucide-react";
import { useEvidenciasPacotes } from "@/hooks/useEvidenciasPack";

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
  const { data, isLoading, gerar, baixar } = useEvidenciasPacotes();

  const toggleEscopo = (v: string) => {
    setEscopos((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
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
                <label key={e.value} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/30">
                  <Checkbox checked={escopos.includes(e.value)} onChange={() => toggleEscopo(e.value)} />
                  <span className="text-sm">{e.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded text-xs text-muted-foreground">
            O pacote ZIP contém um CSV por escopo, um <code>manifest.json</code> com hashes SHA-256 para validação
            de integridade e um <code>README.txt</code> com instruções. URL assinada válida por 7 dias.
          </div>
          <Button
            onClick={() => gerar.mutate({ periodo_inicio: inicio, periodo_fim: fim, escopos })}
            disabled={gerar.isPending || escopos.length === 0 || !inicio || !fim}
          >
            {gerar.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando pacote...
              </>
            ) : (
              <>
                <FileArchive className="h-4 w-4 mr-2" /> Gerar pacote
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de pacotes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum pacote gerado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {(data ?? []).map((p) => (
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
    </div>
  );
}
