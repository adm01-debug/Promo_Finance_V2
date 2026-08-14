import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, MapPin, Box, Search, Plus, Filter, ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { StandardTableCard } from '@/components/shared/StandardTableCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlingLogisticaPanel } from '@/components/bling/BlingLogisticaPanel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

export default function Logistica() {
  const [, setActiveTab] = useState('overview');

  return (
    <MainLayout>
      <div className="relative min-h-screen pb-20">
        <PageBackground />
        
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="relative z-10 space-y-8 pt-4"
        >
          <PageHeader 
            title="Gestão de Entregas" 
            subtitle="Controle total do fluxo logístico, remessas e rastreamento em tempo real."
            badge="Logistics & Supply Chain"
            icon={Truck}
            gradientFrom="from-blue-600"
            gradientVia="via-indigo-500"
            gradientTo="to-purple-600"
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  size="lg" 
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]"
                >
                  <Plus className="h-5 w-5" /> Nova Entrega
                </Button>
              </div>
            }
          />

          <Tabs defaultValue="overview" className="w-full space-y-8" onValueChange={setActiveTab}>
            <TabsList className="bg-background/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl h-14 w-full md:w-auto overflow-x-auto overflow-y-hidden">
              <TabsTrigger value="overview" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="bling" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                Integração Bling
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Em Trânsito', value: '12', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Aguardando Coleta', value: '08', icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'Entregues (Mês)', value: '145', icon: Box, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Ocorrências', value: '02', icon: MapPin, color: 'text-destructive', bg: 'bg-destructive/10' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-[2rem] border-none bg-background/40 backdrop-blur-xl ring-1 ring-white/10 shadow-lg group hover:ring-primary/30 transition-all duration-500"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black opacity-50 uppercase tracking-widest border-white/5">Realtime</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <StandardTableCard>
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/[0.02]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      placeholder="Buscar por código de rastreio, cliente ou nota..." 
                      className="pl-10 h-11 bg-background/20 border-white/10 rounded-xl focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-background/20 gap-2 font-bold hover:bg-card/5 transition-all">
                    <Filter className="h-4 w-4" /> Filtros
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-card/[0.01]">
                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Objeto / Rastreio</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Destinatário</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Status</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Última Atualização</th>
                        <th className="p-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { id: 'BR123456789', cliente: 'João Silva', status: 'em_transito', data: '2024-05-22 14:30' },
                        { id: 'BR987654321', cliente: 'Maria Oliveira', status: 'entregue', data: '2024-05-21 09:15' },
                        { id: 'BR456789123', cliente: 'Empresa ABC', status: 'pendente', data: '2024-05-22 08:00' },
                      ].map((item, i) => (
                        <tr key={i} className="hover:bg-card/[0.02] transition-all duration-300 group">
                          <td className="p-6">
                            <div className="font-black text-sm tracking-tight">{item.id}</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase">Correios SEDEX</div>
                          </td>
                          <td className="p-6">
                            <div className="font-bold">{item.cliente}</div>
                          </td>
                          <td className="p-6">
                            <Badge className={cn(
                              "font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg border-none",
                              item.status === 'em_transito' ? "bg-blue-500/10 text-blue-500" :
                              item.status === 'entregue' ? "bg-emerald-500/10 text-emerald-500" :
                              "bg-amber-500/10 text-amber-500"
                            )}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <div className="text-sm font-medium text-muted-foreground/80">{item.data}</div>
                          </td>
                          <td className="p-6 text-right">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all group-hover:translate-x-1">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </StandardTableCard>
            </TabsContent>

            <TabsContent value="bling">
              <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
                <BlingLogisticaPanel />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="p-6 rounded-full bg-primary/5 ring-1 ring-primary/10">
                  <Box className="h-12 w-12 text-primary/40" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black tracking-tight">Histórico Vazio</h3>
                  <p className="text-muted-foreground/60 font-medium">Nenhuma entrega finalizada encontrada para o período selecionado.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}

const cn = (...classes: unknown[]) => classes.filter(Boolean).join(' ');
