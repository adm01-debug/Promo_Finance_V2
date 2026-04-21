/**
 * Utilitários para mascarar endereços IP em listas e telas de detalhe.
 * O mascaramento é puramente de exibição — a string original deve ser usada
 * para qualquer filtro/busca para garantir que o usuário ainda encontre IPs
 * conhecidos mesmo com a opção ativa.
 */

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function maskIp(
  ip: string | null | undefined,
  enabled: boolean,
): string {
  if (ip === null || ip === undefined || ip === '') return '-';
  if (!enabled) return ip;

  const trimmed = ip.trim();

  const v4 = trimmed.match(IPV4_REGEX);
  if (v4) {
    return `${v4[1]}.${v4[2]}.*.*`;
  }

  // IPv6 — mascara os 4 últimos hextets, preserva a forma comprimida (::)
  if (trimmed.includes(':')) {
    const hextets = trimmed.split(':');
    if (hextets.length >= 4) {
      const head = hextets.slice(0, 4).join(':');
      return `${head}:****:****:****:****`;
    }
    return trimmed; // formato exótico — não mascara
  }

  // Não é IP reconhecível (hostname, etc.) — não há o que mascarar
  return trimmed;
}

/**
 * Verifica se um termo de busca por substring casa com o IP **original**
 * (não-mascarado). Usar sempre esta função em filtros para que o usuário
 * possa buscar `192.168` mesmo com a opção de mascaramento ativa.
 */
export function matchesIpFilter(
  ip: string | null | undefined,
  term: string,
): boolean {
  if (!term) return true;
  if (!ip) return false;
  return ip.toLowerCase().includes(term.toLowerCase());
}
