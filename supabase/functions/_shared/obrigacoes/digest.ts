/**
 * Etapa P — Digest de alertas de conformidade fiscal para envio por e-mail.
 *
 * Módulo 100% puro: recebe os alertas já materializados (vindos do banco ou do
 * motor `avaliarAlertasConformidade`) e produz o payload de e-mail
 * (assunto + HTML + texto alternativo) de forma determinística.
 *
 * Decisões de projeto:
 * - Determinismo total: nenhuma leitura de relógio, `Math.random` ou I/O. O
 *   mesmo conjunto de alertas sempre gera exatamente o mesmo corpo, o que
 *   permite deduplicar envios por hash e testar por snapshot.
 * - Escapamento obrigatório: títulos/mensagens vêm de dados do banco e são
 *   interpolados em HTML — todo texto passa por `escaparHtml` para evitar
 *   injeção de marcação no cliente de e-mail.
 * - Agrupamento por empresa e ordenação por severidade: o contador que recebe o
 *   digest precisa ver primeiro o que é crítico.
 * - Nunca lança: entradas inválidas (severidade desconhecida, valores NaN) são
 *   normalizadas para o caminho seguro em vez de quebrar o job de envio.
 */
import type { SeveridadeAlerta, TipoAlertaConformidade } from './alertas.ts';

/** Alerta, na forma mínima necessária para compor o digest. */
export interface AlertaDigest {
  readonly empresaId: string;
  readonly empresaNome: string;
  readonly tipo: TipoAlertaConformidade | string;
  readonly severidade: SeveridadeAlerta | string;
  readonly competencia: string;
  readonly titulo: string;
  readonly mensagem: string;
  readonly valor?: number | null;
}

/** Bloco do digest correspondente a uma empresa. */
export interface BlocoEmpresaDigest {
  readonly empresaId: string;
  readonly empresaNome: string;
  readonly alertas: readonly AlertaDigest[];
  /** Severidade mais grave do bloco. */
  readonly severidadeMaxima: SeveridadeAlerta;
  /** Soma dos valores monetários associados (multas). */
  readonly valorTotal: number;
}

/** Resultado completo do digest, pronto para o provedor de e-mail. */
export interface DigestConformidade {
  readonly assunto: string;
  readonly html: string;
  readonly texto: string;
  readonly blocos: readonly BlocoEmpresaDigest[];
  readonly totalAlertas: number;
  readonly totalEmpresas: number;
  readonly severidadeMaxima: SeveridadeAlerta | null;
  readonly valorTotal: number;
  /** Hash determinístico do conteúdo — usado para deduplicar envios. */
  readonly hash: string;
}

/** Opções de renderização. */
export interface OpcoesDigest {
  /** Rótulo exibido no rodapé. Default: "Hub Tributário". */
  readonly remetenteNome?: string;
  /** URL base do sistema para o botão de ação (opcional). */
  readonly urlBase?: string;
  /** Competência de referência exibida no cabeçalho (opcional). */
  readonly competenciaReferencia?: string;
}

const SEVERIDADES: readonly SeveridadeAlerta[] = ['critica', 'alta', 'media', 'baixa'];

const PESO: Record<SeveridadeAlerta, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

const ROTULO_SEVERIDADE: Record<SeveridadeAlerta, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

/**
 * Cores fixas em hexadecimal são intencionais aqui: clientes de e-mail não
 * carregam CSS do design system nem suportam variáveis CSS. Estes valores
 * espelham os tokens semânticos (destructive / warning / primary / muted).
 */
const COR_SEVERIDADE: Record<SeveridadeAlerta, string> = {
  critica: '#b91c1c',
  alta: '#c2410c',
  media: '#a16207',
  baixa: '#475569',
};

const ICONE_SEVERIDADE: Record<SeveridadeAlerta, string> = {
  critica: '🔴',
  alta: '🟠',
  media: '🟡',
  baixa: '⚪',
};

/** Normaliza uma severidade arbitrária para um valor conhecido. */
export function normalizarSeveridade(valor: unknown): SeveridadeAlerta {
  const s = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  return (SEVERIDADES as readonly string[]).includes(s) ? (s as SeveridadeAlerta) : 'baixa';
}

/** Normaliza um número possivelmente inválido para um float finito. */
function numeroSeguro(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : 0;
}

/** Escapa os cinco caracteres perigosos em contexto HTML. */
export function escaparHtml(texto: string): string {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const brl = (v: number) =>
  `R$ ${numeroSeguro(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** `AAAA-MM` → `MM/AAAA`; entradas fora do padrão são devolvidas como vieram. */
export function rotuloCompetencia(competencia: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(competencia ?? '');
  return m ? `${m[2]}/${m[1]}` : String(competencia ?? '');
}

/**
 * Hash FNV-1a de 32 bits em hexadecimal.
 *
 * Não é criptográfico — serve apenas como impressão digital estável do
 * conteúdo do digest para deduplicar envios repetidos no mesmo dia.
 */
export function hashConteudo(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Agrupa alertas por empresa, ordenando blocos e itens por gravidade. */
export function agruparPorEmpresa(alertas: readonly AlertaDigest[]): BlocoEmpresaDigest[] {
  const mapa = new Map<string, AlertaDigest[]>();
  for (const alerta of alertas) {
    const chave = alerta.empresaId || alerta.empresaNome || 'sem-empresa';
    const lista = mapa.get(chave);
    if (lista) lista.push(alerta);
    else mapa.set(chave, [alerta]);
  }

  const blocos: BlocoEmpresaDigest[] = [];
  for (const [empresaId, lista] of mapa) {
    const ordenados = [...lista].sort(
      (a, b) =>
        PESO[normalizarSeveridade(a.severidade)] - PESO[normalizarSeveridade(b.severidade)] ||
        (a.competencia < b.competencia ? 1 : a.competencia > b.competencia ? -1 : 0) ||
        String(a.tipo).localeCompare(String(b.tipo)) ||
        // Desempate final por conteúdo: garante ordenação total (determinismo
        // independente da ordem de chegada dos registros do banco).
        a.titulo.localeCompare(b.titulo, 'pt-BR') ||
        a.mensagem.localeCompare(b.mensagem, 'pt-BR'),
    );
    const severidadeMaxima = ordenados.reduce<SeveridadeAlerta>(
      (pior, a) => {
        const s = normalizarSeveridade(a.severidade);
        return PESO[s] < PESO[pior] ? s : pior;
      },
      'baixa',
    );
    blocos.push({
      empresaId,
      empresaNome: ordenados[0]?.empresaNome || 'Empresa sem nome',
      alertas: ordenados,
      severidadeMaxima,
      valorTotal: Math.round(ordenados.reduce((acc, a) => acc + numeroSeguro(a.valor), 0) * 100) / 100,
    });
  }

  return blocos.sort(
    (a, b) =>
      PESO[a.severidadeMaxima] - PESO[b.severidadeMaxima] ||
      b.alertas.length - a.alertas.length ||
      a.empresaNome.localeCompare(b.empresaNome, 'pt-BR') ||
      a.empresaId.localeCompare(b.empresaId),
  );
}

/** Monta o assunto do e-mail a partir do resumo dos alertas. */
export function montarAssunto(
  blocos: readonly BlocoEmpresaDigest[],
  competenciaReferencia?: string,
): string {
  const total = blocos.reduce((acc, b) => acc + b.alertas.length, 0);
  if (total === 0) return 'Conformidade fiscal — nenhum alerta em aberto';

  const pior = blocos.reduce<SeveridadeAlerta>(
    (p, b) => (PESO[b.severidadeMaxima] < PESO[p] ? b.severidadeMaxima : p),
    'baixa',
  );
  const sufixoComp = competenciaReferencia ? ` — ${rotuloCompetencia(competenciaReferencia)}` : '';
  const empresas =
    blocos.length === 1 ? blocos[0].empresaNome : `${blocos.length} empresas`;
  return `${ICONE_SEVERIDADE[pior]} ${total} alerta${total > 1 ? 's' : ''} de conformidade fiscal (${ROTULO_SEVERIDADE[pior].toLowerCase()}) — ${empresas}${sufixoComp}`;
}

/** Versão texto puro (fallback para clientes sem HTML e leitores de tela). */
function renderizarTexto(
  blocos: readonly BlocoEmpresaDigest[],
  opcoes: OpcoesDigest,
): string {
  const linhas: string[] = ['DIGEST DE CONFORMIDADE FISCAL', ''];
  if (blocos.length === 0) {
    linhas.push('Nenhum alerta em aberto. Todas as obrigações monitoradas estão regulares.');
  }
  for (const bloco of blocos) {
    linhas.push(`## ${bloco.empresaNome} (${bloco.alertas.length} alerta(s))`);
    for (const alerta of bloco.alertas) {
      const sev = normalizarSeveridade(alerta.severidade);
      linhas.push(
        `- [${ROTULO_SEVERIDADE[sev]}] ${rotuloCompetencia(alerta.competencia)} — ${alerta.titulo}`,
      );
      linhas.push(`  ${alerta.mensagem}`);
      if (numeroSeguro(alerta.valor) > 0) linhas.push(`  Valor: ${brl(numeroSeguro(alerta.valor))}`);
    }
    if (bloco.valorTotal > 0) linhas.push(`  Total em multas: ${brl(bloco.valorTotal)}`);
    linhas.push('');
  }
  if (opcoes.urlBase) linhas.push(`Abrir o painel: ${opcoes.urlBase}`);
  linhas.push(`— ${opcoes.remetenteNome ?? 'Hub Tributário'}`);
  return linhas.join('\n');
}

/** Renderiza o corpo HTML (tabelas inline, compatível com clientes de e-mail). */
function renderizarHtml(blocos: readonly BlocoEmpresaDigest[], opcoes: OpcoesDigest): string {
  const total = blocos.reduce((acc, b) => acc + b.alertas.length, 0);
  const valorTotal = Math.round(blocos.reduce((acc, b) => acc + b.valorTotal, 0) * 100) / 100;
  const rodape = escaparHtml(opcoes.remetenteNome ?? 'Hub Tributário');

  const cabecalhoComp = opcoes.competenciaReferencia
    ? `<p style="margin:4px 0 0;color:#cbd5e1;font-size:13px;">Competência de referência: ${escaparHtml(rotuloCompetencia(opcoes.competenciaReferencia))}</p>`
    : '';

  const corpo =
    blocos.length === 0
      ? `<p style="color:#334155;font-size:15px;line-height:1.6;margin:0;">Nenhum alerta de conformidade em aberto. Todas as obrigações monitoradas estão regulares.</p>`
      : blocos
          .map((bloco) => {
            const itens = bloco.alertas
              .map((alerta) => {
                const sev = normalizarSeveridade(alerta.severidade);
                const valor = numeroSeguro(alerta.valor);
                return `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                  <span style="display:inline-block;font-size:11px;font-weight:bold;color:#ffffff;background:${COR_SEVERIDADE[sev]};border-radius:4px;padding:2px 8px;">${ROTULO_SEVERIDADE[sev].toUpperCase()}</span>
                  <span style="font-size:12px;color:#64748b;margin-left:8px;">${escaparHtml(rotuloCompetencia(alerta.competencia))}</span>
                  <div style="font-size:15px;font-weight:bold;color:#0f172a;margin-top:6px;">${escaparHtml(alerta.titulo)}</div>
                  <div style="font-size:13px;color:#475569;line-height:1.5;margin-top:4px;">${escaparHtml(alerta.mensagem)}</div>
                  ${valor > 0 ? `<div style="font-size:13px;color:${COR_SEVERIDADE.critica};font-weight:bold;margin-top:4px;">${escaparHtml(brl(valor))}</div>` : ''}
                </td>
              </tr>`;
              })
              .join('');

            return `
        <div style="margin-top:24px;">
          <h2 style="font-size:16px;color:#0f172a;margin:0 0 4px;">${escaparHtml(bloco.empresaNome)}</h2>
          <p style="margin:0;font-size:12px;color:#64748b;">${bloco.alertas.length} alerta(s)${bloco.valorTotal > 0 ? ` · multas ${escaparHtml(brl(bloco.valorTotal))}` : ''}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">${itens}</table>
        </div>`;
          })
          .join('');

  const botao = opcoes.urlBase
    ? `<div style="margin-top:28px;text-align:center;">
         <a href="${escaparHtml(opcoes.urlBase)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;">Abrir painel de conformidade</a>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
    <div style="background:#0f172a;padding:24px;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;">Digest de Conformidade Fiscal</h1>
      <p style="margin:4px 0 0;color:#cbd5e1;font-size:13px;">${total} alerta(s) em ${blocos.length} empresa(s)${valorTotal > 0 ? ` · ${escaparHtml(brl(valorTotal))} em multas` : ''}</p>
      ${cabecalhoComp}
    </div>
    <div style="padding:24px;">
      ${corpo}
      ${botao}
    </div>
    <div style="background:#e2e8f0;padding:16px;text-align:center;color:#64748b;font-size:11px;">
      ${rodape} — mensagem automática, não responda a este e-mail.
    </div>
  </div>
</body></html>`;
}

/**
 * Constrói o digest completo a partir de uma lista bruta de alertas.
 *
 * Nunca lança: alertas malformados são normalizados antes da renderização.
 */
export function construirDigest(
  alertas: readonly AlertaDigest[],
  opcoes: OpcoesDigest = {},
): DigestConformidade {
  const blocos = agruparPorEmpresa(alertas ?? []);
  const totalAlertas = blocos.reduce((acc, b) => acc + b.alertas.length, 0);
  const severidadeMaxima =
    blocos.length === 0
      ? null
      : blocos.reduce<SeveridadeAlerta>(
          (p, b) => (PESO[b.severidadeMaxima] < PESO[p] ? b.severidadeMaxima : p),
          'baixa',
        );
  const texto = renderizarTexto(blocos, opcoes);

  return {
    assunto: montarAssunto(blocos, opcoes.competenciaReferencia),
    html: renderizarHtml(blocos, opcoes),
    texto,
    blocos,
    totalAlertas,
    totalEmpresas: blocos.length,
    severidadeMaxima,
    valorTotal: Math.round(blocos.reduce((acc, b) => acc + b.valorTotal, 0) * 100) / 100,
    hash: hashConteudo(texto),
  };
}
