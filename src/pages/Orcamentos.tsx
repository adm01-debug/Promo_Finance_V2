import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Pencil, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { useBudgetsWithSpent, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudget';
import { useCategorias } from '@/hooks/useCategorias';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { useZodForm } from '@/hooks/useZodForm';
import { z } from 'zod';
import { getCurrentEmpresaId } from '@/hooks/useUserEmpresas';

const budgetSchema = z.object({
  category: z.string().min(1, 'Selecione uma categoria'),
  budgeted_amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  period: z.string().min(7, 'Selecione o período'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const Orcamentos = () => {
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const companyId = getCurrentEmpresaId();
  const { data: budgets = [], isLoading } = useBudgetsWithSpent(selectedPeriod, companyId || undefined);
  const { categoriasDespesa } = useCategorias('despesa');
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const companyId = getCurrentEmpresaId();

  const form = useZodForm({
    schema: budgetSchema as any,
    initialValues: {
      category: '',
      budgeted_amount: 0,
      period: selectedPeriod,
    },
    onSubmit: async (data: BudgetFormData) => {
      if (editingBudget) {
        await updateBudget.mutateAsync({ 
          id: editingBudget.id, 
          data: {
            category: data.category,
            budgeted_amount: data.budgeted_amount,
            period: data.period
          } 
        });
      } else {
        await createBudget.mutateAsync({ 
          category: data.category,
          budgeted_amount: data.budgeted_amount,
          period: data.period,
          company_id: companyId || undefined
        });
      }
      setIsDialogOpen(false);
      form.resetForm();
      setEditingBudget(null);
    },
  });

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    form.setValues({
      category: budget.category,
      budgeted_amount: Number(budget.budgeted_amount),
      period: budget.period,
    });
    setIsDialogOpen(true);
  };

  const totals = React.useMemo(() => {
    const totalBudgeted = budgets.reduce((acc, curr) => acc + Number(curr.budgeted_amount), 0);
    const totalSpent = budgets.reduce((acc, curr) => acc + curr.actual_spent, 0);
    const remaining = totalBudgeted - totalSpent;
    const percent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return { totalBudgeted, totalSpent, remaining, percent };
  }, [budgets]);

  const chartData = budgets.map(b => ({
    name: b.category,
    Orçado: Number(b.budgeted_amount),
    Gasto: b.actual_spent,
  }));

  if (isLoading) return <MainLayout><div className="p-8">Carregando orçamentos...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Gestão de Orçamentos" 
            subtitle="Controle de gastos por categoria e acompanhamento orçamentário em tempo real."
            badge="Governança 10/10"
            icon={Target}
            gradientFrom="from-blue-600"
            gradientVia="via-primary"
            gradientTo="to-indigo-500"
          >
            <div className="flex items-center gap-3">
              <Input 
                type="month" 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-40 bg-white/5 border-white/10 text-white"
              />
              <Button onClick={() => {
                setEditingBudget(null);
                form.resetForm({ period: selectedPeriod });
                setIsDialogOpen(true);
              }} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </div>
          </PageHeader>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase border-blue-500/30 text-blue-500">
                    Total Orçado
                  </Badge>
                </div>
                <div className="text-2xl font-black text-white">{formatCurrency(totals.totalBudgeted)}</div>
                <p className="text-xs text-white/40 mt-1">Planejado para {selectedPeriod}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase border-orange-500/30 text-orange-500">
                    Total Gasto
                  </Badge>
                </div>
                <div className="text-2xl font-black text-white">{formatCurrency(totals.totalSpent)}</div>
                <p className="text-xs text-white/40 mt-1">{totals.percent.toFixed(1)}% do orçamento consumido</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase border-green-500/30 text-green-500">
                    Restante
                  </Badge>
                </div>
                <div className="text-2xl font-black text-white">{formatCurrency(totals.remaining)}</div>
                <p className="text-xs text-white/40 mt-1">Saldo disponível para o período</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">
                    Consumo Geral
                  </Badge>
                </div>
                <div className="text-2xl font-black text-white">{totals.percent.toFixed(0)}%</div>
                <Progress value={totals.percent} className="h-2 mt-3 bg-white/5" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Orçamentos por Categoria</CardTitle>
                  <CardDescription>Acompanhe o status de cada categoria individualmente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {budgets.length === 0 ? (
                      <div className="text-center py-12 text-white/40">
                        Nenhum orçamento definido para este período.
                      </div>
                    ) : (
                      budgets.map((budget: any) => {
                        const statusColor = budget.percent_used > 100 ? 'bg-red-500' : budget.percent_used > 85 ? 'bg-yellow-500' : 'bg-green-500';
                        const textColor = budget.percent_used > 100 ? 'text-red-500' : budget.percent_used > 85 ? 'text-yellow-500' : 'text-green-500';

                        return (
                          <div key={budget.id} className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-white flex items-center gap-2">
                                  {budget.category}
                                  {budget.percent_used > 90 && (
                                    <AlertTriangle className={`h-4 w-4 ${textColor} animate-pulse`} />
                                  )}
                                </h4>
                                <p className="text-xs text-white/40">Periodo: {budget.period}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)} className="h-8 w-8 text-white/40 hover:text-white">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteBudget.mutate(budget.id)} className="h-8 w-8 text-white/40 hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Orçado</p>
                                <p className="text-sm font-bold text-white">{formatCurrency(budget.budgeted_amount)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Gasto</p>
                                <p className="text-sm font-bold text-white">{formatCurrency(budget.actual_spent)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Status</p>
                                <p className={`text-sm font-black ${textColor}`}>{budget.percent_used.toFixed(1)}%</p>
                              </div>
                            </div>

                            <Progress value={Math.min(budget.percent_used, 100)} className={`h-1.5 bg-white/10 ${statusColor}`} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Análise de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={10} 
                          width={80}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="Orçado" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="Gasto" fill="#f97316" radius={[0, 4, 4, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-white">Insight Quantum</h4>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Com base nos lançamentos atuais, você já consumiu <strong>{totals.percent.toFixed(1)}%</strong> do orçamento total. 
                    {totals.percent > 90 ? ' Recomendamos cautela nos próximos lançamentos para evitar estouro orçamentário.' : ' O ritmo de gastos está dentro do esperado para o período.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</DialogTitle>
            <DialogDescription className="text-white/40">
              Defina o limite de gastos para uma categoria específica no período selecionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={form.values.category} 
                onValueChange={(val) => form.setFieldValue('category', val)}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white">
                  {categoriasDespesa.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.errors.category && <p className="text-xs text-red-500">{form.errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label>Valor Orçado (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                {...form.getFieldProps('budgeted_amount')}
                className="bg-white/5 border-white/10"
                placeholder="0,00"
              />
              {form.errors.budgeted_amount && <p className="text-xs text-red-500">{form.errors.budgeted_amount}</p>}
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Input 
                type="month" 
                {...form.getFieldProps('period')}
                className="bg-white/5 border-white/10"
              />
              {form.errors.period && <p className="text-xs text-red-500">{form.errors.period}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-white/40">
                Cancelar
              </Button>
              <Button type="submit" disabled={createBudget.isPending || updateBudget.isPending} className="bg-primary hover:bg-primary/90">
                {editingBudget ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Orcamentos;
