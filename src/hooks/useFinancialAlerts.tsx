import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, FileWarning } from 'lucide-react';
import { useAuth } from './useAuth';

export function useFinancialAlerts() {
  const { currentEmpresaId } = useAuth();

  useEffect(() => {
    if (!currentEmpresaId) return;

    // Real-time subscription for write-off failures
    const channelBaixa = supabase
      .channel('baixa-failures')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'logs_baixa_automatica',
          filter: `empresa_id=eq.${currentEmpresaId}`
        },
        (payload) => {
          const log = payload.new;
          if (log.falha_count > 0) {
            toast.error(`Falha na Baixa Automática`, {
              description: `${log.falha_count} registros falharam no arquivo ${log.arquivo_nome}. Verifique o log de conciliação.`,
              icon: <FileWarning className="h-5 w-5 text-destructive" />,
              duration: 8000,
              action: {
                label: 'Ver Log',
                onClick: () => window.location.href = '/conciliacao'
              }
            });
          }
        }
      )
      .subscribe();

    // Real-time subscription for billing rule failures
    const channelRegua = supabase
      .channel('regua-failures')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execucoes_regua_cobranca',
          filter: `empresa_id=eq.${currentEmpresaId}`
        },
        (payload) => {
          const exec = payload.new;
          if (exec.status === 'erro' || exec.status === 'falha') {
            toast.warning(`Falha na Régua de Cobrança`, {
              description: `Etapa: ${exec.etapa} - ${exec.mensagem_erro || 'Erro desconhecido'}. Recomendação: Verifique as configurações de SMTP/Asaas.`,
              icon: <AlertCircle className="h-5 w-5 text-warning" />,
              duration: 8000,
              action: {
                label: 'Configurar',
                onClick: () => window.location.href = '/cobrancas'
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelBaixa);
      supabase.removeChannel(channelRegua);
    };
  }, [currentEmpresaId]);
}
