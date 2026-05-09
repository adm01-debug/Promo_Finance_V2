import { motion } from 'framer-motion';
import { Plus, ShoppingCart, Search, Filter, ArrowRight, Package, FileText, CheckCircle2, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const;

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for initial UI
  const pedidos = [
    { id: '1', fornecedor: 'Dell Technologies', valor: 15400.00, status: 'pendente_aprovacao', data: '2024-05-08', itens: 3 },
    { id: '2', fornecedor: 'Amazon Web Services', valor: 2300.50, status: 'aprovado', data: '2024-05-07', itens: 1 },
    { id: '3', fornecedor: 'Papelaria Central', valor: 450.00, status: 'recebido', data: '2024-05-05', itens: 12 },
    { id: '4', fornecedor: 'Consultoria Financeira X', valor: 8000.00, status: 'cancelado', data: '2024-05-01', itens: 1 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente_aprovacao': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendente</Badge>;
      case 'aprovado': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Aprovado</Badge>;
      case 'recebido': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Recebido</Badge>;
      case 'cancelado': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen pb-20">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 space-y-8 pt-4">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <ShoppingCart className="h-3 w-3" />
                Procurement & Supply Chain
              </div>
              <h1 className="text-5xl font-black tracking-tighter md:text-6xl">
                Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Compras</span>
              </h1>
              <p className="text-lg text-muted-foreground/70 max-w-2xl font-medium">
                Controle o ciclo completo de aquisição, desde a requisição até a entrada de mercadorias.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button size="lg" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]">
                <Plus className="h-5 w-5" /> Novo Pedido
              </Button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Pedidos este Mês', value: '24', icon: <FileText className="h-4 w-4" />, color: 'text-primary' },
              { label: 'Aguardando Aprovação', value: '05', icon: <Clock className="h-4 w-4" />, color: 'text-amber-500' },
              { label: 'Total Comprado', value: formatCurrency(45800), icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-500' },
              { label: 'Lead Time Médio', value: '4.2 dias', icon: <Package className="h-4 w-4" />, color: 'text-blue-500' },
            ].map((stat, i) => (
              <Card key={i} className="p-6 border-none bg-background/40 backdrop-blur-xl ring-1 ring-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</span>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
                <div className="text-2xl font-black tracking-tight">{stat.value}</div>
              </Card>
            ))}
          </motion.div>

          {/* Filters & Search */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input 
                placeholder="Buscar por fornecedor ou ID do pedido..." 
                className="pl-10 h-12 bg-background/40 border-white/10 rounded-xl focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 px-4 rounded-xl border-white/10 bg-background/40 gap-2 font-bold">
              <Filter className="h-4 w-4" /> Filtros Avançados
            </Button>
          </motion.div>

          {/* Orders Table */}
          <motion.div variants={itemVariants}>
            <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">ID / Data</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Fornecedor</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Itens</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Valor Total</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Status</th>
                      <th className="p-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6">
                          <div className="font-black text-sm">#{pedido.id}</div>
                          <div className="text-[10px] text-muted-foreground">{pedido.data}</div>
                        </td>
                        <td className="p-6">
                          <div className="font-bold">{pedido.fornecedor}</div>
                        </td>
                        <td className="p-6 text-sm text-muted-foreground font-medium">
                          {pedido.itens} itens
                        </td>
                        <td className="p-6 font-black text-primary">
                          {formatCurrency(pedido.valor)}
                        </td>
                        <td className="p-6">
                          {getStatusBadge(pedido.status)}
                        </td>
                        <td className="p-6 text-right">
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
