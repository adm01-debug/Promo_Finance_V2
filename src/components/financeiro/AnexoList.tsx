import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Download, FileText, Loader2, Trash2, Eye, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Anexo {
  id: string;
  nome_arquivo: string;
  url_publica: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
}

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
        const { data: { publicUrl } } = supabase.storage
          .from('financeiro')
          .getPublicUrl(filePath);

        // 3. Save to Database
        const { error: dbError } = await supabase
          .from('anexos_financeiros')
          .insert({
            entidade_id: entidadeId,
            entidade_tipo: entidadeTipo,
            nome_arquivo: file.name,
            tipo_arquivo: file.type,
            tamanho_bytes: file.size,
            storage_path: filePath,
            url_publica: publicUrl,
          });

        if (dbError) throw dbError;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anexos', entidadeTipo, entidadeId] });
      toast.success('Arquivo anexado com sucesso');
    },
    onError: (e: any) => {
      toast.error('Falha no upload: ' + e.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (anexo: any) => {
      // 1. Remove from Storage
      const { error: storageError } = await supabase.storage
        .from('financeiro')
        .remove([anexo.storage_path]);
      
      if (storageError) console.error('Error removing from storage:', storageError);

      // 2. Remove from Database
      const { error: dbError } = await supabase
        .from('anexos_financeiros')
        .delete()
        .eq('id', anexo.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anexos', entidadeTipo, entidadeId] });
      toast.success('Anexo removido');
    }
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

  if (isLoading) return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Carregando anexos...</div>;

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
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
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
                <p className="text-[10px] text-muted-foreground">{formatSize(anexo.tamanho_bytes)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
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
