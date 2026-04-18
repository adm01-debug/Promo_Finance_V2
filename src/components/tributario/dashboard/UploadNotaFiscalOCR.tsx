import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcessarNFOCR, type DadosExtraidosNF } from '@/hooks/useProcessarNFOCR';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  empresaId?: string;
}

export function UploadNotaFiscalOCR({ empresaId }: Props) {
  const { processar, lista } = useProcessarNFOCR(empresaId);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<DadosExtraidosNF | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande (máx 10MB)');
      return;
    }
    const result = await processar.mutateAsync(file);
    setPreview(result.dados_extraidos);
  }, [processar]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const fmtBRL = (v?: number) => v != null ? formatCurrency(v) : '—';

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          OCR de Notas Fiscais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm mb-2">Arraste uma NF (PDF/JPG/PNG) ou clique para enviar</p>
          <input
            type="file" accept="image/*,application/pdf"
            id="nf-upload" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button asChild size="sm" variant="outline" disabled={processar.isPending}>
            <label htmlFor="nf-upload" className="cursor-pointer">
              {processar.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando…</> : 'Selecionar arquivo'}
            </label>
          </Button>
        </div>

        {preview && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-muted/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Dados extraídos
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Emissor:</span> {preview.razao_social_emissor ?? '—'}</div>
              <div><span className="text-muted-foreground">CNPJ:</span> {preview.cnpj_emissor ?? '—'}</div>
              <div><span className="text-muted-foreground">NF nº:</span> {preview.numero_nf ?? '—'}</div>
              <div><span className="text-muted-foreground">Emissão:</span> {preview.data_emissao ?? '—'}</div>
              <div><span className="text-muted-foreground">CFOP:</span> {preview.cfop ?? '—'}</div>
              <div className="font-semibold"><span className="text-muted-foreground font-normal">Total:</span> {fmtBRL(preview.valor_total)}</div>
            </div>
            {preview.descricao && (
              <p className="text-xs text-muted-foreground border-t pt-2">{preview.descricao}</p>
            )}
          </motion.div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Últimas processadas</p>
          {lista.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (lista.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma NF processada ainda.</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {(lista.data ?? []).map((nf: any) => (
                <li key={nf.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                  <span className="truncate flex-1">{nf.arquivo_nome ?? nf.arquivo_url}</span>
                  <Badge variant={nf.status === 'sucesso' ? 'default' : nf.status === 'erro' ? 'destructive' : 'secondary'} className="text-xs">
                    {nf.status === 'erro' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {nf.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
