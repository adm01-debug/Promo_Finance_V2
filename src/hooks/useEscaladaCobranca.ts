import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';

export interface EtapaEscalada {
  id: string;
  ordem: number;
  nome: string;
  diasAtraso: number;
  acao: 'email' | 'whatsapp' | 'sms' | 'ligacao' | 'carta' | 'protesto' | 'juridico';
  template: string;
  ativo: boolean;
  enviarAutomaticamente: boolean;
}

export interface ContaEmEscalada {
  id: string;
  clienteNome: string;
  clienteEmail: string | null;
  clienteTelefone: string | null;
  valor: number;
  dataVencimento: string;
  diasAtraso: number;
  etapaAtual: string;
  etapaOrdem: number;
  ultimaAcao: string | null;
  proximaAcao: EtapaEscalada | null;
}

const ETAPAS_ESCALADA: EtapaEscalada[] = [
  { id: '1', ordem: 1, nome: 'Lembrete Amigável', diasAtraso: 1, acao: 'email', template: 'Olá {{cliente}}! Notamos que sua fatura de R$ {{valor}} venceu ontem. Caso já tenha efetuado o pagamento, desconsidere esta mensagem.', ativo: true, enviarAutomaticamente: true },
  { id: '2', ordem: 2, nome: 'Primeira Cobrança', diasAtraso: 5, acao: 'whatsapp', template: 'Prezado(a) {{cliente}}, sua fatura de R$ {{valor}} está em atraso há {{dias}} dias. Entre em contato para regularizar.', ativo: true, enviarAutomaticamente: true },
  { id: '3', ordem: 3, nome: 'Cobrança Urgente', diasAtraso: 15, acao: 'ligacao', template: 'URGENTE: Fatura de {{cliente}} - R$ {{valor}} - {{dias}} dias em atraso. Realizar ligação de cobrança.', ativo: true, enviarAutomaticamente: false },
  { id: '4', ordem: 4, nome: 'Notificação Formal', diasAtraso: 30, acao: 'carta', template: 'Notificação extrajudicial de cobrança para {{cliente}}. Valor: R$ {{valor}}. Prazo: 5 dias úteis.', ativo: true, enviarAutomaticamente: false },
  { id: '5', ordem: 5, nome: 'Negativação', diasAtraso: 45, acao: 'protesto', template: 'Iniciar processo de negativação para {{cliente}}. CPF/CNPJ: {{documento}}. Valor: R$ {{valor}}.', ativo: true, enviarAutomaticamente: false },
  { id: '6', ordem: 6, nome: 'Cobrança Judicial', diasAtraso: 90, acao: 'juridico', template: 'Encaminhar para departamento jurídico: {{cliente}}. Valor total: R$ {{valor}}. Dias em atraso: {{dias}}.', ativo: true, enviarAutomaticamente: false },
];

export function useEscaladaCobranca() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar contas vencidas com informações de escalada
  const { data: contasEmEscalada = [], isLoading } = useQuery({
    queryKey: ['escalada-cobranca'],
    queryFn: async () => {
      const { data: contasVencidas, error } = await supabase
        .from('contas_receber')
        .select(`
          id,
          cliente_nome,
          cliente_id,
          valor,
          data_vencimento,
          etapa_cobranca,
          clientes (
            email,
            telefone,
            cnpj_cpf
          )
        `)
        .in('status', ['pendente', 'vencido', 'parcial'])
        .lt('data_vencimento', new Date().toISOString().split('T')[0])
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      const contasProcessadas: ContaEmEscalada[] = (contasVencidas || []).map((conta: any) => {
        const diasAtraso = differenceInDays(new Date(), new Date(conta.data_vencimento));
        const etapaAtualIndex = ETAPAS_ESCALADA.findIndex(e => 
          conta.etapa_cobranca === e.nome.toLowerCase().replace(/\s/g, '_')
        );
        const etapaAtual = etapaAtualIndex >= 0 ? ETAPAS_ESCALADA[etapaAtualIndex] : null;
        
        // Determinar próxima etapa baseada nos dias de atraso
        const proximaEtapa = ETAPAS_ESCALADA.find(e => 
          e.diasAtraso > (etapaAtual?.diasAtraso || 0) && diasAtraso >= e.diasAtraso && e.ativo
        ) || ETAPAS_ESCALADA.find(e => diasAtraso >= e.diasAtraso && e.ativo);

        return {
          id: conta.id,
          clienteNome: conta.cliente_nome,
          clienteEmail: conta.clientes?.email || null,
          clienteTelefone: conta.clientes?.telefone || null,
          valor: conta.valor,
          dataVencimento: conta.data_vencimento,
          diasAtraso,
          etapaAtual: etapaAtual?.nome || 'Pendente',
          etapaOrdem: etapaAtual?.ordem || 0,
          ultimaAcao: null,
          proximaAcao: proximaEtapa || null,
        };
      });

      return contasProcessadas.sort((a, b) => b.diasAtraso - a.diasAtraso);
    },
    enabled: !!user,
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  // Executar ação de escalada
  const executarAcaoMutation = useMutation({
    mutationFn: async ({ 
      contaId, 
      etapa, 
      dadosConta 
    }: { 
      contaId: string; 
      etapa: EtapaEscalada;
      dadosConta: ContaEmEscalada;
    }) => {
      // Substituir variáveis no template
      const mensagem = etapa.template
        .replace(/{{cliente}}/g, dadosConta.clienteNome)
        .replace(/{{valor}}/g, dadosConta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        .replace(/{{dias}}/g, dadosConta.diasAtraso.toString())
        .replace(/{{data_vencimento}}/g, format(new Date(dadosConta.dataVencimento), 'dd/MM/yyyy'));

      // Registrar ação no histórico
      const { error: historicoError } = await supabase
        .from('historico_cobranca')
        .insert({
          conta_receber_id: contaId,
          etapa_anterior: dadosConta.etapaAtual.toLowerCase().replace(/\s/g, '_'),
          etapa_nova: etapa.nome.toLowerCase().replace(/\s/g, '_'),
          observacoes: mensagem,
          created_by: user?.id,
        });

      if (historicoError) throw historicoError;

      // Atualizar etapa da conta
      await supabase
        .from('contas_receber')
        .update({ 
          etapa_cobranca: etapa.nome.toLowerCase().replace(/\s/g, '_') as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId);

      // Executar ação específica
      switch (etapa.acao) {
        case 'email':
          if (dadosConta.clienteEmail) {
            await supabase.functions.invoke('enviar-alerta-email', {
              body: {
                tipo: 'inadimplencia',
                destinatario: dadosConta.clienteEmail,
                dados: {
                  titulo: `Cobrança: ${etapa.nome}`,
                  mensagem,
                  valor: dadosConta.valor,
                  dataVencimento: format(new Date(dadosConta.dataVencimento), 'dd/MM/yyyy'),
                }
              }
            });
          }
          break;

        case 'whatsapp':
          if (dadosConta.clienteTelefone) {
            const telefone = dadosConta.clienteTelefone.replace(/\D/g, '');
            const telefoneWhatsapp = telefone.startsWith('55') ? telefone : `55${telefone}`;
            const mensagemEncoded = encodeURIComponent(mensagem);
            window.open(`https://wa.me/${telefoneWhatsapp}?text=${mensagemEncoded}`, '_blank');
            
            await supabase.from('historico_cobranca_whatsapp').insert({
              conta_receber_id: contaId,
              telefone: telefoneWhatsapp,
              mensagem,
              status: 'enviado',
              enviado_em: new Date().toISOString(),
              created_by: user?.id,
            });
          }
          break;
      }

      return { success: true, etapa: etapa.nome };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escalada-cobranca'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success(`Ação "${data.etapa}" executada com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro na escalada:', error);
      toast.error('Erro ao executar ação de cobrança');
    },
  });

  // Executar escalada automática em lote
  const executarEscaladaAutomatica = useMutation({
    mutationFn: async () => {
      const contasParaEscalar = contasEmEscalada.filter(c => 
        c.proximaAcao && 
        c.proximaAcao.enviarAutomaticamente &&
        c.proximaAcao.ordem > c.etapaOrdem
      );

      let sucessos = 0;
      let erros = 0;

      for (const conta of contasParaEscalar) {
        try {
          if (conta.proximaAcao) {
            await executarAcaoMutation.mutateAsync({
              contaId: conta.id,
              etapa: conta.proximaAcao,
              dadosConta: conta,
            });
            sucessos++;
          }
        } catch {
          erros++;
        }
      }

      return { sucessos, erros, total: contasParaEscalar.length };
    },
    onSuccess: (data) => {
      toast.success(`Escalada automática: ${data.sucessos}/${data.total} ações executadas`);
    },
  });

  // Estatísticas
  const estatisticas = {
    totalVencidas: contasEmEscalada.length,
    valorTotalVencido: contasEmEscalada.reduce((sum, c) => sum + c.valor, 0),
    porEtapa: ETAPAS_ESCALADA.map(etapa => ({
      ...etapa,
      quantidade: contasEmEscalada.filter(c => c.etapaAtual === etapa.nome).length,
      valor: contasEmEscalada.filter(c => c.etapaAtual === etapa.nome).reduce((sum, c) => sum + c.valor, 0),
    })),
    pendentesAutomatico: contasEmEscalada.filter(c => 
      c.proximaAcao?.enviarAutomaticamente && 
      c.proximaAcao.ordem > c.etapaOrdem
    ).length,
  };

  return {
    contasEmEscalada,
    etapasEscalada: ETAPAS_ESCALADA,
    estatisticas,
    isLoading,
    executarAcao: executarAcaoMutation.mutate,
    executarEscaladaAutomatica: executarEscaladaAutomatica.mutate,
    isExecutando: executarAcaoMutation.isPending || executarEscaladaAutomatica.isPending,
  };
}
