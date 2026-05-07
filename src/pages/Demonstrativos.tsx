import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, Scale, Wallet, Calendar, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DREStatement } from '@/components/demonstrativos/DREStatement';
import { BalancoPatrimonial } from '@/components/demonstrativos/BalancoPatrimonial';
import { FluxoCaixaContabil } from '@/components/demonstrativos/FluxoCaixaContabil';
import { FonteDadosToggle } from '@/components/demonstrativos/FonteDadosToggle';
import { ExportDemonstrativoPDF } from '@/components/demonstrativos/ExportDemonstrativoPDF';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useDemonstrativosContabeis, type FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';

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
  const [fonte, setFonte] = useState<FonteDemonstrativo>('competencia');
  const { data: empresas } = useEmpresas();

  // Detecta cobertura de contabilidade para o período (decide se permite competência)
  const demoData = useDemonstrativosContabeis({
    empresaId,
    ano: parseInt(ano),
    mes: parseInt(mes),
    fonte: 'competencia',
  });
  const { cobertura } = demoData;
  const hasContabilidade = cobertura.totalPartidas > 0;
  const fonteEfetiva: FonteDemonstrativo = hasContabilidade ? fonte : 'caixa';

  // Dados com fonte efetiva para exportação na barra de ferramentas
  const exportData = useDemonstrativosContabeis({
    empresaId,
    ano: parseInt(ano),
    mes: parseInt(mes),
    fonte: fonteEfetiva,
  });

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const anos = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 space-y-12 pb-20"
        >
          {/* Hero Header */}
          <motion.div variants={itemVariants} className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between pt-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Intelligence & Analysis
              </div>
              <h1 className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl">
                Demonstrativos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">Contábeis</span>
              </h1>
              <p className="text-xl text-muted-foreground/80 max-w-2xl leading-relaxed">
                Visão analítica de alta precisão para governança financeira corporativa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-background/40 p-3 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center gap-3 px-4 border-r border-white/10 pr-6">
                <Building2 className="h-5 w-5 text-primary" />
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger className="w-[200px] border-none bg-transparent hover:bg-white/5 transition-all h-10 font-semibold text-sm">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
                    <SelectItem value="todas">Todas as empresas</SelectItem>
                    {empresas?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 px-2">
                <Calendar className="h-5 w-5 text-muted-foreground/60 ml-2" />
                <div className="flex items-center gap-1">
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger className="w-[110px] border-none bg-transparent hover:bg-white/5 transition-all h-10 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>

                  {periodo === 'mensal' && (
                    <Select value={mes} onValueChange={setMes}>
                      <SelectTrigger className="w-[120px] border-none bg-transparent hover:bg-white/5 transition-all h-10 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
                        {meses.map((m, i) => (
                          <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={ano} onValueChange={setAno}>
                    <SelectTrigger className="w-[85px] border-none bg-transparent hover:bg-white/5 transition-all h-10 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
                      {anos.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="ml-2 pl-4 border-l border-white/10">
                <ExportDemonstrativoPDF
                  tipo="dre"
                  periodo={periodo}
                  mes={parseInt(mes)}
                  ano={parseInt(ano)}
                  empresa="Promo Finance"
                  linhas={exportData.dre.linhas}
                  resumoDRE={{ lucroLiquido: exportData.dre.lucroLiquido }}
                  fonte={fonteEfetiva}
                />
              </div>
            </div>
          </motion.div>

          {/* Contextual Toggle */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <FonteDadosToggle
              value={fonteEfetiva}
              onChange={setFonte}
              totalPartidas={cobertura.totalPartidas}
              hasContabilidade={hasContabilidade}
            />
          </motion.div>

          {/* Interactive Navigation Content */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="dre" className="space-y-12">
              <div className="flex justify-center">
                <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-white/5 p-1.5 text-muted-foreground w-full max-w-[640px] border border-white/10 backdrop-blur-2xl shadow-xl ring-1 ring-white/10">
                  <TabsTrigger value="dre" className="relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-10 py-3 text-sm font-bold tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg gap-3">
                    <TrendingUp className="h-4.5 w-4.5" />
                    <span>DRE Analytical</span>
                  </TabsTrigger>
                  <TabsTrigger value="balanco" className="relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-10 py-3 text-sm font-bold tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg gap-3">
                    <Scale className="h-4.5 w-4.5" />
                    <span>Balanço Patrimonial</span>
                  </TabsTrigger>
                  <TabsTrigger value="fluxo" className="relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-10 py-3 text-sm font-bold tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg gap-3">
                    <Wallet className="h-4.5 w-4.5" />
                    <span>Cash Flow</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-[600px]">
                <TabsContent value="dre" className="mt-0 outline-none focus-visible:ring-0">
                  <DREStatement
                    periodo={periodo}
                    mes={parseInt(mes)}
                    ano={parseInt(ano)}
                    empresaId={empresaId}
                    fonte={fonteEfetiva}
                  />
                </TabsContent>

                <TabsContent value="balanco" className="mt-0 outline-none focus-visible:ring-0">
                  <BalancoPatrimonial
                    periodo={periodo}
                    mes={parseInt(mes)}
                    ano={parseInt(ano)}
                    empresaId={empresaId}
                    fonte={fonteEfetiva}
                  />
                </TabsContent>

                <TabsContent value="fluxo" className="mt-0 outline-none focus-visible:ring-0">
                  <FluxoCaixaContabil 
                    periodo={periodo} 
                    mes={parseInt(mes)} 
                    ano={parseInt(ano)} 
                    empresaId={empresaId}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Demonstrativos;
