import { Upload, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { downloadLancamentosCsvTemplate } from '@/lib/lancamentos-csv-importer';
import { cn } from '@/lib/utils';

interface Props {
  parsing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onFile: (f: File | null) => void;
}

export function UploadStep({ parsing, inputRef, onFile }: Props) {
  return (
    <div className="space-y-4">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Formato esperado</AlertTitle>
        <AlertDescription className="text-xs space-y-1">
          <div>Colunas obrigatórias: <code>lancamento_ref;data;historico;conta_codigo;tipo;valor</code></div>
          <div>Opcional: <code>historico_complementar</code></div>
          <div>• <b>data</b>: YYYY-MM-DD ou DD/MM/YYYY</div>
          <div>• <b>tipo</b>: D (débito) ou C (crédito)</div>
          <div>• <b>valor</b>: aceita formato BR (1.234,56) ou US (1234.56)</div>
          <div>• <b>conta_codigo</b>: deve existir no plano e ser <b>analítica</b></div>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={downloadLancamentosCsvTemplate} className="gap-2">
          <Download className="h-4 w-4" />Baixar template CSV
        </Button>
      </div>

      <div
        className={cn(
          'border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-700 cursor-pointer group/dropzone relative overflow-hidden',
          'border-white/10 bg-card/[0.02] hover:border-primary/40 hover:bg-primary/5 hover:shadow-2xl',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0] ?? null); }}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Arraste o CSV aqui ou clique para selecionar</p>
        <p className="text-xs text-muted-foreground mt-1">Apenas arquivos .csv</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {parsing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />Lendo arquivo...
        </div>
      )}
    </div>
  );
}
