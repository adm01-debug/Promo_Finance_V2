import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Users, Package, FileText, ChevronDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

interface DrillDownSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const DrillDownSection = React.memo(function DrillDownSection({ title, icon, children, defaultOpen = false }: DrillDownSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden group">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200">
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate: isOpen ? 360 : 0 }} transition={{ duration: 0.3 }}>{icon}</motion.div>
          <span className="font-semibold">{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-5 w-5" /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
            <div className="p-4 pt-0 border-t">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
});

interface ContaBancaria {
  id: string; banco: string; codigo_banco: string; agencia: string; conta: string; cor: string | null; saldo_atual: number; saldo_disponivel: number;
}

interface TopItem { nome: string; valor: number; vencido: number; }
interface Transacao { tipo: 'receber' | 'pagar'; descricao: string; nome: string; valor: number; data: string; }

interface EmpresaDrillDownProps {
  contasBancarias: ContaBancaria[];
  topClientesReceber: TopItem[];
  topFornecedoresPagar: TopItem[];
  transacoesRecentes: Transacao[];
  totalReceber: number;
  totalPagar: number;
}

export function EmpresaDrillDownSection({ contasBancarias, topClientesReceber, topFornecedoresPagar, transacoesRecentes, totalReceber, totalPagar }: EmpresaDrillDownProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <h2 className="text-xl font-display font-bold">Drill-down Detalhado</h2>

      <DrillDownSection title={`Contas Bancárias (${contasBancarias.length})`} icon={<CreditCard className="h-5 w-5 text-primary" />} defaultOpen>
        <div className="space-y-3">
          {contasBancarias.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma conta bancária cadastrada</p> : contasBancarias.map((conta) => (
            <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold bg-primary/10 text-primary"
                  style={conta.cor ? { background: `${conta.cor}20`, color: conta.cor } : undefined}
                >
                  {conta.codigo_banco}
                </div>
                <div><p className="font-medium">{conta.banco}</p><p className="text-xs text-muted-foreground">Ag: {conta.agencia} | Cc: {conta.conta}</p></div>
              </div>
              <div className="text-right"><p className="font-bold">{formatCurrency(conta.saldo_atual)}</p><p className="text-xs text-muted-foreground">Disponível: {formatCurrency(conta.saldo_disponivel)}</p></div>
            </div>
          ))}
        </div>
      </DrillDownSection>

      <DrillDownSection title="Top Clientes - A Receber" icon={<Users className="h-5 w-5 text-success" />}>
        <Table>
          <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">A Receber</TableHead><TableHead className="text-right">Vencido</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
          <TableBody>
            {topClientesReceber.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum valor a receber</TableCell></TableRow> : topClientesReceber.map((c, i) => (
              <TableRow key={i}><TableCell className="font-medium">{c.nome}</TableCell><TableCell className="text-right">{formatCurrency(c.valor)}</TableCell><TableCell className="text-right text-destructive">{c.vencido > 0 ? formatCurrency(c.vencido) : '-'}</TableCell><TableCell className="text-right"><Progress value={(c.valor / totalReceber) * 100} className="h-2 w-16" /></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </DrillDownSection>

      <DrillDownSection title="Top Fornecedores - A Pagar" icon={<Package className="h-5 w-5 text-destructive" />}>
        <Table>
          <TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead className="text-right">A Pagar</TableHead><TableHead className="text-right">Vencido</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
          <TableBody>
            {topFornecedoresPagar.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum valor a pagar</TableCell></TableRow> : topFornecedoresPagar.map((f, i) => (
              <TableRow key={i}><TableCell className="font-medium">{f.nome}</TableCell><TableCell className="text-right">{formatCurrency(f.valor)}</TableCell><TableCell className="text-right text-destructive">{f.vencido > 0 ? formatCurrency(f.vencido) : '-'}</TableCell><TableCell className="text-right"><Progress value={(f.valor / totalPagar) * 100} className="h-2 w-16" /></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </DrillDownSection>

      <DrillDownSection title="Movimentações Recentes" icon={<FileText className="h-5 w-5 text-muted-foreground" />}>
        <div className="space-y-2">
          {transacoesRecentes.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma movimentação recente</p> : transacoesRecentes.map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', t.tipo === 'receber' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                  {t.tipo === 'receber' ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                </div>
                <div><p className="font-medium text-sm">{t.descricao}</p><p className="text-xs text-muted-foreground">{t.nome}</p></div>
              </div>
              <div className="text-right">
                <p className={cn('font-bold text-sm', t.tipo === 'receber' ? 'text-success' : 'text-destructive')}>{t.tipo === 'receber' ? '+' : '-'}{formatCurrency(t.valor)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.data)}</p>
              </div>
            </div>
          ))}
        </div>
      </DrillDownSection>
    </motion.div>
  );
}
