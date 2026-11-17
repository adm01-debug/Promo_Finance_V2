/**
 * Escritas da solicitação LGPD, em módulo próprio para serem testáveis sem
 * importar o `index.ts` — que chama `serve` no topo.
 */

/**
 * Contrato mínimo usado por estas duas escritas: `from(tabela).update(payload).eq(coluna, valor)`.
 * Tipar em vez de usar `any` faz o compilador checar a forma da chamada nos dois
 * auxiliares e vale igualmente para o cliente real e para o dublê do teste.
 */
export interface RespostaEscrita {
  error: { message: string } | null;
}

export interface ClienteEscrita {
  from(tabela: string): {
    update(payload: Record<string, unknown>): {
      eq(coluna: string, valor: unknown): PromiseLike<RespostaEscrita>;
    };
  };
}

/**
 * Anonimiza o perfil do titular.
 *
 * `phone` não existe em `public.profiles` (as colunas são id, full_name,
 * avatar_url, role, created_at, updated_at, email, user_id, empresa_id) e um
 * UPDATE com coluna inválida é recusado por inteiro — era por isso que o pedido
 * de exclusão não apagava nada.
 *
 * O erro é propagado de propósito: sem isso a solicitação seguia para
 * "atendida" com o dado do titular intacto.
 */
export async function anonimizarTitular(
  client: ClienteEscrita,
  targetUserId: string,
  agoraIso: string
): Promise<Record<string, unknown>> {
  const hashed = `anon-${targetUserId.slice(0, 8)}@removido.local`;
  const { error } = await client
    .from('profiles')
    .update({ full_name: 'Titular removido', email: hashed, avatar_url: null })
    .eq('id', targetUserId);
  // O erro do supabase-js é objeto simples, não Error: sem envolver, o catch do
  // handler (`e instanceof Error ? e.message : 'unknown'`) responderia 'unknown'
  // e o motivo real da recusa se perderia.
  if (error) throw new Error(`anonimizar titular: ${error.message}`);
  return { anonimizado_em: agoraIso, email_substituto: hashed };
}

/**
 * Fecha a solicitação.
 *
 * Quem atendeu vai dentro de `payload_resposta` porque a coluna `atendida_por`
 * não existe em `public.solicitacoes_lgpd` — com ela no payload este UPDATE era
 * recusado e a solicitação nunca saía de "pendente", mesmo com o dump já gerado
 * e enviado ao storage.
 */
export async function fecharSolicitacao(
  client: ClienteEscrita,
  args: {
    solicitacaoId: string;
    payloadResposta: Record<string, unknown>;
    urlDump: string | null;
    userId: string;
    agoraIso: string;
  }
): Promise<void> {
  const { error } = await client
    .from('solicitacoes_lgpd')
    .update({
      status: 'atendida',
      payload_resposta: { ...args.payloadResposta, atendida_por: args.userId },
      url_dump: args.urlDump,
      atendida_em: args.agoraIso,
    })
    .eq('id', args.solicitacaoId);
  if (error) throw new Error(`fechar solicitação LGPD: ${error.message}`);
}
