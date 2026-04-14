import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Search, MoreVertical, Edit, CheckCircle2, XCircle,
  CreditCard, LayoutGrid, List, Sparkles, ArrowRight, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useContasBancarias, useContasReceber, useContasPagar } from '@/hooks/useFinancialData';
import { useAllEmpresas, useExcluirEmpresa, useReativarEmpresa, type Empresa } from '@/hooks/useEmpresas';
import { EmpresaForm } from '@/components/empresas/EmpresaForm';
import { EmpresaHeroKPI, EmpresaCardView } from '@/components/empresas/EmpresaCardView';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 16, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 26 } } };
const heroVariants = { hidden: { opacity: 0, y: 24, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.15 } } };

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
        item: backup, itemName: `Empresa "${backup.nome_fantasia || backup.razao_social}"`,
        onDelete: async () => { await excluirEmpresa.mutateAsync(backup.id); },
        onRestore: async () => { await reativarEmpresa.mutateAsync(backup.id); },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold font-display text-foreground">Empresas</h1><p className="text-sm text-muted-foreground">Gerencie múltiplas empresas e consolide dados financeiros</p></div>
        </div>
        <Card><TableShimmerSkeleton rows={6} columns={7} /></Card>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 p-1">
      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</DialogTitle></DialogHeader>
          <EmpresaForm empresa={editingEmpresa} onSuccess={handleCloseDialog} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Desativar Empresa" description={`Tem certeza que deseja desativar "${empresaToDelete?.nome_fantasia || empresaToDelete?.razao_social}"?`} onConfirm={handleConfirmDelete} confirmLabel="Desativar" variant="danger" />

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div className="h-12 w-12 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }} whileHover={{ scale: 1.08, rotate: 3 }}>
            <Building2 className="h-6 w-6 text-primary-foreground relative z-10" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">Empresas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus CNPJs e acompanhe a saúde financeira</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/20 relative overflow-hidden group" style={{ background: 'var(--gradient-primary)' }}>
            <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <Plus className="h-4 w-4 relative z-10" /><span className="relative z-10">Nova Empresa</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Hero KPI */}
      <motion.div variants={heroVariants}>
        <EmpresaHeroKPI consolidado={consolidado} saldoLiquido={saldoLiquido} totalEmpresas={empresas.length} />
      </motion.div>

      <div className="h-px w-full" style={{ background: 'var(--divider-gradient)' }} />

      {/* Search + View Toggle */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por CNPJ, razão social ou nome fantasia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-11 bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl transition-all" />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/40 backdrop-blur-sm">
          <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" className={cn("gap-1.5 h-9 rounded-lg", viewMode === 'cards' && "shadow-sm")} onClick={() => setViewMode('cards')}><LayoutGrid className="h-3.5 w-3.5" />Cards</Button>
          <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className={cn("gap-1.5 h-9 rounded-lg", viewMode === 'table' && "shadow-sm")} onClick={() => setViewMode('table')}><List className="h-3.5 w-3.5" />Tabela</Button>
        </div>
      </motion.div>

      {/* Empty States */}
      <AnimatePresence mode="wait">
        {empresasFiltradas.length === 0 && !isLoading && (
          <motion.div key="empty-state" variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -10 }}>
            {searchTerm ? (
              <Card className="border-dashed border-2 border-border/60">
                <CardContent className="py-14 flex flex-col items-center text-center">
                  <Search className="h-10 w-10 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">Nenhum resultado para "{searchTerm}"</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Tente buscar por outro CNPJ, razão social ou nome fantasia.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="relative overflow-hidden border-0" style={{ boxShadow: 'var(--shadow-lg)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <CardContent className="relative py-14 px-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <motion.div className="mx-auto mb-6 h-20 w-20 rounded-3xl flex items-center justify-center relative" style={{ background: 'var(--gradient-primary)' }} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                      <Building2 className="h-10 w-10 text-primary-foreground" />
                      <motion.div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-warning flex items-center justify-center" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <Sparkles className="h-3.5 w-3.5 text-warning-foreground" />
                      </motion.div>
                    </motion.div>
                    <h2 className="text-2xl font-extrabold font-display text-foreground tracking-tight">Bem-vindo ao Gestão Multiempresa</h2>
                    <p className="text-base text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">Cadastre suas empresas para consolidar dados financeiros.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-8">
                      {[
                        { icon: Building2, title: 'Cadastre um CNPJ', desc: 'Dados da empresa e regime tributário', step: '1' },
                        { icon: CreditCard, title: 'Vincule Contas', desc: 'Contas bancárias e formas de pagamento', step: '2' },
                        { icon: BarChart3, title: 'Acompanhe', desc: 'Dashboard consolidado e relatórios', step: '3' },
                      ].map((item, i) => (
                        <motion.div key={item.step} className="p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 text-center group hover:border-primary/30 transition-all" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }} whileHover={{ y: -3 }}>
                          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary mb-3 transition-transform group-hover:scale-110"><item.icon className="h-5 w-5" /></div>
                          <p className="text-xs font-bold text-primary mb-0.5">Passo {item.step}</p>
                          <p className="text-sm font-bold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                    <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2 text-base font-bold shadow-xl shadow-primary/25 px-8" style={{ background: 'var(--gradient-primary)' }}>
                      <Plus className="h-5 w-5" />Cadastrar Primeira Empresa<ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards View */}
      {viewMode === 'cards' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <EmpresaCardView
            empresas={empresasFiltradas}
            getEmpresaStats={getEmpresaStats}
            selectedEmpresa={selectedEmpresa}
            setSelectedEmpresa={setSelectedEmpresa}
            onEdit={(e) => handleOpenDialog(e)}
            onToggleAtivo={handleToggleAtivo}
            onAdd={() => handleOpenDialog()}
            copyToClipboard={copyToClipboard}
            formatCNPJ={formatCNPJ}
          />
        </motion.div>
      )}

      {/* Table View */}
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
                          <div><p className="font-semibold text-sm text-foreground">{empresa.nome_fantasia || empresa.razao_social}</p>{empresa.nome_fantasia && <p className="text-[11px] text-muted-foreground">{empresa.razao_social}</p>}</div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px] cursor-pointer" onClick={() => copyToClipboard(empresa.cnpj)}>{formatCNPJ(empresa.cnpj)}</Badge></TableCell>
                      <TableCell><Badge variant={empresa.ativo ? "default" : "secondary"} className={cn("text-[10px]", empresa.ativo && "bg-success/15 text-success border-success/30")}>{empresa.ativo ? "Ativa" : "Inativa"}</Badge></TableCell>
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

      {/* Active Context Bar */}
      <AnimatePresence>
        {selectedEmpresa && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}>
            <Card className="border-primary/30 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-glow-primary)' }}>
              <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm" />
              <CardContent className="relative p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}><Building2 className="h-4 w-4 text-primary-foreground" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Contexto Ativo</p>
                      <p className="text-sm font-bold text-foreground">{empresas.find(e => e.id === selectedEmpresa)?.nome_fantasia || empresas.find(e => e.id === selectedEmpresa)?.razao_social}</p>
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
