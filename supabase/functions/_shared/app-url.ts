/**
 * URL base pública do app (para links de e-mail, redirects de SSO, deep
 * links de relatórios etc.).
 *
 * Por que este arquivo existe: o conceito de "URL base do app" acumulou três
 * nomes de env var diferentes entre as edge functions (`APP_BASE_URL`,
 * `APP_PUBLIC_URL`, `PUBLIC_APP_URL`), cada uma configurada isoladamente por
 * função. Isso faz o mesmo link quebrar em produção sempre que só uma das
 * três estiver definida no ambiente. `getAppBaseUrl()` centraliza a leitura
 * e tenta as três, nessa ordem, retornando a primeira não vazia — sem
 * remover nenhuma das env vars já configuradas em produção.
 */
export function getAppBaseUrl(): string {
  const candidatos = [
    Deno.env.get('APP_BASE_URL'),
    Deno.env.get('APP_PUBLIC_URL'),
    Deno.env.get('PUBLIC_APP_URL'),
  ];

  for (const candidato of candidatos) {
    if (candidato && candidato.trim() !== '') {
      return candidato;
    }
  }

  return '';
}
