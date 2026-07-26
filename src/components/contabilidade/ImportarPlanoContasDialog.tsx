import { useRef, useState } from 'react';
import { Upload, Download, FileWarning, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  parsePlanoContasCsv,
  PLANO_CONTAS_CSV_TEMPLATE,
  type PlanoContasParseResult,
} from '@/lib/plano-contas-csv-importer';
import { useImportPlanoContas } from '@/hooks/useImportPlanoContas';

export interface ImportarPlanoContasDialogProps {
  /** Empresa de destino. O botão fica desabilitado quando ausente. */
  empresaId: string;
}

/** Baixa o modelo de CSV no navegador. */
function baixarModelo(): void {
  const blob = new Blob([`\uFEFF${PLANO_CONTAS_CSV_TEMPLATE}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo-plano-de-contas.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importação de plano de contas via CSV/TSV com pré-visualização,
 * relatório de linhas rejeitadas e progresso de gravação.
 */
export function ImportarPlanoContasDialog({ empresaId }: ImportarPlanoContasDialogProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PlanoContasParseResult | null>(null);
  const [progresso, setProgresso] = useState<{ done: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const importar = useImportPlanoContas();

  const handleArquivo = async (file: File) => {
    try {
      const texto = await file.text();
      setPreview(parsePlanoContasCsv(texto));
      setProgresso(null);
    } catch (e) {
      setPreview(null);
      toast.error(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    }
  };

  const confirmar = () => {
    if (!preview) return;
    setProgresso({ done: 0, total: preview.contas.length });
    importar.mutate(
      {
        empresa_id: empresaId,
        contas: preview.contas,
        onProgress: (done, total) => setProgresso({ done, total }),
      },
      {
        onSuccess: (res) => {
          if (res.falhas.length === 0) {
            setOpen(false);
            setPreview(null);
            setProgresso(null);
          }
        },
      },
    );
  };

  const pct = progresso && progresso.total > 0 ? (progresso.done / progresso.total) * 100 : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setPreview(null);
          setProgresso(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={!empresaId}>
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar plano de contas</DialogTitle>
          <DialogDescription>
            Colunas obrigatórias: <code>codigo</code>, <code>descricao</code>, <code>tipo</code>,{' '}
            <code>natureza</code>. Opcionais: <code>codigo_referencial</code>,{' '}
            <code>aceita_lancamento</code>. Contas já existentes são atualizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleArquivo(f);
                e.target.value = '';
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Selecionar arquivo
            </Button>
            <Button variant="ghost" size="sm" onClick={baixarModelo} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar modelo
            </Button>
          </div>

          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 border-success/40 bg-success/10 text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  {preview.contas.length} conta(s) válida(s)
                </Badge>
                {preview.invalidas.length > 0 && (
                  <Badge variant="outline" className="gap-1 border-destructive/40 bg-destructive/10 text-destructive">
                    <FileWarning className="h-3 w-3" />
                    {preview.invalidas.length} linha(s) rejeitada(s)
                  </Badge>
                )}
                <Badge variant="outline">{preview.totalLinhas} linha(s) lida(s)</Badge>
              </div>

              {preview.invalidas.length > 0 && (
                <ScrollArea className="h-40 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <ul className="space-y-1 text-xs">
                    {preview.invalidas.map((i) => (
                      <li key={`${i.linha}-${i.codigo}`} className="text-muted-foreground">
                        <span className="font-mono text-destructive">L{i.linha}</span>{' '}
                        {i.codigo && <span className="font-mono">{i.codigo}</span>} — {i.erro}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}

              <ScrollArea className="h-48 rounded-md border p-3">
                <ul className="space-y-1 text-xs">
                  {preview.contas.map((c) => (
                    <li key={c.codigo} className="flex items-center gap-2">
                      <span
                        className="font-mono text-muted-foreground"
                        style={{ paddingLeft: `${(c.nivel - 1) * 12}px` }}
                      >
                        {c.codigo}
                      </span>
                      <span className={c.aceita_lancamento ? 'text-foreground' : 'font-semibold text-foreground'}>
                        {c.descricao}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {c.aceita_lancamento ? 'analítica' : 'sintética'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>

              {progresso && (
                <div className="space-y-1">
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    {progresso.done} de {progresso.total} conta(s) processada(s)
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                  Descartar
                </Button>
                <Button
                  size="sm"
                  onClick={confirmar}
                  disabled={preview.contas.length === 0 || importar.isPending}
                  className="gap-2"
                >
                  {importar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Importar {preview.contas.length} conta(s)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
