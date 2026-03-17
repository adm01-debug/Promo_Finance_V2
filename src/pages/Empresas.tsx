import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Building2, Plus, Search, MoreVertical, Edit,
  CheckCircle2, XCircle, FileText, CreditCard,
  TrendingUp, TrendingDown, Users, Copy, Wallet,
  ArrowUpRight, ArrowDownRight, LayoutGrid, List,
  Sparkles, ArrowRight, Zap, Shield, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useContasBancarias, useContasReceber, useContasPagar } from '@/hooks/useFinancialData';
import { useAllEmpresas, useExcluirEmpresa, useReativarEmpresa, type Empresa } from '@/hooks/useEmpresas';
import { EmpresaForm } from '@/components/empresas/EmpresaForm';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/ui/micro-interactions';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER — count-up effect for KPI values
═══════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, prefix = 'R$ ', duration = 1200 }: { value: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(value * eased * 100) / 100);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, isInView, duration]);

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════════════════════ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 26 } },
};

const heroVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.15 } },
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Empresas() {
  const { data: empresas = [], isLoading } = useAllEmpresas();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: contasReceber = [] } = useContasReceber();
  const { data: contasPagar = [] } = useContasPagar();
  const excluirEmpresa = useExcluirEmpresa();
  const reativarEmpresa = useReativarEmpresa();

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const { toast } = useToast();

  const empresasFiltradas = useMemo(() => empresas.filter(e =>
    e.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    e.cnpj.includes(searchTerm)
  ), [empresas, searchTerm]);

  const getEmpresaStats = (empresaId: string) => {
    const contas = contasBancarias.filter(c => c.empresa_id === empresaId);
    const receber = contasReceber.filter(c => c.empresa_id === empresaId);
    const pagar = contasPagar.filter(c => c.empresa_id === empresaId);
    return {
      saldoTotal: contas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0),
      contasBancarias: contas.length,
      aReceber: receber.reduce((acc, c) => acc + (c.valor || 0), 0),
      aPagar: pagar.reduce((acc, c) => acc + (c.valor || 0), 0),
      titulosReceber: receber.length,
      titulosPagar: pagar.length,
    };
  };

  const consolidado = useMemo(() => ({
    saldoTotal: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).saldoTotal, 0),
    totalReceber: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).aReceber, 0),
    totalPagar: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).aPagar, 0),
    empresasAtivas: empresas.filter(e => e.ativo).length,
    titulosPendentesReceber: contasReceber.filter(c => c.status === 'pendente').length,
    titulosPendentesPagar: contasPagar.filter(c => c.status === 'pendente').length,
  }), [empresas, contasBancarias, contasReceber, contasPagar]);

  const saldoLiquido = consolidado.saldoTotal + consolidado.totalReceber - consolidado.totalPagar;

  const formatCNPJ = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    return cnpj;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "CNPJ copiado para a área de transferência" });
  };

  const handleOpenDialog = (empresa?: Empresa) => { setEditingEmpresa(empresa || null); setDialogOpen(true); };
  const handleCloseDialog = () => { setDialogOpen(false); setEditingEmpresa(null); };
  const handleFormSuccess = () => handleCloseDialog();

  const handleToggleAtivo = async (empresa: Empresa) => {
    if (empresa.ativo) { setEmpresaToDelete(empresa); setDeleteConfirmOpen(true); }
    else await reativarEmpresa.mutateAsync(empresa.id);
  };

  const handleConfirmDelete = async () => {
    if (empresaToDelete) {
      const backup = { ...empresaToDelete };
      setDeleteConfirmOpen(false);
      setEmpresaToDelete(null);
      toastDeleteWithUndo({
        item: backup,
        itemName: `Empresa "${backup.nome_fantasia || backup.razao_social}"`,
        onDelete: async () => { await excluirEmpresa.mutateAsync(backup.id); },
        onRestore: async () => { await reativarEmpresa.mutateAsync(backup.id); },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Empresas</h1>
            <p className="text-sm text-muted-foreground">Gerencie múltiplas empresas e consolide dados financeiros</p>
          </div>
        </div>
        <Card><TableShimmerSkeleton rows={6} columns={7} /></Card>
      </div>
    );
  }

  const hasEmpresas = empresas.length > 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 p-1">
      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</DialogTitle>
          </DialogHeader>
          <EmpresaForm empresa={editingEmpresa} onSuccess={handleFormSuccess} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Desativar Empresa"
        description={`Tem certeza que deseja desativar "${empresaToDelete?.nome_fantasia || empresaToDelete?.razao_social}"?`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Desativar"
        variant="danger"
      />

      {/* ═══════════════════════════════════════════════════════════
          HEADER — Premium with gradient accent
      ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="h-12 w-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'var(--gradient-primary)' }}
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Building2 className="h-6 w-6 text-primary-foreground relative z-10" />
            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">Empresas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie seus CNPJs e acompanhe a saúde financeira
            </p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleOpenDialog()}
            size="lg"
            className="gap-2 font-semibold shadow-lg shadow-primary/20 relative overflow-hidden group"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <Plus className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Nova Empresa</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          HERO KPI — Wide glassmorphism card
      ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={heroVariants}>
        <Card className="relative overflow-hidden border-0" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {/* Background gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-secondary/8 dark:from-primary/20 dark:via-primary/8 dark:to-secondary/12" />
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 backdrop-blur-[2px] bg-card/60 dark:bg-card/40" />
          {/* Decorative glow orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-secondary/8 blur-3xl" />

          <CardContent className="relative p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
              {/* Hero — Saldo Consolidado */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                    <Wallet className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Saldo Consolidado</p>
                </div>
                <p className="text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight leading-none">
                  <AnimatedCounter value={consolidado.saldoTotal} />
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                    saldoLiquido >= 0
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  )}>
                    {saldoLiquido >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    Líquido: {formatCurrency(saldoLiquido)}
                  </span>
                </div>
              </div>

              {/* Divider vertical on desktop */}
              <div className="hidden lg:block lg:col-span-0">
                <div className="w-px h-20 mx-auto" style={{ background: 'var(--divider-gradient)' }} />
              </div>

              {/* Secondary KPIs */}
              <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                {/* A Receber */}
                <motion.div
                  className="p-4 rounded-2xl bg-success/8 dark:bg-success/12 border border-success/15 relative overflow-hidden group cursor-default"
                  whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(150 70% 32% / 0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-4 w-4 text-success transition-transform group-hover:scale-110 group-hover:rotate-6" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">A Receber</span>
                  </div>
                  <p className="text-lg font-extrabold text-success font-display">
                    <AnimatedCounter value={consolidado.totalReceber} duration={1400} />
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                    {consolidado.titulosPendentesReceber} pendente{consolidado.titulosPendentesReceber !== 1 ? 's' : ''}
                  </p>
                </motion.div>

                {/* A Pagar */}
                <motion.div
                  className="p-4 rounded-2xl bg-destructive/8 dark:bg-destructive/12 border border-destructive/15 relative overflow-hidden group cursor-default"
                  whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(0 78% 45% / 0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingDown className="h-4 w-4 text-destructive transition-transform group-hover:scale-110 group-hover:-rotate-6" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">A Pagar</span>
                  </div>
                  <p className="text-lg font-extrabold text-destructive font-display">
                    <AnimatedCounter value={consolidado.totalPagar} duration={1400} />
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                    {consolidado.titulosPendentesPagar} pendente{consolidado.titulosPendentesPagar !== 1 ? 's' : ''}
                  </p>
                </motion.div>

                {/* Empresas Ativas */}
                <motion.div
                  className="p-4 rounded-2xl bg-secondary/8 dark:bg-secondary/12 border border-secondary/15 relative overflow-hidden group cursor-default"
                  whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(215 90% 42% / 0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="h-4 w-4 text-secondary transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ativas</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-extrabold text-foreground font-display">{consolidado.empresasAtivas}</p>
                    <span className="text-sm text-muted-foreground font-semibold">/ {empresas.length}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">cadastradas</p>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          GRADIENT DIVIDER
      ═══════════════════════════════════════════════════════════ */}
      <div className="h-px w-full" style={{ background: 'var(--divider-gradient)' }} />

      {/* ═══════════════════════════════════════════════════════════
          SEARCH + VIEW TOGGLE — Floating bar
      ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNPJ, razão social ou nome fantasia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/40 backdrop-blur-sm">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            className={cn("gap-1.5 h-9 rounded-lg", viewMode === 'cards' && "shadow-sm")}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className={cn("gap-1.5 h-9 rounded-lg", viewMode === 'table' && "shadow-sm")}
            onClick={() => setViewMode('table')}
          >
            <List className="h-3.5 w-3.5" />
            Tabela
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          EMPTY STATE — Premium onboarding experience
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {empresasFiltradas.length === 0 && !isLoading && (
          <motion.div
            key="empty-state"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10 }}
          >
            {searchTerm ? (
              /* Search empty state — minimal */
              <Card className="border-dashed border-2 border-border/60">
                <CardContent className="py-14 flex flex-col items-center text-center">
                  <Search className="h-10 w-10 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">Nenhum resultado para "{searchTerm}"</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Tente buscar por outro CNPJ, razão social ou nome fantasia.</p>
                </CardContent>
              </Card>
            ) : (
              /* Onboarding empty state — full experience */
              <Card className="relative overflow-hidden border-0" style={{ boxShadow: 'var(--shadow-lg)' }}>
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-secondary/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

                <CardContent className="relative py-14 px-8">
                  <div className="max-w-2xl mx-auto text-center">
                    {/* Animated icon */}
                    <motion.div
                      className="mx-auto mb-6 h-20 w-20 rounded-3xl flex items-center justify-center relative"
                      style={{ background: 'var(--gradient-primary)' }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      <Building2 className="h-10 w-10 text-primary-foreground" />
                      <motion.div
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-warning flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-warning-foreground" />
                      </motion.div>
                    </motion.div>

                    <h2 className="text-2xl font-extrabold font-display text-foreground tracking-tight">
                      Bem-vindo ao Gestão Multiempresa
                    </h2>
                    <p className="text-base text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                      Cadastre suas empresas para consolidar dados financeiros, monitorar saúde por CNPJ e gerar relatórios comparativos.
                    </p>

                    {/* Onboarding steps */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-8">
                      {[
                        { icon: Building2, title: 'Cadastre um CNPJ', desc: 'Dados da empresa e regime tributário', step: '1' },
                        { icon: CreditCard, title: 'Vincule Contas', desc: 'Contas bancárias e formas de pagamento', step: '2' },
                        { icon: BarChart3, title: 'Acompanhe', desc: 'Dashboard consolidado e relatórios', step: '3' },
                      ].map((item, i) => (
                        <motion.div
                          key={item.step}
                          className="p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 text-center group hover:border-primary/30 transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.15 }}
                          whileHover={{ y: -3 }}
                        >
                          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary mb-3 transition-transform group-hover:scale-110">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-bold text-primary mb-0.5">Passo {item.step}</p>
                          <p className="text-sm font-bold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={() => handleOpenDialog()}
                        size="lg"
                        className="gap-2 text-base font-bold shadow-xl shadow-primary/25 px-8"
                        style={{ background: 'var(--gradient-primary)' }}
                      >
                        <Plus className="h-5 w-5" />
                        Cadastrar Primeira Empresa
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          CARDS VIEW — Premium cards with glassmorphism
      ═══════════════════════════════════════════════════════════ */}
      {viewMode === 'cards' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {empresasFiltradas.map((empresa) => {
              const stats = getEmpresaStats(empresa.id);
              const isSelected = selectedEmpresa === empresa.id;
              const saldoEmpresa = stats.saldoTotal + stats.aReceber - stats.aPagar;

              return (
                <StaggerItem key={empresa.id}>
                  <motion.div whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}>
                    <Card className={cn(
                      "relative overflow-hidden transition-all duration-300 group",
                      !empresa.ativo && "opacity-50 grayscale-[30%]",
                      isSelected && "ring-2 ring-primary",
                    )} style={{ boxShadow: isSelected ? 'var(--shadow-glow-primary)' : 'var(--shadow-sm)' }}>
                      {/* Top gradient bar */}
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-[3px]",
                        empresa.ativo
                          ? saldoEmpresa >= 0 ? "bg-gradient-to-r from-success via-success/70 to-success/30" : "bg-gradient-to-r from-warning via-warning/70 to-warning/30"
                          : "bg-muted-foreground/20"
                      )} />

                      <CardHeader className="pb-2 pt-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div
                              className={cn(
                                "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold shadow-sm",
                                empresa.ativo ? "text-primary-foreground" : "bg-muted text-muted-foreground"
                              )}
                              style={empresa.ativo ? { background: 'var(--gradient-primary)' } : undefined}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                              {(empresa.nome_fantasia || empresa.razao_social).charAt(0).toUpperCase()}
                            </motion.div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-bold truncate leading-tight">
                                {empresa.nome_fantasia || empresa.razao_social}
                              </CardTitle>
                              {empresa.nome_fantasia && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{empresa.razao_social}</p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Selecionar Contexto
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" /> Ver Documentos
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleAtivo(empresa)} className={empresa.ativo ? "text-destructive" : "text-success"}>
                                {empresa.ativo ? <><XCircle className="h-4 w-4 mr-2" /> Desativar</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Ativar</>}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pb-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[10px] cursor-pointer hover:bg-muted transition-colors gap-1 px-2 py-0.5" onClick={() => copyToClipboard(empresa.cnpj)}>
                            {formatCNPJ(empresa.cnpj)}
                            <Copy className="h-2.5 w-2.5" />
                          </Badge>
                          <Badge variant={empresa.ativo ? "default" : "secondary"} className={cn("text-[10px] px-2 py-0.5", empresa.ativo && "bg-success/15 text-success border-success/30")}>
                            {empresa.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-success/8 dark:bg-success/12 border border-success/10">
                            <div className="flex items-center gap-1 mb-1">
                              <ArrowUpRight className="h-3 w-3 text-success" />
                              <span className="text-[10px] font-semibold text-muted-foreground">Receber</span>
                            </div>
                            <p className="text-sm font-bold text-success">{formatCurrency(stats.aReceber)}</p>
                            <p className="text-[10px] text-muted-foreground">{stats.titulosReceber} título{stats.titulosReceber !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-destructive/8 dark:bg-destructive/12 border border-destructive/10">
                            <div className="flex items-center gap-1 mb-1">
                              <ArrowDownRight className="h-3 w-3 text-destructive" />
                              <span className="text-[10px] font-semibold text-muted-foreground">Pagar</span>
                            </div>
                            <p className="text-sm font-bold text-destructive">{formatCurrency(stats.aPagar)}</p>
                            <p className="text-[10px] text-muted-foreground">{stats.titulosPagar} título{stats.titulosPagar !== 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CreditCard className="h-3 w-3" />
                            <span className="text-[11px] font-medium">{stats.contasBancarias} conta{stats.contasBancarias !== 1 ? 's' : ''}</span>
                          </div>
                          <p className={cn("text-sm font-bold", stats.saldoTotal >= 0 ? "text-foreground" : "text-destructive")}>
                            {formatCurrency(stats.saldoTotal)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
              );
            })}

            {/* Add New Card */}
            <StaggerItem>
              <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Card
                  className="border-dashed border-2 border-primary/15 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer h-full min-h-[260px] flex items-center justify-center group"
                  onClick={() => handleOpenDialog()}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center p-6">
                    <motion.div
                      className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3 transition-all group-hover:bg-primary/15"
                      whileHover={{ scale: 1.15, rotate: 10 }}
                    >
                      <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.div>
                    <h3 className="font-bold text-sm text-foreground">Nova Empresa</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Cadastre um novo CNPJ</p>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TABLE VIEW
      ═══════════════════════════════════════════════════════════ */}
      {viewMode === 'table' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-border/60">
                  <TableHead className="font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Empresa</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">CNPJ</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Saldo</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">A Receber</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-[0.12em] text-muted-foreground">A Pagar</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresasFiltradas.map((empresa) => {
                  const stats = getEmpresaStats(empresa.id);
                  return (
                    <TableRow key={empresa.id} className={cn("transition-colors hover:bg-muted/30", !empresa.ativo && "opacity-50", selectedEmpresa === empresa.id && "bg-primary/5")}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold", empresa.ativo ? "text-primary-foreground" : "bg-muted text-muted-foreground")} style={empresa.ativo ? { background: 'var(--gradient-primary)' } : undefined}>
                            {(empresa.nome_fantasia || empresa.razao_social).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{empresa.nome_fantasia || empresa.razao_social}</p>
                            {empresa.nome_fantasia && <p className="text-[11px] text-muted-foreground">{empresa.razao_social}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] cursor-pointer" onClick={() => copyToClipboard(empresa.cnpj)}>{formatCNPJ(empresa.cnpj)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={empresa.ativo ? "default" : "secondary"} className={cn("text-[10px]", empresa.ativo && "bg-success/15 text-success border-success/30")}>{empresa.ativo ? "Ativa" : "Inativa"}</Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-bold text-sm", stats.saldoTotal >= 0 ? "text-foreground" : "text-destructive")}>{formatCurrency(stats.saldoTotal)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-success">{formatCurrency(stats.aReceber)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-destructive">{formatCurrency(stats.aPagar)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}><CheckCircle2 className="h-4 w-4 mr-2" /> Selecionar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAtivo(empresa)} className={empresa.ativo ? "text-destructive" : "text-success"}>{empresa.ativo ? "Desativar" : "Ativar"}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CONTEXTO ATIVO — Glassmorphism bar
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedEmpresa && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
          >
            <Card className="border-primary/30 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-glow-primary)' }}>
              <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm" />
              <CardContent className="relative p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                      <Building2 className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Contexto Ativo</p>
                      <p className="text-sm font-bold text-foreground">
                        {empresas.find(e => e.id === selectedEmpresa)?.nome_fantasia || empresas.find(e => e.id === selectedEmpresa)?.razao_social}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedEmpresa(null)} className="text-xs">Limpar</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
