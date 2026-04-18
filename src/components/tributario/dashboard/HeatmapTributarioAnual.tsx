import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHeatmapTributario } from '@/hooks/useHeatmapTributario';
import { Download, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const TRIBUTOS = [
  { key: 'cbs', label: 'CBS', token: 'cbs' },
  { key: 'ibs', label: 'IBS', token: 'ibs' },
  { key: 'imposto_seletivo', label: 'IS', token: 'imposto-seletivo' },
  { key: 'pis', label: 'PIS', token: 'primary' },
  { key: 'cofins', label: 'COFINS', token: 'primary' },
  { key: 'icms', label: 'ICMS', token: 'secondary' },
  { key: 'iss', label: 'ISS', token: 'secondary' },
  { key: 'irpj_csll', label: 'IRPJ/CSLL', token: 'destructive' },
];

interface Props {
  empresaId?: string;
}

export function HeatmapTributarioAnual({ empresaId }: Props) {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [modo, setModo] = useState<'absoluto' | 'relativo'>('relativo');
  const gridRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useHeatmapTributario(empresaId, ano);

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const getCelula = (mes: number, tributo: string) =>
    data?.celulas.find((c) => c.mes === mes && c.tributo === tributo);

  const exportarPNG = async () => {
    if (!gridRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(gridRef.current, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = `heatmap-tributario-${ano}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-primary" />
            Heatmap Tributário Anual
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {[0, 1, 2].map((d) => {
                const y = new Date().getFullYear() - d;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <Button size="sm" variant="outline" onClick={() => setModo(modo === 'absoluto' ? 'relativo' : 'absoluto')}>
              {modo === 'absoluto' ? 'Absoluto' : 'Relativo'}
            </Button>
            <Button size="sm" variant="outline" onClick={exportarPNG}>
              <Download className="h-4 w-4 mr-1" /> PNG
            </Button>
          </div>
        </div>
        {data && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" /> Pico: {MESES[data.insights.mes_pico - 1]}
            </Badge>
            {data.insights.mes_vale && (
              <Badge variant="outline" className="text-xs">
                <TrendingDown className="h-3 w-3 mr-1" /> Vale: {MESES[data.insights.mes_vale - 1]}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">Total: {fmtBRL(data.total_ano)}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Selecione uma empresa e ano para visualizar.</p>
        ) : (
          <div ref={gridRef} className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left p-1 font-medium text-muted-foreground">Tributo</th>
                  {MESES.map((m) => (
                    <th key={m} className="p-1 text-center font-medium text-muted-foreground">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRIBUTOS.map((trib) => (
                  <tr key={trib.key}>
                    <td className="p-1 font-medium">{trib.label}</td>
                    {MESES.map((_, i) => {
                      const mes = i + 1;
                      const c = getCelula(mes, trib.key);
                      const intensidade = c?.intensidade ?? 0;
                      const opacity = modo === 'relativo' ? Math.max(0.08, intensidade) : Math.min(1, (c?.valor ?? 0) / Math.max(1, data.max_valor));
                      return (
                        <motion.td
                          key={mes}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          title={`${trib.label} ${MESES[i]}/${ano}\nValor: ${fmtBRL(c?.valor ?? 0)}${c?.variacao_mom != null ? `\nMoM: ${c.variacao_mom.toFixed(1)}%` : ''}`}
                          className="rounded text-center font-mono cursor-help transition-transform hover:scale-110"
                          style={{
                            backgroundColor: `hsl(var(--${trib.token}) / ${opacity})`,
                            padding: '8px 4px',
                            minWidth: 40,
                            color: opacity > 0.5 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                          }}
                        >
                          {(c?.valor ?? 0) > 0 ? Math.round((c?.valor ?? 0) / 1000) + 'k' : '—'}
                        </motion.td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
