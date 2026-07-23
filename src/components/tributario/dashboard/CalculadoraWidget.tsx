import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CenarioResumo { regime: string; totalAPagar: number; cargaEfetiva: number }
interface ResultadoSalvo { totalAPagar?: number; cargaEfetiva?: number; cenarios?: CenarioResumo[] }

export function CalculadoraWidget() {
  const { data } = useQuery({
    queryKey: ['calculadora-ultimo-cenario'],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from('regimes_simulados')
        .select('regime, resultado, created_at')
        .contains('parametros', { tipo_calculo: 'calculadora' })
        .order('created_at', { ascending: false })
        .limit(1);
      return rows?.[0] ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const r = (data.resultado ?? {}) as ResultadoSalvo;
    const cenarios = r.cenarios ?? [];
    const melhor = cenarios.reduce<CenarioResumo | null>(
      (a, c) => (a === null || c.totalAPagar < a.totalAPagar ? c : a),
      null,
    );
    const pior = cenarios.reduce<CenarioResumo | null>(
      (a, c) => (a === null || c.totalAPagar > a.totalAPagar ? c : a),
      null,
    );
    const economia = melhor && pior ? pior.totalAPagar - melhor.totalAPagar : 0;
    return {
      regime: data.regime,
      cargaEfetiva: r.cargaEfetiva ?? 0,
      economia,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" /> Calculadora Tributária
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Regime</p>
              <p className="text-sm font-semibold">{stats.regime}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Carga efetiva</p>
              <p className="text-sm font-semibold">{stats.cargaEfetiva.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Economia/ano</p>
              <p className="text-sm font-semibold text-success">
                {stats.economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum cenário salvo. Abra a calculadora para simular.</p>
        )}
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to="/tributario/calculadora">
            Abrir calculadora <ArrowRight className="h-3 w-3 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
