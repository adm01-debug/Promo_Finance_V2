import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Descarte estrutural do cache de React Query ao trocar de empresa.
 *
 * A versão anterior era *fail-open*: invalidava uma query apenas se alguma
 * parte da chave contivesse a string "empresa", fosse igual ao UUID
 * anterior/novo, ou fosse um objeto com `empresa_id`. Chaves legítimas como
 * `['centros_custo', 'all']` ou `['auditoria-ia']` não casam com nenhum desses
 * critérios — os dados da empresa anterior permaneciam no cache. Pior, no
 * primeiro switch da sessão `prev` era `null`, de modo que nem o critério de
 * UUID funcionava.
 *
 * Agora é *fail-closed*: tudo é removido, exceto uma allowlist explícita de
 * recursos comprovadamente independentes de empresa. O custo de um erro na
 * allowlist é assimétrico e a escolha segue essa assimetria:
 *  - remover algo agnóstico  → um refetch desnecessário;
 *  - manter algo por tenant  → dados de outra empresa exibidos ao usuário.
 *
 * Usamos `removeQueries` em vez de `invalidateQueries` porque invalidar marca
 * como stale mas **mantém os dados antigos no cache**: uma query inativa volta
 * a ser montada servindo o tenant anterior até o refetch resolver. Remover
 * elimina a entrada — as queries montadas refazem o fetch, as demais somem sem
 * tráfego algum.
 */

/**
 * Raízes de queryKey que não dependem da empresa: identidade do usuário,
 * catálogos nacionais estáticos e telemetria de plataforma.
 *
 * `user-empresas` e `empresas` são obrigatórios aqui — são a própria fonte da
 * troca de empresa; removê-los durante o switch derrubaria o `EmpresaGuard`
 * para o estado de carregamento.
 */
export const RAIZES_AGNOSTICAS_A_EMPRESA: ReadonlySet<string> = new Set([
  // Identidade / vínculos do usuário
  'user-empresas',
  'empresas',
  'empresas-simples',
  'profiles-by-ids',
  'profiles-audit',
  'profiles-aprovadores',
  // Catálogos nacionais estáticos
  'bancos',
  'ramos-atividade',
  'glossario-tributario',
  'catalogo',
  'catalogo-iss-municipal',
  'catalogos-fiscais',
  'catalogos-tributarios-health',
  'catalogos-tributarios-history',
  'estrategias-elisao-catalogo',
  'cobertura-fiscal-uf',
  // Saúde/telemetria de plataforma
  'public-status-metrics',
  'system-health',
  'slo-metrics',
  'edge-health',
  'sys-edge-health',
]);

/**
 * Decide se uma query deve ser descartada na troca de empresa.
 * Fail-closed: chave sem raiz string reconhecida é sempre removida.
 */
export function deveRemoverNaTrocaDeEmpresa(key: QueryKey): boolean {
  const raiz = key[0];
  if (typeof raiz !== 'string') return true;
  return !RAIZES_AGNOSTICAS_A_EMPRESA.has(raiz);
}

export function useSelectiveEmpresaInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => {
      queryClient.removeQueries({
        predicate: (query) => deveRemoverNaTrocaDeEmpresa(query.queryKey),
      });
    };

    window.addEventListener('current-empresa-changed', handler);
    return () => window.removeEventListener('current-empresa-changed', handler);
  }, [queryClient]);
}
