import { motion } from "framer-motion";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Target, Users, Building2, AlertTriangle, BarChart3, LineChart as LineChartIcon, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { PositionBadge, getRankFromScore, RankBadge, RankLegend } from "@/components/ui/rank-badge";

interface EmpresaComparativo {
  id: string;
  nome: string;
  cnpj: string;
  receitas: number;
  despesas: number;
  lucro: number;
  margem: number;
  saldo: number;
  aReceber: number;
  aPagar: number;
  inadimplencia: number;
  liquidez: number;
  contasCount: number;
  ticketMedio: number;
  saldoProjetado: number;
}

interface BIEmpresasTabProps {
  comparativoEmpresas: EmpresaComparativo[];
}

export function BIEmpresasTab({ comparativoEmpresas }: BIEmpresasTabProps) {
  return (
    <div className="space-y-4">
      {/* Ranking Cards */}
      {comparativoEmpresas.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {comparativoEmpresas.slice(0, 3).map((emp, index) => (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                index === 0 && "ring-2 ring-rank-gold/50 hover:shadow-glow-coins",
                index === 1 && "ring-1 ring-rank-silver/30",
                index === 2 && "ring-1 ring-rank-bronze/30"
              )}>
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1",
                  index === 0 && "bg-gradient-to-r from-yellow-400 to-amber-500",
                  index === 1 && "bg-gradient-to-r from-gray-300 to-gray-400",
                  index === 2 && "bg-gradient-to-r from-amber-600 to-amber-700"
                )} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <PositionBadge position={index + 1} size="lg" />
                    {index === 0 && <Crown className="w-6 h-6 text-coins animate-wiggle" />}
                  </div>
                  <CardTitle className="text-lg mt-2 truncate" title={emp.nome}>{emp.nome}</CardTitle>
                  <CardDescription className="text-xs">{emp.cnpj}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Lucro</p>
                      <p className={cn("text-lg font-bold", emp.lucro >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(emp.lucro)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Margem</p>
                      <RankBadge rank={getRankFromScore(emp.margem, { gold: 25, silver: 15, bronze: 5 })} label={`${emp.margem.toFixed(1)}%`} showIcon={false} size="sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Liquidez</p>
                      <RankBadge rank={getRankFromScore(emp.liquidez * 100, { gold: 200, silver: 150, bronze: 100 })} label={`${emp.liquidez.toFixed(2)}x`} showIcon={false} size="sm" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Adimplência</p>
                      <RankBadge rank={getRankFromScore(100 - emp.inadimplencia, { gold: 95, silver: 85, bronze: 70 })} label={`${(100 - emp.inadimplencia).toFixed(1)}%`} showIcon={false} size="sm" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chart comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo Visual</CardTitle>
          <CardDescription>Receitas, Despesas e Lucro por empresa</CardDescription>
        </CardHeader>
        <CardContent>
          {comparativoEmpresas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparativoEmpresas}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhuma empresa cadastrada</p>
          )}
        </CardContent>
      </Card>

      {/* KPIs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                KPIs por Empresa (Lado a Lado)
              </CardTitle>
              <CardDescription>Comparativo detalhado de indicadores financeiros</CardDescription>
            </div>
            <RankLegend />
          </div>
        </CardHeader>
        <CardContent>
          {comparativoEmpresas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold border-b sticky left-0 bg-muted/50 z-10">Indicador</th>
                    {comparativoEmpresas.map((emp, index) => (
                      <th key={emp.id} className="text-center py-3 px-4 font-semibold border-b min-w-[150px]">
                        <div className="flex flex-col items-center gap-1">
                          <PositionBadge position={index + 1} size="sm" />
                          <div className="truncate max-w-[140px] mt-1" title={emp.nome}>{emp.nome}</div>
                          <div className="text-xs font-normal text-muted-foreground">{emp.cnpj}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Saldo Atual', icon: DollarSign, iconColor: 'text-primary', getValue: (e: EmpresaComparativo) => formatCurrency(e.saldo), getClass: () => 'font-medium' },
                    { label: 'Receitas (Pagas)', icon: ArrowUpRight, iconColor: 'text-success', getValue: (e: EmpresaComparativo) => formatCurrency(e.receitas), getClass: () => 'text-success' },
                    { label: 'Despesas (Pagas)', icon: ArrowDownRight, iconColor: 'text-destructive', getValue: (e: EmpresaComparativo) => formatCurrency(e.despesas), getClass: () => 'text-destructive' },
                    { label: 'Lucro Líquido', icon: Target, iconColor: 'text-primary', getValue: (e: EmpresaComparativo) => formatCurrency(e.lucro), getClass: (e: EmpresaComparativo) => `font-bold ${e.lucro >= 0 ? 'text-success' : 'text-destructive'}`, highlight: true },
                    { label: 'A Receber (Pendente)', icon: ArrowUpRight, iconColor: 'text-success', getValue: (e: EmpresaComparativo) => formatCurrency(e.aReceber), getClass: () => '' },
                    { label: 'A Pagar (Pendente)', icon: ArrowDownRight, iconColor: 'text-warning', getValue: (e: EmpresaComparativo) => formatCurrency(e.aPagar), getClass: () => '' },
                    { label: 'Saldo Projetado', icon: LineChartIcon, iconColor: 'text-chart-3', getValue: (e: EmpresaComparativo) => formatCurrency(e.saldoProjetado), getClass: (e: EmpresaComparativo) => `font-medium ${e.saldoProjetado >= 0 ? 'text-success' : 'text-destructive'}`, highlight: true },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr key={row.label} className={cn("hover:bg-muted/30 transition-colors", row.highlight && "bg-muted/20")}>
                        <td className={cn("py-3 px-4 border-b font-medium sticky left-0", row.highlight ? "bg-muted/20" : "bg-background")}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${row.iconColor}`} />
                            {row.label}
                          </div>
                        </td>
                        {comparativoEmpresas.map((emp) => (
                          <td key={emp.id} className={`text-right py-3 px-4 border-b ${row.getClass(emp)}`}>
                            {row.getValue(emp)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Badge rows */}
                  {[
                    { label: 'Margem de Lucro', icon: TrendingUp, iconColor: 'text-chart-2', getValue: (e: EmpresaComparativo) => `${e.margem.toFixed(1)}%`, getVariant: (e: EmpresaComparativo) => e.margem >= 20 ? "default" as const : e.margem >= 10 ? "secondary" as const : "destructive" as const },
                    { label: 'Inadimplência', icon: AlertTriangle, iconColor: 'text-destructive', getValue: (e: EmpresaComparativo) => `${e.inadimplencia.toFixed(1)}%`, getVariant: (e: EmpresaComparativo) => e.inadimplencia <= 5 ? "default" as const : e.inadimplencia <= 15 ? "secondary" as const : "destructive" as const },
                    { label: 'Índice de Liquidez', icon: DollarSign, iconColor: 'text-chart-4', getValue: (e: EmpresaComparativo) => `${e.liquidez.toFixed(2)}x`, getVariant: (e: EmpresaComparativo) => e.liquidez >= 1.5 ? "default" as const : e.liquidez >= 1 ? "secondary" as const : "destructive" as const },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr key={row.label} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                          <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${row.iconColor}`} />{row.label}</div>
                        </td>
                        {comparativoEmpresas.map((emp) => (
                          <td key={emp.id} className="text-right py-3 px-4 border-b">
                            <Badge variant={row.getVariant(emp)}>{row.getValue(emp)}</Badge>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Ticket Médio */}
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                      <div className="flex items-center gap-2"><Users className="w-4 h-4 text-chart-5" />Ticket Médio</div>
                    </td>
                    {comparativoEmpresas.map((emp) => (
                      <td key={emp.id} className="text-right py-3 px-4 border-b">{formatCurrency(emp.ticketMedio)}</td>
                    ))}
                  </tr>
                  {/* Contas Bancárias */}
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium sticky left-0 bg-background">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />Contas Bancárias</div>
                    </td>
                    {comparativoEmpresas.map((emp) => (
                      <td key={emp.id} className="text-right py-3 px-4"><Badge variant="outline">{emp.contasCount}</Badge></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhuma empresa cadastrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
