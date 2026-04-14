import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import type { ActionResult } from './types';

export async function consultarSaldos(): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('contas_bancarias')
    .select('banco, agencia, conta, saldo_atual, saldo_disponivel, tipo_conta')
    .eq('ativo', true)
    .order('saldo_atual', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return { success: false, message: 'Nenhuma conta bancária encontrada.' };

  const saldoTotal = data.reduce((sum, c) => sum + Number(c.saldo_atual), 0);
  const saldoDisponivel = data.reduce((sum, c) => sum + Number(c.saldo_disponivel), 0);

  let mensagem = `💰 **SALDOS BANCÁRIOS**\n\n`;
  mensagem += `**Saldo Total:** ${formatCurrency(saldoTotal)}\n`;
  mensagem += `**Saldo Disponível:** ${formatCurrency(saldoDisponivel)}\n\n`;
  mensagem += `**Detalhamento por conta:**\n`;
  
  data.forEach(c => {
    mensagem += `• ${c.banco} (${c.tipo_conta}) - Ag: ${c.agencia} / CC: ${c.conta}\n`;
    mensagem += `  Saldo: ${formatCurrency(Number(c.saldo_atual))} | Disponível: ${formatCurrency(Number(c.saldo_disponivel))}\n`;
  });

  return { success: true, message: mensagem, data };
}

export async function consultarCliente(nome: string): Promise<ActionResult> {
  const { data: contasReceber, error } = await supabase
    .from('contas_receber')
    .select('cliente_id, cliente_nome, valor, status, data_vencimento')
    .ilike('cliente_nome', `%${nome}%`);

  if (error) throw error;

  const clienteMap = new Map<string, { nome: string; contas: typeof contasReceber }>();
  (contasReceber || []).forEach(c => {
    const key = c.cliente_id || c.cliente_nome;
    const existing = clienteMap.get(key);
    if (existing) { existing.contas!.push(c); }
    else { clienteMap.set(key, { nome: c.cliente_nome || 'Desconhecido', contas: [c] }); }
  });

  if (clienteMap.size === 0) return { success: false, message: `Nenhum cliente encontrado com "${nome}".` };

  let mensagem = `👤 **CLIENTES ENCONTRADOS:**\n\n`;
  for (const [, { nome: clienteNome, contas }] of clienteMap) {
    const totalReceber = (contas || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + Number(c.valor), 0);
    const totalVencido = (contas || []).filter(c => c.status === 'vencido').reduce((sum, c) => sum + Number(c.valor), 0);
    mensagem += `**${clienteNome}**\n`;
    mensagem += `• Em aberto: ${formatCurrency(totalReceber)} | Vencido: ${formatCurrency(totalVencido)}\n\n`;
  }

  return { success: true, message: mensagem };
}

export async function consultarFornecedor(nome: string): Promise<ActionResult> {
  const { data: contasPagar, error } = await supabase
    .from('contas_pagar')
    .select('fornecedor_id, fornecedor_nome, valor, status, data_vencimento')
    .ilike('fornecedor_nome', `%${nome}%`);

  if (error) throw error;

  const fornecedorMap = new Map<string, { nome: string; contas: typeof contasPagar }>();
  (contasPagar || []).forEach(c => {
    const key = c.fornecedor_id || c.fornecedor_nome;
    const existing = fornecedorMap.get(key);
    if (existing) { existing.contas!.push(c); }
    else { fornecedorMap.set(key, { nome: c.fornecedor_nome || 'Desconhecido', contas: [c] }); }
  });

  if (fornecedorMap.size === 0) return { success: false, message: `Nenhum fornecedor encontrado com "${nome}".` };

  let mensagem = `🏢 **FORNECEDORES ENCONTRADOS:**\n\n`;
  for (const [, { nome: fornecedorNome, contas }] of fornecedorMap) {
    const totalPagar = (contas || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + Number(c.valor), 0);
    const totalVencido = (contas || []).filter(c => c.status === 'vencido').reduce((sum, c) => sum + Number(c.valor), 0);
    mensagem += `**${fornecedorNome}**\n`;
    mensagem += `• A pagar: ${formatCurrency(totalPagar)} | Vencido: ${formatCurrency(totalVencido)}\n\n`;
  }

  return { success: true, message: mensagem };
}

export async function analisarFluxo(periodo: string): Promise<ActionResult> {
  const dias = parseInt(periodo) || 30;
  const hoje = new Date();
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + dias);

  const { data: contasPagar } = await supabase
    .from('contas_pagar').select('data_vencimento, valor').eq('status', 'pendente')
    .gte('data_vencimento', hoje.toISOString().split('T')[0])
    .lte('data_vencimento', fim.toISOString().split('T')[0]);

  const { data: contasReceber } = await supabase
    .from('contas_receber').select('data_vencimento, valor').in('status', ['pendente'])
    .gte('data_vencimento', hoje.toISOString().split('T')[0])
    .lte('data_vencimento', fim.toISOString().split('T')[0]);

  const { data: saldos } = await supabase.from('contas_bancarias').select('saldo_atual').eq('ativo', true);

  const saldoAtual = saldos?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) || 0;
  const totalReceitas = contasReceber?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
  const totalDespesas = contasPagar?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
  const saldoProjetado = saldoAtual + totalReceitas - totalDespesas;

  const semanas: { semana: number; receitas: number; despesas: number }[] = [];
  for (let i = 0; i < Math.ceil(dias / 7); i++) {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(inicioSemana.getDate() + (i * 7));
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const receitasSemana = contasReceber?.filter(c => {
      const d = new Date(c.data_vencimento);
      return d >= inicioSemana && d <= fimSemana;
    }).reduce((sum, c) => sum + Number(c.valor), 0) || 0;

    const despesasSemana = contasPagar?.filter(c => {
      const d = new Date(c.data_vencimento);
      return d >= inicioSemana && d <= fimSemana;
    }).reduce((sum, c) => sum + Number(c.valor), 0) || 0;

    semanas.push({ semana: i + 1, receitas: receitasSemana, despesas: despesasSemana });
  }

  let mensagem = `📊 **ANÁLISE DE FLUXO DE CAIXA (${dias} dias)**\n\n`;
  mensagem += `**Resumo Geral:**\n`;
  mensagem += `• Saldo Atual: ${formatCurrency(saldoAtual)}\n`;
  mensagem += `• Receitas Previstas: ${formatCurrency(totalReceitas)}\n`;
  mensagem += `• Despesas Previstas: ${formatCurrency(totalDespesas)}\n`;
  mensagem += `• Saldo Projetado: ${formatCurrency(saldoProjetado)}\n\n`;

  if (saldoProjetado < 0) {
    mensagem += `⚠️ **ALERTA:** Saldo negativo projetado! Considere antecipar recebimentos ou renegociar pagamentos.\n\n`;
  }

  mensagem += `**Detalhamento Semanal:**\n`;
  semanas.forEach(s => {
    const saldo = s.receitas - s.despesas;
    const emoji = saldo >= 0 ? '✅' : '⚠️';
    mensagem += `${emoji} Semana ${s.semana}: Receitas ${formatCurrency(s.receitas)} | Despesas ${formatCurrency(s.despesas)} | Saldo: ${formatCurrency(saldo)}\n`;
  });

  return { success: true, message: mensagem, data: { saldoAtual, totalReceitas, totalDespesas, saldoProjetado, semanas } };
}

export async function consultarVencimentos(periodo: string): Promise<ActionResult> {
  const dias = parseInt(periodo) || 7;
  const hoje = new Date().toISOString().split('T')[0];
  const fim = new Date();
  fim.setDate(fim.getDate() + dias);
  const fimStr = fim.toISOString().split('T')[0];

  const { data: pagar } = await supabase
    .from('contas_pagar').select('fornecedor_nome, descricao, valor, data_vencimento')
    .eq('status', 'pendente').gte('data_vencimento', hoje).lte('data_vencimento', fimStr).order('data_vencimento');

  const { data: receber } = await supabase
    .from('contas_receber').select('cliente_nome, descricao, valor, data_vencimento')
    .in('status', ['pendente']).gte('data_vencimento', hoje).lte('data_vencimento', fimStr).order('data_vencimento');

  let mensagem = `📅 **VENCIMENTOS NOS PRÓXIMOS ${dias} DIAS**\n\n`;

  if (pagar && pagar.length > 0) {
    const totalPagar = pagar.reduce((sum, c) => sum + Number(c.valor), 0);
    mensagem += `**Contas a Pagar:** ${pagar.length} títulos - ${formatCurrency(totalPagar)}\n`;
    pagar.slice(0, 5).forEach(c => {
      mensagem += `• ${c.data_vencimento}: ${c.fornecedor_nome} - ${formatCurrency(Number(c.valor))}\n`;
    });
    if (pagar.length > 5) mensagem += `  ... e mais ${pagar.length - 5} títulos\n`;
    mensagem += '\n';
  } else {
    mensagem += `**Contas a Pagar:** Nenhum vencimento no período ✅\n\n`;
  }

  if (receber && receber.length > 0) {
    const totalReceber = receber.reduce((sum, c) => sum + Number(c.valor), 0);
    mensagem += `**Contas a Receber:** ${receber.length} títulos - ${formatCurrency(totalReceber)}\n`;
    receber.slice(0, 5).forEach(c => {
      mensagem += `• ${c.data_vencimento}: ${c.cliente_nome} - ${formatCurrency(Number(c.valor))}\n`;
    });
    if (receber.length > 5) mensagem += `  ... e mais ${receber.length - 5} títulos\n`;
  } else {
    mensagem += `**Contas a Receber:** Nenhum vencimento no período\n`;
  }

  return { success: true, message: mensagem, data: { pagar, receber } };
}
