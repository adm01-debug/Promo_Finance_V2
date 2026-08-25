/**
 * Galeria de espécimes Vela-dark (gate G2/G3 do plano de restyle).
 * Rota DEV-ONLY `/__especimes` — fora de produção (registrada só com import.meta.env.DEV).
 * Cada seção exercita um espécime vivo com tokens; mudanças de tema (claro/escuro)
 * refletem na hora. Não usar como base para telas reais: é instrumento de QA visual.
 */
/* eslint-disable max-lines -- catálogo deliberadamente em arquivo único: cada seção é um espécime independente de QA; dividir esconderia o panorama que a galeria existe para dar */
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Download,
  Plus,
  Search,
  Settings,
  Sparkles,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { TablePagination } from '@/components/ui/table-pagination';
import { Toggle } from '@/components/ui/toggle';
import { AnimatedNumber, StatCard } from '@/components/motion';
import { ChartContainer, Sparkline, chartColors } from '@/components/charts';
import { useTheme } from '@/components/theme/ThemeContext';

/* ---------- infraestrutura mínima da página ---------- */

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="vela-reveal rounded-vela-lg border border-line bg-bg-2/60 p-6 backdrop-blur-sm">
      <header className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-acc">Espécime</p>
        <h2 className="text-lg font-extrabold text-t0">{titulo}</h2>
        {descricao && <p className="mt-1 text-[13px] text-t2">{descricao}</p>}
      </header>
      {children}
    </section>
  );
}

/** Lê o valor computado de uma var CSS no tema atual (para o rótulo mono do swatch). */
function useVarValues(names: string[]) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const key = names.join(',');
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const out: Record<string, string> = {};
    for (const n of names) out[n] = cs.getPropertyValue(n).trim();
    setVals(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nomes derivam de constantes módulo; `key` cobre a identidade
  }, [key]);
  return vals;
}

function Swatch({ nome, valor }: { nome: string; valor: string }) {
  const vals = useVarValues([valor]);
  return (
    <div className="flex items-center gap-3 rounded-vela-md border border-line bg-bg-3/40 p-3">
      <span
        aria-hidden
        className="h-10 w-10 shrink-0 rounded-vela-sm border border-line shadow-inner"
        style={{ background: `var(${valor})` }}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-t0">{nome}</span>
        <span className="block truncate font-mono text-[11px] text-t2">{vals[valor] || valor}</span>
      </span>
    </div>
  );
}

/* ---------- dados de demonstração ---------- */

const sparkA = [12, 14, 13, 17, 16, 21, 19, 24, 23, 28, 27, 33];
const sparkB = [30, 28, 29, 26, 27, 23, 24, 20, 21, 17, 18, 14];
const sparkC = [8, 9, 8.5, 10, 11, 10.5, 12, 12.5, 12, 13.5, 14, 15];

const serieArea = Array.from({ length: 12 }, (_, i) => ({
  mes: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
  receber: 40 + i * 6 + (i % 3) * 4,
  pagar: 30 + i * 3 + (i % 4) * 5,
}));

const serieBar = [
  { dia: 'Seg', valor: 14 },
  { dia: 'Ter', valor: 18 },
  { dia: 'Qua', valor: 12 },
  { dia: 'Qui', valor: 21 },
  { dia: 'Sex', valor: 17 },
  { dia: 'Sáb', valor: 8 },
  { dia: 'Dom', valor: 5 },
];

const TOKENS_CORE = [
  ['Fundo base', '--bg-0'],
  ['Superfície 1', '--bg-1'],
  ['Superfície 2', '--bg-2'],
  ['Superfície 3', '--bg-3'],
  ['Linha', '--line'],
  ['Texto primário', '--t0'],
  ['Texto secundário', '--t1'],
  ['Texto mudo', '--t2'],
];
const TOKENS_SEMANTICOS = [
  ['Acento', '--acc'],
  ['Acento 2', '--acc-2'],
  ['Sucesso', '--ok'],
  ['Atenção', '--warn'],
  ['Erro', '--bad'],
  ['Info', '--info'],
];

/* ---------- página ---------- */

export default function Especimes() {
  const { theme, setTheme } = useTheme();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pagina, setPagina] = useState(2);
  const [switchOn, setSwitchOn] = useState(true);
  const [toggleOn, setToggleOn] = useState(false);
  const [pulse, setPulse] = useState(0); // replay do AnimatedNumber

  const grafico = useMemo(
    () => (
      <ChartContainer className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serieArea} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="esp-ch1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors[0]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={chartColors[0]} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="esp-ch2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors[1]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColors[1]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 6" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'var(--t2)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-2)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                fontFamily: 'var(--font-mono, monospace)',
              }}
              labelStyle={{ color: 'var(--t1)' }}
              cursor={{ stroke: 'var(--acc)', strokeOpacity: 0.35 }}
            />
            <Area
              type="monotone"
              dataKey="receber"
              stroke={chartColors[0]}
              strokeWidth={2}
              fill="url(#esp-ch1)"
            />
            <Area
              type="monotone"
              dataKey="pagar"
              stroke={chartColors[1]}
              strokeWidth={2}
              fill="url(#esp-ch2)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-bg-0 pb-20 font-sans">
      {/* cabeçalho */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg-1/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-acc">
              Gate G2 · G3 · DEV-only
            </p>
            <h1 className="text-2xl font-black tracking-tight text-t0">Espécimes Vela-dark</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-t2">tema: {theme}</span>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={theme === t ? 'default' : 'outline'}
                onClick={() => setTheme(t)}
              >
                {t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Sistema'}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 grid max-w-6xl gap-6 px-6">
        {/* G8 lembrete */}
        <p className="rounded-vela-md border border-warn/30 bg-warn-soft px-4 py-3 text-[13px] text-t1">
          Página de QA visual — não faz parte do produto. A command palette global (⌘K / Ctrl+K)
          continua disponível para validar o espécime de paleta em contexto real.
        </p>

        <Secao
          titulo="Tokens de cor"
          descricao="Valores computados no tema ativo — a troca de tema no topo re-renderiza os swatches."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOKENS_CORE.map(([nome, v]) => (
              <Swatch key={v} nome={nome} valor={v} />
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOKENS_SEMANTICOS.map(([nome, v]) => (
              <Swatch key={v} nome={nome} valor={v} />
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {chartColors.map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-vela-md border border-line bg-bg-3/40 p-3"
              >
                <span
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-full border border-line"
                  style={{ background: `var(--ch${i + 1})` }}
                />
                <span className="font-mono text-[11px] text-t2">--ch{i + 1}</span>
              </div>
            ))}
          </div>
        </Secao>

        <Secao
          titulo="Tipografia"
          descricao="Plus Jakarta Sans (UI/títulos) + JetBrains Mono (números financeiros tabulares)."
        >
          <div className="space-y-3">
            <p className="text-display-xl gradient-text">Financeiro em ritmo real</p>
            <p className="text-2xl font-black text-t0">Título de página — 22px/800</p>
            <p className="text-[13px] text-t1">
              Corpo de texto com 65 caracteres de medida. O texto secundário usa{' '}
              <code className="font-mono text-acc">--t1</code> e permanece legível nos dois temas.
            </p>
            <p className="font-mono text-lg tabular-nums text-t0">
              R$ 1.234.567,89 · R$ -98.765,43 · 12,34%
            </p>
          </div>
        </Secao>

        <Secao
          titulo="Botões"
          descricao="Todas as variants × sizes. Glow e premium são Z3 (usar com parcimônia)."
        >
          <div className="flex flex-wrap items-center gap-3">
            {(
              [
                'default',
                'secondary',
                'outline',
                'ghost',
                'link',
                'destructive',
                'success',
                'warning',
                'premium',
                'glow',
              ] as const
            ).map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Novo (sm)
            </Button>
            <Button size="default">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button size="lg">
              <Search className="h-4 w-4" /> Buscar (lg)
            </Button>
            <Button size="icon" variant="outline" aria-label="Configurações">
              <Settings />
            </Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </Secao>

        <Secao
          titulo="Badges e switches"
          descricao="Status com cor SEMPRE acompanhada de rótulo — nunca cor sozinha."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Padrão</Badge>
            <Badge variant="secondary">Secundário</Badge>
            <Badge variant="outline">Contorno</Badge>
            <Badge variant="success">Pago ✓</Badge>
            <Badge variant="warning">Pendente !</Badge>
            <Badge variant="destructive">Vencido ✕</Badge>
            <Badge variant="info">Info i</Badge>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 text-[13px] text-t1">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} /> Notificações por e-mail
            </label>
            <label className="flex items-center gap-3 text-[13px] text-t1">
              <Toggle pressed={toggleOn} onPressedChange={setToggleOn} aria-label="Modo foco">
                <Bell className="h-4 w-4" />
              </Toggle>{' '}
              Modo foco (toggle)
            </label>
          </div>
        </Secao>

        <Secao
          titulo="StatCard + AnimatedNumber + Sparkline"
          descricao="KPI vivo (Z2). Botão replay reexecuta o count-up pt-BR."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="A receber"
              value="R$ 284.350,75"
              sub="Últimos 30 dias"
              icon={<Wallet className="h-5 w-5" />}
              delta={{ value: '+12,4%', positive: true }}
              sparkline={<Sparkline data={sparkA} />}
            />
            <StatCard
              label="A pagar"
              value="R$ 141.208,40"
              sub="Últimos 30 dias"
              icon={<ArrowUpRight className="h-5 w-5" />}
              iconColor="var(--bad)"
              iconBg="var(--bad-soft)"
              delta={{ value: '-3,1%', positive: false }}
              sparkline={<Sparkline data={sparkB} color="var(--bad)" />}
            />
            <StatCard
              label="Saldo projetado"
              value="R$ 143.142,35"
              sub="Consolidado"
              icon={<ArrowDownRight className="h-5 w-5" />}
              iconColor="var(--ok)"
              iconBg="var(--ok-soft)"
              sparkline={<Sparkline data={sparkC} color="var(--ok)" />}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setPulse((p) => p + 1)}>
              <Sparkles className="h-4 w-4" /> Replay do count-up
            </Button>
            <span className="text-t2 text-[13px]">AnimatedNumber:</span>
            <span key={pulse} className="text-2xl font-black text-t0">
              <AnimatedNumber value="R$ 284.350,75" />
            </span>
          </div>
        </Secao>

        <Secao
          titulo="ChartContainer + Recharts"
          descricao="Série dupla com a paleta CVD-validada --ch1..5, grid recessivo e tooltip mono."
        >
          {grafico}
          <div className="mt-4 h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serieBar}>
                <XAxis
                  dataKey="dia"
                  tick={{ fill: 'var(--t2)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                  }}
                  cursor={{ fill: 'var(--acc)', fillOpacity: 0.08 }}
                />
                <Bar dataKey="valor" fill={chartColors[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Secao>

        <Secao titulo="Dialog" descricao="Glass do tema (borda/sombra por tema desde o P6).">
          <Button variant="outline" onClick={() => setDialogAberto(true)}>
            <Settings className="h-4 w-4" /> Abrir diálogo de exemplo
          </Button>
        </Secao>

        <Secao
          titulo="TablePagination"
          descricao="Barra de paginação das tabelas (banda por tema desde o P6)."
        >
          <div className="overflow-hidden rounded-vela-lg border border-line bg-bg-2/60">
            <div className="p-6 text-[13px] text-t2">
              Tabela de exemplo — o espécime valida apenas a barra de paginação abaixo.
            </div>
            <TablePagination
              currentPage={pagina}
              totalPages={9}
              pageSize={20}
              totalItems={173}
              onPageChange={setPagina}
              onPageSizeChange={() => {}}
            />
          </div>
        </Secao>

        <Secao
          titulo="Zonas de motion (lembrete G8)"
          descricao="Contrato aplicado nas telas reais — esta página é Z2."
        >
          <ul className="space-y-2 text-[13px] text-t1">
            <li>
              <strong className="text-t0">Z3</strong> Auth/momentos: aurora CSS, count-up, velaPop.
            </li>
            <li>
              <strong className="text-t0">Z2</strong> Dashboards: reveal + count-up + hover em
              cards.
            </li>
            <li>
              <strong className="text-t0">Z1</strong> Operação/tabelas: apenas hover; sem stagger
              por linha.
            </li>
            <li>
              <strong className="text-t0">Z0</strong> Documentos/relatórios impressos: zero motion
              decorativo.
            </li>
            <li>
              <code className="font-mono text-acc">prefers-reduced-motion</code> congela TUDO
              (global em index.css).
            </li>
          </ul>
        </Secao>
      </main>

      {/* diálogo fora das seções para não aninhar trigger dentro de trigger */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Diálogo espécime</DialogTitle>
            <DialogDescription>
              Borda, sombra e fundo vidro mudam entre os temas — validar legibilidade nos dois.
            </DialogDescription>
          </DialogHeader>
          <p className="text-[13px] text-t1">
            Conteúdo de exemplo com <span className="font-bold text-t0">ênfase</span> e um valor
            mono: <span className="font-mono tabular-nums text-acc">R$ 1.234,56</span>.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
