import { useQuery, useMutation } from '@tanstack/react-query';
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
        .lt('data', threeDaysAgo.toISOString())
        .returns<any[]>();

      const pendentesDaEmpresa = pendentes?.filter(p => p.contas_bancarias?.empresa_id === empresaId) || [];

      if (pendentesDaEmpresa.length > 0) {
        await supabase.from('alertas').insert({
          empresa_id: empresaId,
          tipo: 'pendencia_conciliacao',
          prioridade: 'media',
          titulo: 'Pendências de Conciliação Antigas',
          mensagem: `Existem ${pendentesDaEmpresa.length} transações bancárias pendentes de conciliação há mais de 3 dias.`,
          status: 'pendente',
          metadata: { count: pendentesDaEmpresa.length }
        } as any);
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
