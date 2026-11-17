// Leitura das configurações do Asaas.
//
// A tela de configuração (src/hooks/useAsaas.ts) grava tudo dentro da coluna
// JSONB `asaas_config.configuracoes` — a tabela não tem colunas planas para
// esses parâmetros. As edge functions, porém, liam `config?.retry_limit`,
// `config?.alert_email_address` e companhia direto da linha, onde nunca houve
// esses campos: toda configuração salva pelo usuário caía no default
// hardcoded, e os alertas de e-mail/WhatsApp nunca disparavam.
//
// Este helper é o único ponto que sabe onde os valores moram.

export interface ConfiguracoesAsaas {
  retry_limit?: number;
  retry_interval_minutes?: number;
  backoff_multiplier?: number;
  default_fine_percent?: number;
  default_interest_percent?: number;
  alert_email_enabled?: boolean;
  alert_whatsapp_enabled?: boolean;
  alert_email_address?: string;
  alert_whatsapp_number?: string;
  failure_threshold?: number;
  bitrix_trigger_stage?: string;
}

/**
 * Extrai as configurações do Asaas da linha de `asaas_config`.
 *
 * Aceita a linha inteira, só a coluna `configuracoes`, null ou lixo — devolve
 * sempre um objeto, para que os call sites mantenham seus próprios defaults
 * (`cfg.retry_interval_minutes ?? 30`) sem precisar de guarda extra.
 */
export function lerConfigAsaas(linha: unknown): ConfiguracoesAsaas {
  if (!linha || typeof linha !== 'object') return {};
  const registro = linha as Record<string, unknown>;
  // `configuracoes` presente manda, mesmo valendo null: senão uma linha com
  // configuracoes nula devolveria a própria linha (id, empresa_id, ...) como se
  // fossem configurações.
  const bruto = 'configuracoes' in registro ? registro.configuracoes : registro;
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return {};
  return bruto as ConfiguracoesAsaas;
}

/**
 * Resolve juros/multa de uma cobrança: o valor informado manda, inclusive
 * zero; só na ausência vale o percentual padrão da configuração.
 *
 * Devolve `undefined` quando nada deve ser enviado ao Asaas — ausência de
 * valor ou encargo zerado. Com `||` no lugar de `??`, um zero informado pelo
 * formulário cairia no padrão e a cobrança sairia com encargo que o usuário
 * desligou (achado do Devin na PR #421).
 */
export function resolverEncargo(
  informado?: number | null,
  padrao?: number | null
): number | undefined {
  const escolhido = informado ?? padrao;
  if (typeof escolhido !== 'number' || !Number.isFinite(escolhido) || escolhido <= 0) {
    return undefined;
  }
  return escolhido;
}

/**
 * O identificador de cliente do Asaas é texto com prefixo `cus_`. Já a coluna
 * `asaas_payments.asaas_customer_id` é `uuid` com FK para `asaas_customers.id`
 * — são duas identidades diferentes, e gravar uma no lugar da outra derruba o
 * insert com 22P02 (invalid input syntax for type uuid). Checar o prefixo antes
 * de chamar o provedor evita criar cobrança que o banco não consegue registrar.
 */
export function pareceIdClienteAsaas(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim().startsWith('cus_');
}

/**
 * Instrumentos de pagamento do boleto achatados na raiz da resposta.
 *
 * O proxy devolvia a linha digitável e o código de barras só dentro de
 * `boletoData`, enquanto o front valida `identificationField`/`barCode` na
 * raiz (src/hooks/useBoletos.helpers.ts) — então toda emissão era recusada com
 * "ASAAS não retornou linha digitável e código de barras válidos" mesmo quando
 * o Asaas devolvia os dois. Mantém `boletoData` intacto para quem já o lia.
 */
export function achatarInstrumentosBoleto(boletoData: unknown): {
  identificationField?: string;
  barCode?: string;
  nossoNumero?: string;
} {
  if (!boletoData || typeof boletoData !== 'object') return {};
  const registro = boletoData as Record<string, unknown>;
  const achatado: { identificationField?: string; barCode?: string; nossoNumero?: string } = {};
  if (typeof registro.identificationField === 'string' && registro.identificationField.trim()) {
    achatado.identificationField = registro.identificationField;
  }
  if (typeof registro.barCode === 'string' && registro.barCode.trim()) {
    achatado.barCode = registro.barCode;
  }
  if (typeof registro.nossoNumero === 'string' && registro.nossoNumero.trim()) {
    achatado.nossoNumero = registro.nossoNumero;
  }
  return achatado;
}
