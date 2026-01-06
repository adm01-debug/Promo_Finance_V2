import { useState } from 'react';
import { motion } from 'framer-motion';
import { InteractivePageWrapper } from '@/components/wrappers';
import { FileText, TrendingUp, Scale, Wallet, Download, Calendar, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DREStatement } from '@/components/demonstrativos/DREStatement';
import { BalancoPatrimonial } from '@/components/demonstrativos/BalancoPatrimonial';
import { FluxoCaixaContabil } from '@/components/demonstrativos/FluxoCaixaContabil';
import { useEmpresas } from '@/hooks/useFinancialData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Demonstrativos = () => {
  const [periodo, setPeriodo] = useState('mensal');
  const [mes, setMes] = useState(new Date().getMonth().toString());
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [empresaId, setEmpresaId] = useState<string>('todas');
  const { data: empresas } = useEmpresas();

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const anos = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Demonstrativos Contábeis</h1>
            <p className="text-muted-foreground">
              DRE, Balanço Patrimonial e Fluxo de Caixa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as empresas</SelectItem>
                {empresas?.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>

            {periodo === 'mensal' && (
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="dre" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
              <TabsTrigger value="dre" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">DRE</span>
              </TabsTrigger>
              <TabsTrigger value="balanco" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Balanço</span>
              </TabsTrigger>
              <TabsTrigger value="fluxo" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Fluxo de Caixa</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dre">
              <DREStatement 
                periodo={periodo} 
                mes={parseInt(mes)} 
                ano={parseInt(ano)} 
                empresaId={empresaId}
              />
            </TabsContent>

            <TabsContent value="balanco">
              <BalancoPatrimonial 
                periodo={periodo} 
                mes={parseInt(mes)} 
                ano={parseInt(ano)} 
                empresaId={empresaId}
              />
            </TabsContent>

            <TabsContent value="fluxo">
              <FluxoCaixaContabil 
                periodo={periodo} 
                mes={parseInt(mes)} 
                ano={parseInt(ano)} 
                empresaId={empresaId}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
};

export default Demonstrativos;
