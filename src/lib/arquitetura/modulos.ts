/**
 * Manifesto de Arquitetura Modular — Motor Tributário SaaS.
 *
 * Fonte única de verdade para os 12 módulos em 4 camadas (DDD + Hexagonal).
 * Este arquivo é dado puro: sem React, sem Supabase, sem I/O. Ele é consumido
 * por testes de conformidade arquitetural e por telas de documentação viva.
 *
 * Regras estruturais que o manifesto codifica:
 *  1. O núcleo de domínio (camada 3) não pode importar framework/infra.
 *  2. Adapters de infraestrutura são explicitamente declarados (allowlist).
 *  3. O grafo de dependências entre módulos deve ser acíclico.
 */

export type CamadaId = 1 | 2 | 3 | 4;

export type ModuloId =
  | 'M01'
  | 'M02'
  | 'M03'
  | 'M04'
  | 'M05'
  | 'M06'
  | 'M07'
  | 'M08'
  | 'M09'
  | 'M10'
  | 'M11'
  | 'M12';

export interface Camada {
  readonly id: CamadaId;
  readonly nome: string;
  readonly descricao: string;
}

export interface Modulo {
  readonly id: ModuloId;
  readonly nome: string;
  readonly camada: CamadaId;
  /** Função do módulo em uma frase. */
  readonly funcao: string;
  /** Caminhos reais no repositório (relativos à raiz do projeto). */
  readonly caminhos: readonly string[];
  /** Módulos dos quais este depende diretamente. */
  readonly dependencias: readonly ModuloId[];
  /**
   * Núcleo puro: quando `true`, nenhum arquivo dos caminhos pode importar
   * React, Supabase, react-router, TanStack Query, sonner ou componentes de UI.
   */
  readonly puro: boolean;
}

export const CAMADAS: readonly Camada[] = [
  {
    id: 1,
    nome: 'Apresentação',
    descricao: 'React 18 + shadcn/ui + Tailwind. Dashboard, cadastros, simulação, análise e relatórios.',
  },
  {
    id: 2,
    nome: 'Aplicação',
    descricao: 'Casos de uso e orquestração via Edge Functions.',
  },
  {
    id: 3,
    nome: 'Domínio Fiscal',
    descricao: 'Motores de cálculo e decisão. Pure functions, sem dependência de framework ou banco.',
  },
  {
    id: 4,
    nome: 'Infraestrutura',
    descricao: 'Persistência, storage, auth e integrações externas (adapters).',
  },
] as const;

export const MODULOS: readonly Modulo[] = [
  {
    id: 'M01',
    nome: 'Identidade e Acesso',
    camada: 1,
    funcao: 'Autenticação, RBAC, organizações e convites (multi-tenancy).',
    caminhos: [
      'src/hooks/useAuth.tsx',
      'src/hooks/useOrganizacoes.ts',
      'src/lib/organizacoes',
      'src/pages/organizacoes',
    ],
    dependencias: ['M12'],
    puro: false,
  },
  {
    id: 'M02',
    nome: 'Cadastros e Configuração',
    camada: 1,
    funcao: 'CRUD de empresas, faturamento, folha, produtos e parâmetros fiscais.',
    caminhos: ['src/pages/Empresas.tsx', 'src/components/empresas'],
    dependencias: ['M01', 'M09', 'M11', 'M12'],
    puro: false,
  },
  {
    id: 'M03',
    nome: 'Visualização e Relatórios',
    camada: 1,
    funcao: 'Dashboards, gráficos e exportação de relatórios profissionais.',
    caminhos: ['src/pages/tributario', 'src/lib/tributario/relatorio-pdf.ts'],
    dependencias: ['M01', 'M02', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12'],
    puro: false,
  },
  {
    id: 'M04',
    nome: 'Orquestração de Simulações',
    camada: 2,
    funcao: 'Coordena o cálculo de múltiplos regimes, compara e persiste resultados.',
    caminhos: [
      'supabase/functions/simular-simples',
      'supabase/functions/simular-presumido',
      'supabase/functions/simular-real',
      'supabase/functions/decidir-regime',
      'src/hooks/useSimulacaoRegimes.ts',
    ],
    dependencias: ['M07', 'M08', 'M09', 'M11', 'M12'],
    puro: false,
  },
  {
    id: 'M05',
    nome: 'Workflow Engine',
    camada: 2,
    funcao: 'Máquina de estados de longa duração para teses e transações tributárias.',
    caminhos: ['src/lib/tributario/elisao'],
    dependencias: ['M06', 'M12'],
    puro: false,
  },
  {
    id: 'M06',
    nome: 'Análise e Inteligência',
    camada: 2,
    funcao: 'Elisão automática, alertas fiscais e projeção da reforma tributária.',
    caminhos: [
      'src/lib/tributario/projecao-reforma.ts',
      'supabase/functions/gerar-alertas-tributarios',
    ],
    dependencias: ['M07', 'M10', 'M11', 'M12'],
    puro: false,
  },
  {
    id: 'M07',
    nome: 'Motor de Tributação Direta',
    camada: 3,
    funcao: 'IRPJ, CSLL, PIS e COFINS em todos os regimes (Simples, Presumido, Real).',
    caminhos: [
      'src/lib/tributario/calculadora',
      'src/lib/tributario/simular-simples.ts',
      'src/lib/tributario/simular-presumido.ts',
      'src/lib/tributario/simular-real.ts',
      'src/lib/tributario/monofasico',
      'src/lib/tributario/pis-cofins',
      'src/lib/tributario/irpj-csll',
    ],
    dependencias: ['M09', 'M11'],
    puro: true,
  },
  {
    id: 'M08',
    nome: 'Motor de Tributação Indireta',
    camada: 3,
    funcao: 'ICMS, ICMS-ST, DIFAL, IPI e ISS sobre operações de mercadoria e serviço.',
    caminhos: ['src/lib/tributario/icms', 'src/lib/tributario/ipi-iss'],
    dependencias: ['M11'],
    puro: true,
  },
  {
    id: 'M09',
    nome: 'Motor de Folha e Retenções',
    camada: 3,
    funcao: 'INSS patronal, RAT/FAP, terceiros, FGTS e retenções (IRRF/PCC/INSS).',
    caminhos: ['src/lib/tributario/folha', 'src/lib/tributario/fator-r.ts'],
    dependencias: ['M11'],
    puro: true,
  },
  {
    id: 'M10',
    nome: 'Motor de Decisão Fiscal',
    camada: 3,
    funcao: 'Decide regime, tratamento de ICMS, retenções e elegibilidade de benefícios.',
    caminhos: [
      'src/lib/tributario/decidir-regime.ts',
      'src/lib/tributario/recomendar-empresa.ts',
      'src/lib/tributario/diagnostico-parametros.ts',
      'src/lib/tributario/catalogos/coerencia-ncm.ts',
      'src/lib/tributario/catalogos/coerencia-iss.ts',
    ],
    dependencias: ['M07', 'M08', 'M09', 'M11'],
    puro: true,
  },
  {
    id: 'M11',
    nome: 'Catálogos Fiscais',
    camada: 3,
    funcao: 'Dados de referência: UFs, NCMs, protocolos ST, ISS, faixas do Simples e elisão.',
    caminhos: [
      'src/lib/tributario/catalogos',
      'src/lib/tributario/aliquotas-simples.ts',
      'src/lib/tributario/rbt12.ts',
    ],
    dependencias: ['M12'],
    puro: true,
  },
  {
    id: 'M12',
    nome: 'Infraestrutura e Integrações',
    camada: 4,
    funcao: 'Postgres + RLS, storage, auth e integrações (Resend, Bitrix24, n8n, SEFAZ).',
    caminhos: ['src/integrations', 'supabase/functions/_shared'],
    dependencias: [],
    puro: false,
  },
] as const;

/**
 * Adapters autorizados a cruzar a fronteira do núcleo: arquivos dentro de
 * módulos puros que, por decisão explícita, falam com a infraestrutura.
 * Qualquer novo item aqui é uma decisão arquitetural consciente.
 */
export const ADAPTERS_AUTORIZADOS: readonly string[] = [
  'src/lib/tributario/catalogos/repositorio.ts',
] as const;

/** Prefixos de import proibidos dentro do núcleo de domínio. */
export const IMPORTS_PROIBIDOS_NO_NUCLEO: readonly string[] = [
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  '@tanstack/react-query',
  'sonner',
  '@supabase/supabase-js',
  '@/integrations/supabase',
  '@/components',
  '@/hooks',
] as const;

export function obterModulo(id: ModuloId): Modulo {
  const modulo = MODULOS.find((m) => m.id === id);
  if (!modulo) throw new Error(`Módulo desconhecido: ${id}`);
  return modulo;
}

export function modulosDaCamada(camada: CamadaId): readonly Modulo[] {
  return MODULOS.filter((m) => m.camada === camada);
}

/**
 * Detecta ciclos no grafo de dependências entre módulos.
 * Retorna a lista de ciclos encontrados (cada ciclo como caminho de ids).
 */
export function detectarCiclos(modulos: readonly Modulo[] = MODULOS): ModuloId[][] {
  const porId = new Map<ModuloId, Modulo>(modulos.map((m) => [m.id, m]));
  const ciclos: ModuloId[][] = [];
  const estado = new Map<ModuloId, 'visitando' | 'ok'>();

  const visitar = (id: ModuloId, caminho: ModuloId[]): void => {
    const atual = estado.get(id);
    if (atual === 'ok') return;
    if (atual === 'visitando') {
      const inicio = caminho.indexOf(id);
      ciclos.push([...caminho.slice(inicio >= 0 ? inicio : 0), id]);
      return;
    }
    estado.set(id, 'visitando');
    for (const dep of porId.get(id)?.dependencias ?? []) {
      visitar(dep, [...caminho, id]);
    }
    estado.set(id, 'ok');
  };

  for (const modulo of modulos) visitar(modulo.id, []);
  return ciclos;
}

/**
 * Regra de camadas: um módulo nunca pode depender de uma camada mais alta
 * (número menor). Ex.: domínio (3) não pode depender de apresentação (1).
 */
export function violacoesDeCamada(modulos: readonly Modulo[] = MODULOS): string[] {
  const porId = new Map<ModuloId, Modulo>(modulos.map((m) => [m.id, m]));
  const violacoes: string[] = [];
  for (const modulo of modulos) {
    for (const depId of modulo.dependencias) {
      const dep = porId.get(depId);
      if (!dep) {
        violacoes.push(`${modulo.id} depende de módulo inexistente ${depId}`);
        continue;
      }
      if (dep.camada < modulo.camada) {
        violacoes.push(
          `${modulo.id} (camada ${modulo.camada}) depende de ${dep.id} (camada ${dep.camada}), invertendo a direção das camadas`,
        );
      }
    }
  }
  return violacoes;
}
