import { useState, useRef, useMemo } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useImportLancamentosLote, type ImportLoteResult } from '@/hooks/useLancamentosContabeis';
import { parseLancamentosCsv, type CsvLancParseResult, type ParsedLancamento } from '@/lib/lancamentos-csv-importer';
import { peekImportCheckpoint, quickHash } from '@/lib/import-checkpoint';
import type { PlanoContaRow } from '@/hooks/usePlanoContas';
import { UploadStep } from './import-lancamentos-csv/UploadStep';
import { PreviewStep } from './import-lancamentos-csv/PreviewStep';
import { ResultStep } from './import-lancamentos-csv/ResultStep';
import type { ImportProgress } from './import-lancamentos-csv/format-helpers';

interface Props {
  empresaId?: string;
  planoContas: PlanoContaRow[];
  ano: number;
}

type Step = 'upload' | 'preview' | 'result';

export function ImportLancamentosCSVDialog({ empresaId, planoContas, ano }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CsvLancParseResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    done: 0, total: 0, rate: 0, etaMs: 0, elapsedMs: 0,
  });
  const [importResult, setImportResult] = useState<ImportLoteResult | null>(null);
  const [checkpointKey, setCheckpointKey] = useState<string | null>(null);
  const [retomada, setRetomada] = useState<{
    refsConfirmadas: Set<string>;
    updatedAt: number;
  } | null>(null);
  const startedAtRef = useRef<number>(0);
  const lastSampleRef = useRef<{ t: number; done: number }>({ t: 0, done: 0 });
  const emaRateRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const importar = useImportLancamentosLote();

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setProgress({ done: 0, total: 0, rate: 0, etaMs: 0, elapsedMs: 0 });
    setImportResult(null);
    setCheckpointKey(null);
    setRetomada(null);
  };

  const handleClose = (next: boolean) => {
    if (!next && importar.isPending) return;
    setOpen(next);
    if (!next) setTimeout(reset, 200);
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setParsing(true);
    try {
      const r = await parseLancamentosCsv(f, planoContas);
      setParseResult(r);

      if (empresaId) {
        const head = await f.slice(0, 64 * 1024).text();
        const key = `${empresaId}:${f.name}:${f.size}:${quickHash(head)}`;
        setCheckpointKey(key);
        const prev = peekImportCheckpoint(key);
        if (prev && prev.refs.length > 0) {
          setRetomada({ refsConfirmadas: new Set(prev.refs), updatedAt: prev.updatedAt });
        } else {
          setRetomada(null);
        }
      }
      setStep('preview');
    } catch (e) {
      setParseResult({
        lancamentos: [], errors: [{ line: 0, message: e instanceof Error ? e.message : 'Erro ao ler arquivo' }],
        warnings: [], separator: ';', encoding: 'utf-8', totalLines: 0, totalPartidas: 0,
      });
      setStep('preview');
    } finally {
      setParsing(false);
    }
  };

  const lancamentosImportaveis = useMemo<ParsedLancamento[]>(() => {
    if (!parseResult) return [];
    const refsComErro = new Set(parseResult.errors.filter((e) => e.ref).map((e) => e.ref));
    return parseResult.lancamentos.filter((l) => l.balanceado && l.partidas.length >= 2 && !refsComErro.has(l.ref));
  }, [parseResult]);

  const lancsForaDoAno = useMemo(() => {
    return lancamentosImportaveis.filter((l) => {
      const y = Number(l.data.slice(0, 4));
      return y !== ano;
    }).length;
  }, [lancamentosImportaveis, ano]);

  const totalDebito = lancamentosImportaveis.reduce((s, l) => s + l.total_debito, 0);
  const podeImportar = !!empresaId && lancamentosImportaveis.length > 0 && (parseResult?.errors.length ?? 0) === 0;

  const handleImport = async () => {
    if (!empresaId || lancamentosImportaveis.length === 0) return;
    setStep('result');
    const total = lancamentosImportaveis.length;
    const now = performance.now();
    startedAtRef.current = now;
    lastSampleRef.current = { t: now, done: 0 };
    emaRateRef.current = 0;
    setProgress({ done: 0, total, rate: 0, etaMs: 0, elapsedMs: 0 });

    const res = await importar.mutateAsync({
      empresa_id: empresaId,
      lancamentos: lancamentosImportaveis,
      checkpointKey: checkpointKey ?? undefined,
      onProgress: (done, totalArg, chunkSize) => {
        const t = performance.now();
        const last = lastSampleRef.current;
        const dt = (t - last.t) / 1000;
        const dn = done - last.done;
        if (dt < 0.12 && done < totalArg) return;

        const instantRate = dt > 0 ? dn / dt : 0;
        const ALPHA = 0.3;
        const ema = emaRateRef.current === 0 ? instantRate : ALPHA * instantRate + (1 - ALPHA) * emaRateRef.current;
        emaRateRef.current = ema;
        lastSampleRef.current = { t, done };

        const restantes = Math.max(0, totalArg - done);
        const etaMs = ema > 0 ? (restantes / ema) * 1000 : 0;
        const elapsedMs = t - startedAtRef.current;
        setProgress({ done, total: totalArg, chunkSize, rate: ema, etaMs, elapsedMs });
      },
    });
    setImportResult(res);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!empresaId}>
          <Upload className="h-4 w-4 mr-2" />Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tighter">
            <div className="p-3.5 bg-primary/20 rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)] ring-1 ring-primary/30">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <span>Importação <span className="text-primary">Lote Alpha</span></span>
          </DialogTitle>
          <DialogDescription>
            Cada linha do CSV representa uma partida. Lançamentos são agrupados pelo campo <code className="bg-muted px-1 rounded">lancamento_ref</code>.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <UploadStep parsing={parsing} inputRef={inputRef} onFile={handleFile} />
        )}

        {step === 'preview' && parseResult && (
          <PreviewStep
            file={file}
            parseResult={parseResult}
            lancamentosImportaveis={lancamentosImportaveis}
            totalDebito={totalDebito}
            lancsForaDoAno={lancsForaDoAno}
            ano={ano}
            podeImportar={podeImportar}
            retomada={retomada}
            checkpointKey={checkpointKey}
            onReset={reset}
            onDescartarCheckpoint={() => setRetomada(null)}
            onImport={handleImport}
          />
        )}

        {step === 'result' && (
          <ResultStep
            isPending={importar.isPending}
            progress={progress}
            importResult={importResult}
            onClose={() => handleClose(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
