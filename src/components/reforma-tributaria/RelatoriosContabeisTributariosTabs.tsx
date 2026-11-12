import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { DRETributarioTab } from './relatorios-tributarios/DRETributarioTab';
import { CargaEfetivaTab } from './relatorios-tributarios/CargaEfetivaTab';
import type { TipoRelatorio } from './RelatoriosContabeisTributarios.types';
import { CORES_GRAFICO } from './RelatoriosContabeisTributarios.helpers';

interface RelatoriosContabeisTributariosTabsProps {
  tipoRelatorio: TipoRelatorio;
  setTipoRelatorio: import('react').Dispatch<import('react').SetStateAction<TipoRelatorio>>;
  linhasDRE: (
    | {
        grupo: string;
        nivel: number;
        bold: boolean;
        valor?: undefined;
        separador?: undefined;
        destaque?: undefined;
        percentual?: undefined;
      }
    | {
        grupo: string;
        nivel: number;
        valor: number;
        bold?: undefined;
        separador?: undefined;
        destaque?: undefined;
        percentual?: undefined;
      }
    | {
        grupo: string;
        nivel: number;
        separador: boolean;
        bold?: undefined;
        valor?: undefined;
        destaque?: undefined;
        percentual?: undefined;
      }
    | {
        grupo: string;
        nivel: number;
        bold: boolean;
        destaque: boolean;
        valor?: undefined;
        separador?: undefined;
        percentual?: undefined;
      }
    | {
        grupo: string;
        nivel: number;
        bold: boolean;
        destaque: boolean;
        valor: number;
        separador?: undefined;
        percentual?: undefined;
      }
    | {
        grupo: string;
        nivel: number;
        percentual: number;
        bold?: undefined;
        valor?: undefined;
        separador?: undefined;
        destaque?: undefined;
      }
  )[];
  empresaSelecionada: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  };
  periodoInicio: string;
  periodoFim: string;
  faturamentoPeriodo: number;
  totais: {
    cbsDebitos: number;
    cbsCreditos: number;
    cbsAPagar: number;
    ibsDebitos: number;
    ibsCreditos: number;
    ibsAPagar: number;
    isAPagar: number;
    pisResidual: number;
    cofinsResidual: number;
    icmsResidual: number;
    issResidual: number;
  };
  dadosDistribuicao: { name: string; value: number }[];
  dadosEvolucao: {
    competencia: string;
    cbs: number;
    ibs: number;
    residuais: number;
    total: number;
  }[];
  creditos: import('@/hooks/useCreditosTributarios').CreditoTributario[];
  cargaTributariaEfetiva: number;
}

export function RelatoriosContabeisTributariosTabs({
  tipoRelatorio,
  setTipoRelatorio,
  linhasDRE,
  empresaSelecionada,
  periodoInicio,
  periodoFim,
  faturamentoPeriodo,
  totais,
  dadosDistribuicao,
  dadosEvolucao,
  creditos,
  cargaTributariaEfetiva,
}: RelatoriosContabeisTributariosTabsProps) {
  return (
    <Tabs value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as TipoRelatorio)}>
      <TabsList>
        <TabsTrigger value="dre-tributario">DRE Tributário</TabsTrigger>
        <TabsTrigger value="balancete">Balancete</TabsTrigger>
        <TabsTrigger value="comparativo">Evolução</TabsTrigger>
        <TabsTrigger value="creditos">Créditos</TabsTrigger>
        <TabsTrigger value="carga-efetiva">Carga Efetiva</TabsTrigger>
      </TabsList>

      <TabsContent value="dre-tributario">
        <DRETributarioTab
          linhasDRE={linhasDRE}
          empresaNome={empresaSelecionada?.razao_social || ''}
          periodoInicio={periodoInicio}
          periodoFim={periodoFim}
          faturamentoPeriodo={faturamentoPeriodo}
        />
      </TabsContent>

      {/* Balancete */}
      <TabsContent value="balancete">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Débitos e Créditos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tributo</TableHead>
                    <TableHead className="text-right">Débitos</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">CBS</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(totais.cbsDebitos)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(totais.cbsCreditos)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totais.cbsAPagar)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IBS</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(totais.ibsDebitos)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(totais.ibsCreditos)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totais.ibsAPagar)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IS</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(totais.isAPagar)}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totais.isAPagar)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(totais.cbsDebitos + totais.ibsDebitos + totais.isAPagar)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Tributo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={dadosDistribuicao}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {dadosDistribuicao.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Evolução */}
      <TabsContent value="comparativo">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competencia" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cbs" name="CBS" stackId="a" fill={CORES_GRAFICO[0]} />
                <Bar dataKey="ibs" name="IBS" stackId="a" fill={CORES_GRAFICO[1]} />
                <Bar dataKey="residuais" name="Residuais" stackId="a" fill={CORES_GRAFICO[2]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Créditos */}
      <TabsContent value="creditos">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Créditos Tributários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 bg-success/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Créditos Gerados</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Créditos Utilizados</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}
                </p>
              </div>
              <div className="p-4 bg-secondary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(
                    creditos
                      .filter((c) => c.status === 'disponivel')
                      .reduce((s, c) => s + (c.saldo_disponivel || 0), 0)
                  )}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tributo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Valor Original</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditos.slice(0, 10).map((credito) => (
                  <TableRow key={credito.id}>
                    <TableCell>
                      <Badge variant="outline">{credito.tipo_tributo}</Badge>
                    </TableCell>
                    <TableCell>{credito.tipo_credito}</TableCell>
                    <TableCell>{credito.competencia_origem}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(credito.valor_credito)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(credito.saldo_disponivel || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={credito.status === 'disponivel' ? 'default' : 'secondary'}>
                        {credito.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="carga-efetiva">
        <CargaEfetivaTab
          totais={totais}
          faturamentoPeriodo={faturamentoPeriodo}
          cargaTributariaEfetiva={cargaTributariaEfetiva}
        />
      </TabsContent>
    </Tabs>
  );
}
