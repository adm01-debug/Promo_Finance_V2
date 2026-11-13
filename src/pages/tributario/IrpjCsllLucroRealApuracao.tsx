import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { LABEL_ATIVIDADE, MODELOS_AJUSTE } from '@/lib/tributario/irpj-csll';
import type { AtividadePresuncao, FormaApuracao } from '@/lib/tributario/irpj-csll';
import { formatCurrency } from '@/lib/formatters';
import type { LinhaPeriodo } from './IrpjCsllLucroReal.types';
import { novoPeriodo, num } from './IrpjCsllLucroReal.helpers';
import { MemoriaTable } from './IrpjCsllLucroReal.MemoriaTable';

interface IrpjCsllLucroRealApuracaoProps {
  forma: FormaApuracao;
  setForma: import('react').Dispatch<import('react').SetStateAction<FormaApuracao>>;
  atividade:
    | 'comercio_industria'
    | 'revenda_combustivel'
    | 'transporte_carga'
    | 'transporte_passageiros'
    | 'servicos_gerais'
    | 'servicos_hospitalares'
    | 'servicos_ate_120k';
  setAtividade: import('react').Dispatch<
    import('react').SetStateAction<
      | 'comercio_industria'
      | 'revenda_combustivel'
      | 'transporte_carga'
      | 'transporte_passageiros'
      | 'servicos_gerais'
      | 'servicos_hospitalares'
      | 'servicos_ate_120k'
    >
  >;
  setPrejuizoInicial: import('react').Dispatch<import('react').SetStateAction<number>>;
  setBaseNegativaInicial: import('react').Dispatch<import('react').SetStateAction<number>>;
  periodos: LinhaPeriodo[];
  setPeriodos: import('react').Dispatch<import('react').SetStateAction<LinhaPeriodo[]>>;
  atualizar: (id: string, patch: Partial<LinhaPeriodo>) => void;
  adicionarAjuste: (periodoId: string, modeloIdx: number) => void;
  atualizarAjuste: (periodoId: string, ajusteId: string, valor: number) => void;
  removerAjuste: (periodoId: string, ajusteId: string) => void;
  resultado: import('@/lib/tributario/irpj-csll/types').ResultadoApuracao;
}

export function IrpjCsllLucroRealApuracao({
  forma,
  setForma,
  atividade,
  setAtividade,
  setPrejuizoInicial,
  setBaseNegativaInicial,
  periodos,
  setPeriodos,
  atualizar,
  adicionarAjuste,
  atualizarAjuste,
  removerAjuste,
  resultado,
}: IrpjCsllLucroRealApuracaoProps) {
  return (
    <Tabs defaultValue="apuracao" className="mt-6">
      <TabsList>
        <TabsTrigger value="apuracao">Apuração</TabsTrigger>
        <TabsTrigger value="lalur">LALUR Parte B</TabsTrigger>
        <TabsTrigger value="memoria">Memória de cálculo</TabsTrigger>
      </TabsList>

      <TabsContent value="apuracao" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parâmetros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Forma de apuração</Label>
              <Select value={forma} onValueChange={(v) => setForma(v as FormaApuracao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual_estimativa">Anual por estimativa mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Atividade (presunção da estimativa)</Label>
              <Select
                value={atividade}
                onValueChange={(v) => setAtividade(v as AtividadePresuncao)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LABEL_ATIVIDADE) as AtividadePresuncao[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LABEL_ATIVIDADE[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prejuízo fiscal acumulado</Label>
              <Input
                inputMode="decimal"
                defaultValue="0"
                onChange={(e) => setPrejuizoInicial(num(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Base negativa de CSLL</Label>
              <Input
                inputMode="decimal"
                defaultValue="0"
                onChange={(e) => setBaseNegativaInicial(num(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {periodos.map((p, idx) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{p.rotulo}</CardTitle>
              {periodos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPeriodos((prev) => prev.filter((x) => x.id !== p.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Lucro líquido contábil</Label>
                  <Input
                    inputMode="decimal"
                    defaultValue="0"
                    onChange={(e) => atualizar(p.id, { lucroLiquido: num(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receita bruta</Label>
                  <Input
                    inputMode="decimal"
                    defaultValue="0"
                    onChange={(e) => atualizar(p.id, { receitaBruta: num(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IRRF compensável</Label>
                  <Input
                    inputMode="decimal"
                    defaultValue="0"
                    onChange={(e) => atualizar(p.id, { irrf: num(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CSLL retida</Label>
                  <Input
                    inputMode="decimal"
                    defaultValue="0"
                    onChange={(e) => atualizar(p.id, { csllRetida: num(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Ajustes do LALUR Parte A</Label>
                  <Select onValueChange={(v) => adicionarAjuste(p.id, Number(v))}>
                    <SelectTrigger className="h-8 w-72">
                      <SelectValue placeholder="Adicionar ajuste…" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELOS_AJUSTE.map((m, i) => (
                        <SelectItem key={m.descricao} value={String(i)}>
                          {m.tipo === 'adicao' ? '(+) ' : '(−) '}
                          {m.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                {p.ajustes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum ajuste lançado.</p>
                ) : (
                  <div className="space-y-2">
                    {p.ajustes.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Badge variant={a.tipo === 'adicao' ? 'destructive' : 'secondary'}>
                          {a.tipo === 'adicao' ? 'Adição' : 'Exclusão'}
                        </Badge>
                        <span className="flex-1 text-sm">{a.descricao}</span>
                        <Badge variant="outline" className="text-xs">
                          {a.alvo.toUpperCase()}
                        </Badge>
                        <Input
                          className="w-40"
                          inputMode="decimal"
                          defaultValue="0"
                          onChange={(e) => atualizarAjuste(p.id, a.id, num(e.target.value))}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removerAjuste(p.id, a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3 text-sm md:grid-cols-4">
                <div>
                  Lucro real:{' '}
                  <strong className="tabular-nums">
                    {formatCurrency(resultado.periodos[idx]?.lucroReal ?? 0)}
                  </strong>
                </div>
                <div>
                  Base CSLL:{' '}
                  <strong className="tabular-nums">
                    {formatCurrency(resultado.periodos[idx]?.baseCsll ?? 0)}
                  </strong>
                </div>
                <div>
                  IRPJ:{' '}
                  <strong className="tabular-nums">
                    {formatCurrency(resultado.periodos[idx]?.irpjARecolher ?? 0)}
                  </strong>
                </div>
                <div>
                  CSLL:{' '}
                  <strong className="tabular-nums">
                    {formatCurrency(resultado.periodos[idx]?.csllARecolher ?? 0)}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={() =>
            setPeriodos((prev) => [
              ...prev,
              novoPeriodo(
                forma === 'trimestral' ? `${prev.length + 1}º Trimestre` : `Mês ${prev.length + 1}`
              ),
            ])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar período
        </Button>
      </TabsContent>

      <TabsContent value="lalur">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LALUR Parte B — controle de saldos</CardTitle>
            <CardDescription>
              Compensação limitada a 30% do lucro real (Lei 9.065/95, arts. 15 e 16).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Compensado (IRPJ)</TableHead>
                    <TableHead className="text-right">Compensado (CSLL)</TableHead>
                    <TableHead className="text-right">Prejuízo gerado</TableHead>
                    <TableHead className="text-right">Saldo prejuízo</TableHead>
                    <TableHead className="text-right">Saldo base negativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.periodos.map((p) => (
                    <TableRow key={p.rotulo}>
                      <TableCell>{p.rotulo}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.compensacaoPrejuizo)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.compensacaoBaseNegativa)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.prejuizoGerado)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.saldoFinal.prejuizoFiscal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.saldoFinal.baseNegativaCsll)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="memoria" className="space-y-4">
        {resultado.periodos.map((p) => (
          <Card key={p.rotulo}>
            <CardHeader>
              <CardTitle className="text-base">{p.rotulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <MemoriaTable linhas={p.memoria} />
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
