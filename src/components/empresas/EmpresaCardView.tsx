import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import {
  Building2, Plus, MoreVertical, Edit, CheckCircle2, XCircle,
  FileText, CreditCard, TrendingUp, TrendingDown, Copy, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Empresa } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/ui/micro-interactions';

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
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased * 100) / 100);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, isInView, duration]);
  return <span ref={ref}>{prefix}{display.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

interface EmpresaStats {
  saldoTotal: number;
  contasBancarias: number;
  aReceber: number;
  aPagar: number;
  titulosReceber: number;
  titulosPagar: number;
}

interface EmpresaHeroKPIProps {
  consolidado: {
    saldoTotal: number; totalReceber: number; totalPagar: number;
    empresasAtivas: number; titulosPendentesReceber: number; titulosPendentesPagar: number;
  };
  saldoLiquido: number;
  totalEmpresas: number;
}

export function EmpresaHeroKPI({ consolidado, saldoLiquido, totalEmpresas }: EmpresaHeroKPIProps) {
  const { Wallet, Users } = require('lucide-react');
  return (
    <Card className="relative overflow-hidden border-0" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-secondary/8 dark:from-primary/20 dark:via-primary/8 dark:to-secondary/12" />
      <div className="absolute inset-0 backdrop-blur-[2px] bg-card/60 dark:bg-card/40" />
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-secondary/8 blur-3xl" />
      <CardContent className="relative p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
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
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full", saldoLiquido >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                {saldoLiquido >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                Líquido: {formatCurrency(saldoLiquido)}
              </span>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-0">
            <div className="w-px h-20 mx-auto" style={{ background: 'var(--divider-gradient)' }} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            <motion.div className="p-4 rounded-2xl bg-success/8 dark:bg-success/12 border border-success/15 relative overflow-hidden group cursor-default" whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(150 70% 32% / 0.15)' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-1.5 mb-2"><TrendingUp className="h-4 w-4 text-success transition-transform group-hover:scale-110 group-hover:rotate-6" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">A Receber</span></div>
              <p className="text-lg font-extrabold text-success font-display"><AnimatedCounter value={consolidado.totalReceber} duration={1400} /></p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{consolidado.titulosPendentesReceber} pendente{consolidado.titulosPendentesReceber !== 1 ? 's' : ''}</p>
            </motion.div>
            <motion.div className="p-4 rounded-2xl bg-destructive/8 dark:bg-destructive/12 border border-destructive/15 relative overflow-hidden group cursor-default" whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(0 78% 45% / 0.15)' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-1.5 mb-2"><TrendingDown className="h-4 w-4 text-destructive transition-transform group-hover:scale-110 group-hover:-rotate-6" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">A Pagar</span></div>
              <p className="text-lg font-extrabold text-destructive font-display"><AnimatedCounter value={consolidado.totalPagar} duration={1400} /></p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{consolidado.titulosPendentesPagar} pendente{consolidado.titulosPendentesPagar !== 1 ? 's' : ''}</p>
            </motion.div>
            <motion.div className="p-4 rounded-2xl bg-secondary/8 dark:bg-secondary/12 border border-secondary/15 relative overflow-hidden group cursor-default" whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(215 90% 42% / 0.15)' }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-1.5 mb-2"><Users className="h-4 w-4 text-secondary transition-transform group-hover:scale-110" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ativas</span></div>
              <div className="flex items-baseline gap-1.5"><p className="text-lg font-extrabold text-foreground font-display">{consolidado.empresasAtivas}</p><span className="text-sm text-muted-foreground font-semibold">/ {totalEmpresas}</span></div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">cadastradas</p>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmpresaCardViewProps {
  empresas: Empresa[];
  getEmpresaStats: (id: string) => EmpresaStats;
  selectedEmpresa: string | null;
  setSelectedEmpresa: (id: string) => void;
  onEdit: (empresa: Empresa) => void;
  onToggleAtivo: (empresa: Empresa) => void;
  onAdd: () => void;
  copyToClipboard: (text: string) => void;
  formatCNPJ: (cnpj: string) => string;
}

export function EmpresaCardView({ empresas, getEmpresaStats, selectedEmpresa, setSelectedEmpresa, onEdit, onToggleAtivo, onAdd, copyToClipboard, formatCNPJ }: EmpresaCardViewProps) {
  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {empresas.map((empresa) => {
        const stats = getEmpresaStats(empresa.id);
        const isSelected = selectedEmpresa === empresa.id;
        const saldoEmpresa = stats.saldoTotal + stats.aReceber - stats.aPagar;

        return (
          <StaggerItem key={empresa.id}>
            <motion.div whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}>
              <Card className={cn("relative overflow-hidden transition-all duration-300 group", !empresa.ativo && "opacity-50 grayscale-[30%]", isSelected && "ring-2 ring-primary")} style={{ boxShadow: isSelected ? 'var(--shadow-glow-primary)' : 'var(--shadow-sm)' }}>
                <div className={cn("absolute top-0 left-0 right-0 h-[3px]", empresa.ativo ? saldoEmpresa >= 0 ? "bg-gradient-to-r from-success via-success/70 to-success/30" : "bg-gradient-to-r from-warning via-warning/70 to-warning/30" : "bg-muted-foreground/20")} />
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <motion.div className={cn("h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold shadow-sm", empresa.ativo ? "text-primary-foreground" : "bg-muted text-muted-foreground")} style={empresa.ativo ? { background: 'var(--gradient-primary)' } : undefined} whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                        {(empresa.nome_fantasia || empresa.razao_social).charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold truncate leading-tight">{empresa.nome_fantasia || empresa.razao_social}</CardTitle>
                        {empresa.nome_fantasia && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{empresa.razao_social}</p>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}><CheckCircle2 className="h-4 w-4 mr-2" /> Selecionar Contexto</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(empresa)}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem><FileText className="h-4 w-4 mr-2" /> Ver Documentos</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggleAtivo(empresa)} className={empresa.ativo ? "text-destructive" : "text-success"}>
                          {empresa.ativo ? <><XCircle className="h-4 w-4 mr-2" /> Desativar</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Ativar</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px] cursor-pointer hover:bg-muted transition-colors gap-1 px-2 py-0.5" onClick={() => copyToClipboard(empresa.cnpj)}>{formatCNPJ(empresa.cnpj)}<Copy className="h-2.5 w-2.5" /></Badge>
                    <Badge variant={empresa.ativo ? "default" : "secondary"} className={cn("text-[10px] px-2 py-0.5", empresa.ativo && "bg-success/15 text-success border-success/30")}>{empresa.ativo ? "Ativa" : "Inativa"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-success/8 dark:bg-success/12 border border-success/10">
                      <div className="flex items-center gap-1 mb-1"><ArrowUpRight className="h-3 w-3 text-success" /><span className="text-[10px] font-semibold text-muted-foreground">Receber</span></div>
                      <p className="text-sm font-bold text-success">{formatCurrency(stats.aReceber)}</p>
                      <p className="text-[10px] text-muted-foreground">{stats.titulosReceber} título{stats.titulosReceber !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-destructive/8 dark:bg-destructive/12 border border-destructive/10">
                      <div className="flex items-center gap-1 mb-1"><ArrowDownRight className="h-3 w-3 text-destructive" /><span className="text-[10px] font-semibold text-muted-foreground">Pagar</span></div>
                      <p className="text-sm font-bold text-destructive">{formatCurrency(stats.aPagar)}</p>
                      <p className="text-[10px] text-muted-foreground">{stats.titulosPagar} título{stats.titulosPagar !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground"><CreditCard className="h-3 w-3" /><span className="text-[11px] font-medium">{stats.contasBancarias} conta{stats.contasBancarias !== 1 ? 's' : ''}</span></div>
                    <p className={cn("text-sm font-bold", stats.saldoTotal >= 0 ? "text-foreground" : "text-destructive")}>{formatCurrency(stats.saldoTotal)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        );
      })}
      <StaggerItem>
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
          <Card className="border-dashed border-2 border-primary/15 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer h-full min-h-[260px] flex items-center justify-center group" onClick={onAdd}>
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <motion.div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3 transition-all group-hover:bg-primary/15" whileHover={{ scale: 1.15, rotate: 10 }}>
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
              <h3 className="font-bold text-sm text-foreground">Nova Empresa</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Cadastre um novo CNPJ</p>
            </CardContent>
          </Card>
        </motion.div>
      </StaggerItem>
    </StaggerContainer>
  );
}
