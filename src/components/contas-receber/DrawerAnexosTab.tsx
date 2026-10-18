import { Paperclip, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { caminhoNoStorage, BUCKET_FINANCEIRO as BUCKET } from '@/lib/storage-path';
import { toast } from 'sonner';

interface Anexo {
  id: string;
  nome_arquivo: string;
  created_at: string;
  url?: string | null;
  url_publica?: string | null;
  storage_path?: string | null;
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

  // Bucket privado: `url`/`url_publica` gravados pela edge são locators
  // internos, não links HTTP — o clique precisa gerar signed URL.
  const abrir = async (a: Anexo) => {
    const caminho =
      a.storage_path ??
      ((a.url ?? a.url_publica) ? caminhoNoStorage(a.url ?? a.url_publica) : null);
    if (!caminho) {
      toast.error('Anexo sem caminho de storage válido.');
      return;
    }
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60);
      if (error || !data?.signedUrl) {
        toast.error('Não foi possível abrir o anexo.');
        return;
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Não foi possível abrir o anexo.');
    }
  };

  return (
    <>
      {anexos.map((a) => (
        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{a.nome_arquivo}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
          </div>
          {(a.url || a.url_publica || a.storage_path) && (
            <Button variant="ghost" size="icon-sm" onClick={() => void abrir(a)}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </>
  );
}
