import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useConciliacaoAudit(empresaId?: string) {
  const runAudit = useMutation({
    mutationFn: async () => {
      if (!empresaId) return;

      // 1. Buscar transações pendentes há mais de 3 dias
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: pendentes } = await supabase
        .from('transacoes_bancarias')
        .select('*, contas_bancarias(empresa_id)')
        .eq('conciliada', false)
        .lt('data', threeDaysAgo.toISOString());

      const pendentesDaEmpresa = (pendentes ?? []).filter((p) => {
        const cb = (p as { contas_bancarias?: { empresa_id?: string } | { empresa_id?: string }[] | null }).contas_bancarias;
        const empresa = Array.isArray(cb) ? cb[0]?.empresa_id : cb?.empresa_id;
        return empresa === empresaId;
      });




      if (pendentesDaEmpresa.length > 0) {
        // alertas (migration 20260518180000) não tem status/metadata — enviar
        // esses campos causaria PGRST204 silencioso (o erro era ignorado).
        const { error: alertaError } = await supabase.from('alertas').insert({
          empresa_id: empresaId,
          tipo: 'pendencia_conciliacao',
          prioridade: 'media',
          titulo: 'Pendências de Conciliação Antigas',
          mensagem: `Existem ${pendentesDaEmpresa.length} transações bancárias pendentes de conciliação há mais de 3 dias.`,
        });
        if (alertaError) console.error('[useConciliacaoAudit] Falha ao criar alerta:', alertaError.message);
      }

      // 2. Buscar divergências de saldo registradas
      const { data: divergencias } = await supabase
        .from('divergencias_conciliacao')
        .select('*')
        .eq('status', 'pendente');

      if (divergencias && divergencias.length > 0) {
        // Alertas já são criados na importação, mas podemos reforçar aqui se necessário
      }

      return { pendentes: pendentesDaEmpresa.length, divergencias: divergencias?.length || 0 };
    },
    onSuccess: () => {
      toast.success('Auditoria de conciliação concluída');
    }
  });

  return { runAudit };
}
