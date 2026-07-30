import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useResumosExecutivos } from '@/hooks/useResumosExecutivos';
import { FileText, Sparkles, Loader2, Mail } from 'lucide-react';

export function ResumosExecutivosTab() {
  const { lista, gerarAgora } = useResumosExecutivos();
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Resumos Executivos Semanais (IA)
          </CardTitle>
          <Button size="sm" onClick={() => gerarAgora.mutate(undefined)} disabled={gerarAgora.isPending}>
            {gerarAgora.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar agora
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {lista.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (lista.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum resumo gerado ainda.</p>
        ) : (
          (lista.data ?? []).map((r) => (
            <div key={r.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{r.semana_inicio} → {r.semana_fim}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.enviado_em && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" /> {r.destinatarios.length} destinatário(s)
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setAberto(aberto === r.id ? null : r.id)}>
                    {aberto === r.id ? 'Fechar' : 'Ver resumo'}
                  </Button>
                </div>
              </div>
              {aberto === r.id && (
                <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded border max-h-96 overflow-y-auto font-sans">
                  {r.resumo_md}
                </pre>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
