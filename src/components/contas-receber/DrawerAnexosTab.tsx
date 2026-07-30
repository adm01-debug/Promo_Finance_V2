import { Paperclip, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/formatters';

interface Anexo {
  id: string;
  nome_arquivo: string;
  created_at: string;
  url?: string | null;
}

export function DrawerAnexosTab({ anexos }: { anexos: Anexo[] }) {
  if (anexos.length === 0) {
    return (
      <div className="text-center py-8">
        <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum anexo encontrado</p>
      </div>
    );
  }

  return (
    <>
      {anexos.map((a) => (
        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{a.nome_arquivo}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
          </div>
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon-sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
            </a>
          )}
        </div>
      ))}
    </>
  );
}
