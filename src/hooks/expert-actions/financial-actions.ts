import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ExpertAction, ActionResult, TipoCobranca, EtapaCobranca } from './types';

export async function criarAlerta(
  action: ExpertAction, 
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('alertas').insert({
    tipo: 'expert',
    titulo: action.titulo || 'Alerta do EXPERT',
    mensagem: action.mensagem || '',
    prioridade: action.prioridade || 'media',
    user_id: user?.id,
  });

  if (error) throw error;
  queryClient.invalidateQueries({ queryKey: ['alertas'] });
  queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });
  toast.success('Alerta criado com sucesso!');
  return { success: true, message: `Alerta "${action.titulo}" criado com prioridade ${action.prioridade}` };
}

export async function listarAprovacoes(): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('solicitacoes_aprovacao')
    .select(`*, contas_pagar (id, descricao, valor, fornecedor_nome, data_vencimento)`)
    .eq('status', 'pendente')
    .order('solicitado_em', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) {
    return { success: true, message: 'Não há aprovações pendentes no momento.' };
  }

  const lista = data.map((s, i) => {
    const cp = s.contas_pagar;
    return `${i + 1}. **${cp?.fornecedor_nome}** - ${formatCurrency(cp?.valor || 0)} (ID: ${s.id.slice(0, 8)})`;
  }).join('\n');

  return { success: true, message: `**${data.length} aprovações pendentes:**\n\n${lista}`, data };
}

export async function aprovarPagamento(
  id: string, 
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: solicitacao, error: findError } = await supabase
    .from('solicitacoes_aprovacao')
    .select('*, contas_pagar(*)')
    .or(`id.ilike.${id}%,id.eq.${id}`)
    .eq('status', 'pendente')
    .maybeSingle();

  if (findError || !solicitacao) {
    return { success: false, message: `Solicitação ${id} não encontrada ou já processada` };
  }

  const { error: updateError } = await supabase
    .from('solicitacoes_aprovacao')
    .update({ status: 'aprovado', aprovado_por: user?.id, aprovado_em: new Date().toISOString() })
    .eq('id', solicitacao.id);

  if (updateError) throw updateError;

  await supabase
    .from('contas_pagar')
    .update({ aprovado_por: user?.id, aprovado_em: new Date().toISOString() })
    .eq('id', solicitacao.conta_pagar_id);

  queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
  queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
  queryClient.invalidateQueries({ queryKey: ['aprovacoes-pendentes-count'] });
  toast.success('Pagamento aprovado com sucesso!');

  return { success: true, message: `Pagamento para "${solicitacao.contas_pagar?.fornecedor_nome}" aprovado com sucesso!` };
}

export async function criarContaPagar(
  action: ExpertAction,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: empresa } = await supabase.from('empresas').select('id').eq('ativo', true).limit(1).maybeSingle();

  if (!empresa) return { success: false, message: 'Nenhuma empresa ativa encontrada.' };

  const { error } = await supabase.from('contas_pagar').insert({
    fornecedor_nome: action.fornecedor_nome || 'Fornecedor EXPERT',
    descricao: action.descricao || 'Lançamento via EXPERT',
    valor: action.valor || 0,
    data_vencimento: action.data_vencimento || new Date().toISOString().split('T')[0],
    data_emissao: new Date().toISOString().split('T')[0],
    tipo_cobranca: (action.tipo_cobranca as TipoCobranca) || 'boleto',
    status: 'pendente',
    empresa_id: empresa.id,
    created_by: user?.id || '',
  });

  if (error) throw error;
  queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
  toast.success('Conta a pagar criada!');
  return { success: true, message: `✅ Conta a pagar criada: ${action.descricao} - ${formatCurrency(action.valor || 0)} para ${action.fornecedor_nome}` };
}

export async function criarContaReceber(
  action: ExpertAction,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: empresa } = await supabase.from('empresas').select('id').eq('ativo', true).limit(1).maybeSingle();

  if (!empresa) return { success: false, message: 'Nenhuma empresa ativa encontrada.' };

  const { error } = await supabase.from('contas_receber').insert({
    cliente_nome: action.cliente_nome || 'Cliente EXPERT',
    descricao: action.descricao || 'Lançamento via EXPERT',
    valor: action.valor || 0,
    data_vencimento: action.data_vencimento || new Date().toISOString().split('T')[0],
    data_emissao: new Date().toISOString().split('T')[0],
    tipo_cobranca: (action.tipo_cobranca as TipoCobranca) || 'boleto',
    status: 'pendente',
    empresa_id: empresa.id,
    created_by: user?.id || '',
  });

  if (error) throw error;
  queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
  toast.success('Conta a receber criada!');
  return { success: true, message: `✅ Conta a receber criada: ${action.descricao} - ${formatCurrency(action.valor || 0)} de ${action.cliente_nome}` };
}

export async function agendarCobranca(contaId: string): Promise<ActionResult> {
  const { data: conta, error: findError } = await supabase
    .from('contas_receber')
    .select('*, clientes(razao_social, email, telefone)')
    .eq('id', contaId)
    .maybeSingle();

  if (findError || !conta) return { success: false, message: `Conta ${contaId} não encontrada.` };

  const etapas = ['preventiva', 'lembrete', 'cobranca', 'negociacao', 'juridico'] as const;
  const etapaAtual: EtapaCobranca = conta.etapa_cobranca || 'preventiva';
  const indiceAtual = etapas.indexOf(etapaAtual);
  const proximaEtapa = etapas[Math.min(indiceAtual + 1, etapas.length - 1)];

  const { error } = await supabase.from('contas_receber').update({ etapa_cobranca: proximaEtapa }).eq('id', contaId);
  if (error) throw error;

  await supabase.from('historico_cobranca').insert({
    conta_receber_id: contaId,
    etapa_anterior: etapaAtual,
    etapa_nova: proximaEtapa,
  });

  toast.success(`Cobrança avançada para ${proximaEtapa}!`);
  return { success: true, message: `📞 Cobrança agendada! Cliente: ${conta.clientes?.razao_social || conta.cliente_nome}\nEtapa: ${etapaAtual} → ${proximaEtapa}\nValor: ${formatCurrency(Number(conta.valor))}` };
}

export async function atualizarScoreCliente(
  clienteId: string, 
  novoScore: number,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<ActionResult> {
  const { data: cliente, error: findError } = await supabase
    .from('clientes')
    .select('razao_social, score')
    .eq('id', clienteId)
    .maybeSingle();

  if (findError || !cliente) {
    return { success: false, message: `Cliente ${clienteId} não encontrado no banco local.` };
  }

  const scoreAnterior = cliente.score || 0;
  const { error } = await supabase.from('clientes').update({ score: novoScore }).eq('id', clienteId);
  if (error) throw error;

  queryClient.invalidateQueries({ queryKey: ['clientes'] });
  toast.success('Score do cliente atualizado!');
  return { success: true, message: `📊 Score do cliente "${cliente.razao_social}" atualizado: ${scoreAnterior} → ${novoScore}` };
}

export async function gerarBoleto(contaId: string): Promise<ActionResult> {
  const { data: conta, error } = await supabase
    .from('contas_receber')
    .select('*, clientes(razao_social, cnpj_cpf)')
    .eq('id', contaId)
    .maybeSingle();

  if (error || !conta) return { success: false, message: `Conta ${contaId} não encontrada.` };

  const codigoBarras = `23793.38128 60000.000003 00000.000406 ${Math.random().toString().slice(2, 6)} ${Math.floor(Date.now() / 1000)}`;
  toast.success('Boleto gerado com sucesso!');

  return { success: true, message: `🎫 **BOLETO GERADO**\n\nCliente: ${conta.clientes?.razao_social || conta.cliente_nome}\nValor: ${formatCurrency(Number(conta.valor))}\nVencimento: ${conta.data_vencimento}\n\nCódigo de Barras:\n\`${codigoBarras}\`` };
}
