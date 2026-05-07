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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-display-xl">
              Demonstrativos <span className="text-primary">Contábeis</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Visão analítica completa da sua saúde financeira: DRE, Balanço Patrimonial e Fluxo de Caixa integrados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-card/40 p-2 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-2 border-r border-border/50 pr-4">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="w-[180px] border-none bg-transparent hover:bg-accent/50 transition-colors h-9">
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
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[130px] border-none bg-transparent hover:bg-accent/50 transition-colors h-9">
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
                  <SelectTrigger className="w-[130px] border-none bg-transparent hover:bg-accent/50 transition-colors h-9">
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
                <SelectTrigger className="w-[90px] border-none bg-transparent hover:bg-accent/50 transition-colors h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto pl-4 border-l border-border/50">
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

        {/* Toggle Fonte de Dados */}
        <motion.div variants={itemVariants}>
          <FonteDadosToggle
            value={fonteEfetiva}
            onChange={setFonte}
            totalPartidas={cobertura.totalPartidas}
            hasContabilidade={hasContabilidade}
          />
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
                fonte={fonteEfetiva}
              />
            </TabsContent>

            <TabsContent value="balanco">
              <BalancoPatrimonial
                periodo={periodo}
                mes={parseInt(mes)}
                ano={parseInt(ano)}
                empresaId={empresaId}
                fonte={fonteEfetiva}
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
