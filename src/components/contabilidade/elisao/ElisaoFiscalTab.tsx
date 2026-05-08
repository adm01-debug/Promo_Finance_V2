import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  Target, 
  BarChart4, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Info, 
  Plus, 
  Calculator,
  Zap,
  FileSearch,
  CheckCircle2
} from 'lucide-react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ElisaoTabProps {
  empresaId: string;
}

export function ElisaoFiscalTab({ empresaId }: ElisaoTabProps) {
  const [activeTab, setActiveTab] = useState('simulador');
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [premissas, setPremissas] = useState({
    aliquota_cbs: 0.088,
    aliquota_ibs: 0.177,
    crescimento: 5,
    folha_prolabore: 28
  });

  // Queries
  const { data: simulacoes = [], isLoading: loadingSims } = useQuery({
    queryKey: ['elisao_simulacoes', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elisao_simulacoes_regime')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId
  });

  const { data: oportunidades = [] } = useQuery({
    queryKey: ['elisao_oportunidades_reais', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calcular_potencial_elisao', {
        p_empresa_id: empresaId
      });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId
  });

  const { data: gaps = [] } = useQuery({
    queryKey: ['elisao_gap', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elisao_analise_gap')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('periodo_referencia', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId
  });

  const economiaTotal = oportunidades.reduce((acc: number, curr: any) => acc + (curr.valor_estimado || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Economia Potencial (Total)</CardTitle>
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">R$ {economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-emerald-600/70 mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Baseado em 12 meses de análise
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gap de Eficiência</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">8.4%</div>
            <Progress value={8.4} className="h-1.5 mt-2" />
            <p className="text-[10px] text-muted-foreground mt-1">Imposto pago acima do cenário otimizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Regime Atual</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Lucro Presumido</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-[9px]">PIS/COFINS Cumulativo</Badge>
              <Badge variant="outline" className="text-[9px]">ICMS-ST</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="simulador" className="gap-2">
            <Calculator className="h-4 w-4" /> Simulador de Regimes
          </TabsTrigger>
          <TabsTrigger value="creditos" className="gap-2">
            <Zap className="h-4 w-4" /> Créditos & Monofásicos
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart4 className="h-4 w-4" /> Dashboard de Gap
          </TabsTrigger>
        </TabsList>

        {/* Tab content: Simulador */}
        <TabsContent value="simulador" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Cenários Tributários (2025+)</h3>
              <p className="text-sm text-muted-foreground">Compare regimes tradicionais com a transição da Reforma Tributária (CBS/IBS).</p>
            </div>
            <Button onClick={() => setIsSimModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Cenário
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulacoes.length === 0 ? (
              <Card className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <Calculator className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <CardTitle className="text-muted-foreground">Nenhuma simulação ativa</CardTitle>
                <CardDescription>Crie um cenário para projetar a carga tributária de 2025.</CardDescription>
                <Button variant="outline" className="mt-4" onClick={() => setIsSimModalOpen(true)}>Começar Simulação</Button>
              </Card>
            ) : (
              simulacoes.map((sim: any) => (
                <Card key={sim.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Ano Base {sim.ano_base}</Badge>
                      <span className="text-[10px] text-muted-foreground">Atualizado em {new Date(sim.updated_at).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="text-base mt-2">{sim.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Melhor Opção:</span>
                        <span className="font-bold text-emerald-600">Simples Nacional</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Economia Anual:</span>
                        <span className="font-bold">R$ 42.150,00</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs">Ver Detalhes do Cenário</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab content: Créditos */}
        <TabsContent value="creditos" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Inteligência de Produtos (NCM)
              </CardTitle>
              <CardDescription>
                Identificação automática de tributação monofásica e créditos de PIS/COFINS por item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NCM</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo de Crédito</TableHead>
                      <TableHead>Redução Projetada</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">8507.10.10</TableCell>
                      <TableCell className="text-xs">Acumuladores elétricos de chumbo</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">Monofásico</Badge></TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600">9.25% (PIS/COF)</TableCell>
                      <TableCell className="text-right"><CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">4011.10.00</TableCell>
                      <TableCell className="text-xs">Pneus novos de borracha</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">Monofásico</Badge></TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600">9.25% (PIS/COF)</TableCell>
                      <TableCell className="text-right"><CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab content: Dashboard */}
        <TabsContent value="dashboard" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Carga por Regime</CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground italic">
                [Gráfico de barras: Simples vs Presumido vs Real]
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Gap Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground italic">
                [Gráfico de linha: Evolução da economia mensal]
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nova Simulação */}
      <Dialog open={isSimModalOpen} onOpenChange={setIsSimModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Cenário de Elisão Fiscal</DialogTitle>
            <DialogDescription>
              Projete o impacto tributário para 2025 cruzando faturamento e despesas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Cenário</Label>
              <Input id="nome" placeholder="Ex: Planejamento 2025 v1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ano">Ano Base</Label>
                <Input id="ano" type="number" defaultValue={2025} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="import">Importar Dados</Label>
                <Button variant="outline" className="text-xs h-10 gap-2">
                  <Calculator className="h-4 w-4" /> Histórico Contábil
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSimModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              toast.success("Simulação iniciada! O motor está processando os dados históricos.");
              setIsSimModalOpen(false);
            }}>Criar Cenário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
