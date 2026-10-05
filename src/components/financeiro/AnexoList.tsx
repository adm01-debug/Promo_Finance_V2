import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, FileText, Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { validarMagicBytes } from '@/lib/magic-bytes';
import { mustSucceed } from '@/lib/supabase-write';
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
        // O upload vai pela edge function `upload-anexo`: ela revalida os
        // magic bytes no servidor (a checagem local é só UX — quem chama o
        // HTTP do Storage direto pula o front), grava via service_role e já
        // registra a linha em `anexos_financeiros`.
        const form = new FormData();
        form.append('arquivo', file);
        form.append('entidade_tipo', entidadeTipo);
        form.append('entidade_id', entidadeId);
        const { error } = await supabase.functions.invoke('upload-anexo', { body: form });
        if (error) throw error;
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
    mutationFn: async (anexo: {
      id: string;
      url?: string | null;
      storage_path?: string | null;
      nome_arquivo?: string;
    }) => {
      // storage_path é o locator canônico (anexos novos, bucket privado);
      // a URL parseada cobre linhas legadas.
      const caminho = anexo.storage_path ?? caminhoNoStorage(anexo.url);

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

  // Bucket privado: `url_publica` não é link HTTP — o download gera uma
  // URL assinada curta na hora. Linhas legadas com URL pública antiga
  // resolvem o caminho por caminhoNoStorage da mesma forma.
  const baixarAnexo = async (anexo: {
    url?: string | null;
    url_publica?: string | null;
    storage_path?: string | null;
  }) => {
    const caminho = anexo.storage_path ?? caminhoNoStorage(anexo.url ?? anexo.url_publica);
    if (!caminho) {
      toast.error('Não foi possível localizar o arquivo do anexo');
      return;
    }
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60);
    if (error || !data?.signedUrl) {
      toast.error('Falha ao gerar link de download: ' + (error?.message ?? 'sem URL assinada'));
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 10MB)');
        return;
      }
      const erroConteudo = await validarMagicBytes(file);
      if (erroConteudo) {
        toast.error(erroConteudo);
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
                  {formatSize(anexo.tamanho_bytes ?? 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => baixarAnexo(anexo)}
              >
                <Download className="h-4 w-4" />
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
