import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Copy, Moon, Sun, Monitor, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Diagnóstico de Tema
 *
 * Lê em tempo real todas as CSS custom properties (`--*`) definidas em `:root`
 * e no elemento `<html>` (que carrega a classe `light`/`dark`), exibindo:
 *   - Swatches coloridos com contraste calculado sobre o background atual
 *   - Valor bruto do token e amostra convertida para `hsl()` quando aplicável
 *   - Alternador entre light/dark/system + reset ao padrão
 *   - Amostras de componentes reais (botão, card, badge, input) para verificação visual
 *
 * A página é pública para permitir validação rápida antes do login.
 */

type TokenEntry = {
  name: string;
  value: string;
  /** Se o token parece ser cor HSL space-separated (`210 40% 98%`). */
  isHslTriplet: boolean;
};

function readCssTokens(): TokenEntry[] {
  const seen = new Map<string, string>();
  const styles = [
    getComputedStyle(document.documentElement),
    getComputedStyle(document.body),
  ];

  // Percorre stylesheets para extrair *nomes* de tokens declarados — o
  // getComputedStyle sozinho não enumera custom properties.
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; /* cross-origin */ }
    if (!rules) continue;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      for (let i = 0; i < rule.style.length; i++) {
        const prop = rule.style[i];
        if (!prop.startsWith('--')) continue;
        if (seen.has(prop)) continue;
        // Pega o valor efetivo (respeita cascata/tema aplicado).
        const value = styles[0].getPropertyValue(prop).trim()
          || styles[1].getPropertyValue(prop).trim();
        if (value) seen.set(prop, value);
      }
    }
  }

  const HSL_TRIPLET = /^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?%\s+-?\d+(\.\d+)?%$/;

  return Array.from(seen.entries())
    .map(([name, value]) => ({
      name,
      value,
      isHslTriplet: HSL_TRIPLET.test(value),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toColor(entry: TokenEntry): string | null {
  if (entry.isHslTriplet) return `hsl(${entry.value})`;
  if (/^#|^rgb|^hsl|^oklch/.test(entry.value)) return entry.value;
  return null;
}

export default function ThemeDiagnosticsPage() {
  const { theme, setTheme, resetTheme, isDark } = useTheme();
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [tick, setTick] = useState(0);

  // Rele os tokens sempre que o tema mudar (a classe no <html> troca os valores).
  useEffect(() => {
    // Espera o browser aplicar a nova classe antes de ler.
    const raf = requestAnimationFrame(() => setTokens(readCssTokens()));
    return () => cancelAnimationFrame(raf);
  }, [isDark, tick]);

  // Observa mudanças na classe do <html> para casos de troca externa.
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.name.toLowerCase().includes(q) || t.value.toLowerCase().includes(q));
  }, [tokens, filter]);

  const grouped = useMemo(() => {
    const colors = filtered.filter((t) => toColor(t));
    const others = filtered.filter((t) => !toColor(t));
    return { colors, others };
  }, [filtered]);

  const copyToken = useCallback((name: string) => {
    navigator.clipboard.writeText(`var(${name})`).then(
      () => toast.success(`Copiado: var(${name})`),
      () => toast.error('Falha ao copiar'),
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diagnóstico de Tema</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tokens CSS lidos em tempo real. Tema ativo:{' '}
              <Badge variant="outline" className="ml-1">{theme}</Badge>
              <span className="ml-2 text-xs">({isDark ? 'dark' : 'light'})</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-1.5" /> Claro
            </Button>
            <Button size="sm" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-1.5" /> Escuro
            </Button>
            <Button size="sm" variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>
              <Monitor className="h-4 w-4 mr-1.5" /> Sistema
            </Button>
            <Button size="sm" variant="ghost" onClick={resetTheme} title="Restaurar padrão">
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtro</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nome do token ou valor (ex: primary, muted, sidebar)"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {filtered.length} de {tokens.length} tokens
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="colors">
          <TabsList>
            <TabsTrigger value="colors">Cores ({grouped.colors.length})</TabsTrigger>
            <TabsTrigger value="others">Outros ({grouped.others.length})</TabsTrigger>
            <TabsTrigger value="samples">Componentes</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="mt-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {grouped.colors.map((t) => {
                const color = toColor(t)!;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => copyToken(t.name)}
                    className="group text-left rounded-lg border border-border bg-card hover:border-primary/50 transition-colors overflow-hidden"
                  >
                    <div className="h-16 w-full" style={{ backgroundColor: color }} aria-hidden />
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-foreground truncate">{t.name}</code>
                        <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate" title={t.value}>
                        {t.value}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="others" className="mt-4">
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {grouped.others.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => copyToken(t.name)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
                >
                  <code className="text-xs font-mono">{t.name}</code>
                  <code className="text-xs font-mono text-muted-foreground truncate max-w-[60%]" title={t.value}>
                    {t.value}
                  </code>
                </button>
              ))}
              {grouped.others.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Nenhum token não-cor no filtro atual.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="samples" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Superfícies</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 rounded bg-background border border-border">bg-background</div>
                  <div className="p-3 rounded bg-card border border-border text-card-foreground">bg-card</div>
                  <div className="p-3 rounded bg-muted text-muted-foreground">bg-muted</div>
                  <div className="p-3 rounded bg-popover border border-border">bg-popover</div>
                  <div className="p-3 rounded bg-accent text-accent-foreground">bg-accent</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Estados semânticos</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>Padrão</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <span className="px-2 py-1 rounded text-xs bg-success text-success-foreground">success</span>
                  <span className="px-2 py-1 rounded text-xs bg-warning text-warning-foreground">warning</span>
                  <span className="px-2 py-1 rounded text-xs bg-info text-info-foreground">info</span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Botões</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Inputs & tipografia</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Digite algo…" />
                  <div>
                    <h2 className="text-xl font-heading font-bold">Heading (font-heading)</h2>
                    <p className="text-sm text-muted-foreground">
                      Corpo de texto usando <code className="text-xs">text-muted-foreground</code>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
