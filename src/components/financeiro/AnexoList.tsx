import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, FileText, Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { mustSucceed } from '@/lib/supabase-write';
import { logger } from '@/lib/logger';
import { caminhoNoStorage, BUCKET_FINANCEIRO as BUCKET } from '@/lib/storage-path';

interface AnexoListProps {
  entidadeId: string;
  entidadeTipo: 'contas_pagar' | 'contas_receber' | 'movimentacoes';
  readonly?: boolean;
}

export function AnexoList({ entidadeId, entidadeTipo, readonly = false }: AnexoListProps) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: anexos = [], isLoading } = useQuery({
    queryKey: ['anexos', entidadeTipo, entidadeId],
    queryFn: async () => {
      if (!entidadeId) return [];
      const { data, error } = await supabase
        .from('anexos_financeiros')
        .select('*')
        .eq('entidade_id', entidadeId)
        .eq('entidade_tipo', entidadeTipo);

      if (error) throw error;
      return data || [];
    },
    enabled: !!entidadeId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${entidadeTipo}/${entidadeId}/${fileName}`;

        // 1. Upload to Storage (Private bucket)
        const { error: uploadError } = await supabase.storage
          .from('financeiro')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Signed URL (or public if bucket is public, but we prefer private)
        const {
          data: { publicUrl },
        } = supabase.storage.from('financeiro').getPublicUrl(filePath);

        // 3. Save to Database
        try {
          await mustSucceed(
            supabase.from('anexos_financeiros').insert({
              entidade_id: entidadeId,
              entidade_tipo: entidadeTipo,
              nome_arquivo: file.name,
              mime_type: file.type,
              tamanho_bytes: file.size,
              url: publicUrl,
              url_publica: publicUrl,
            }),
            'registrar o anexo'
          );
        } catch (erroBanco) {
          // O arquivo já está no bucket. Sem a linha, ele fica invisível na
          // tela e ninguém mais o remove — mas segue baixável por quem tiver a
          // URL. Desfazer o upload é o que mantém as duas pontas coerentes.
          const { error: erroLimpeza } = await supabase.storage.from(BUCKET).remove([filePath]);
          if (erroLimpeza) {
            logger.error('Falha ao remover arquivo órfão do storage', {
              filePath,
              erro: erroLimpeza.message,
            });
          }
          throw erroBanco;
        }
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anexos', entidadeTipo, entidadeId] });
      toast.success('Arquivo anexado com sucesso');
    },
    onError: (e) => {
      toast.error('Falha no upload: ' + e.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (anexo: { id: string; url?: string | null; nome_arquivo?: string }) => {
      const caminho = caminhoNoStorage(anexo.url);

      // Storage primeiro, de propósito. Na ordem inversa, a falha do storage
      // deixaria um arquivo sem nenhuma linha apontando para ele: invisível,
      // permanente e ainda baixável por quem tiver a URL. Nesta ordem, a falha
      // do banco deixa uma linha sem arquivo — visível e reprocessável, já que
      // remover um objeto que não existe mais não é erro no Storage.
      if (caminho) {
        const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([caminho]);
        // Antes este erro era só `console.error` e a linha era apagada mesmo
        // assim. O arquivo ficava órfão no bucket, sem ponteiro para removê-lo.
        if (erroStorage) {
          throw new Error(`Falha ao remover o arquivo do storage: ${erroStorage.message}`);
        }
      }

      await mustSucceed(
        supabase.from('anexos_financeiros').delete().eq('id', anexo.id).select('id'),
        'remover o anexo',
        { exigirLinhas: true }
      );

      // Linha cuja URL não permite localizar o objeto: a remoção do registro
      // vale, mas o usuário precisa saber que o arquivo pode ter ficado lá.
      if (!caminho) {
        toast.warning(
          `Registro removido, mas o arquivo de "${anexo.nome_arquivo ?? 'anexo'}" pode ter permanecido no armazenamento.`
        );
      }
    },
    onError: (e) => {
      toast.error('Falha ao remover anexo: ' + e.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anexos', entidadeTipo, entidadeId] });
      toast.success('Anexo removido');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 10MB)');
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Carregando anexos...
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Paperclip className="h-3 w-3" />
          Comprovantes & Anexos ({anexos.length})
        </h4>
        {!readonly && (
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1.5"
              asChild
              disabled={uploading}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Anexar Arquivo
              </label>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {anexos.length === 0 && !uploading && (
          <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-dashed border-white/5">
            Nenhum comprovante anexado.
          </p>
        )}

        {anexos.map((anexo) => (
          <div
            key={anexo.id}
            className="group flex items-center justify-between p-2.5 rounded-xl bg-card/5 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{anexo.nome_arquivo}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(anexo.tamanho_bytes)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href={anexo.url_publica} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              {!readonly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(anexo)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {uploading && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 animate-pulse">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <p className="text-xs font-bold text-primary">Subindo arquivo...</p>
          </div>
        )}
      </div>
    </div>
  );
}
