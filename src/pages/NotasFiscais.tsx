import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { NotaFiscal } from '@/components/nfe/nfe-types';
import { NovaNFeForm } from '@/components/nfe/NovaNFeForm';
import { CancelamentoNFe } from '@/components/nfe/CancelamentoNFe';
import { containerVariants, itemVariants } from './NotasFiscais.helpers';
import { NotasFiscaisAbas } from './NotasFiscaisAbas';

export default function NotasFiscais() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showNovaNFe, setShowNovaNFe] = useState(false);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [notaCancelar, setNotaCancelar] = useState<NotaFiscal | null>(null);

  const handleNovaNota = useCallback((novaNota: NotaFiscal) => {
    setNotas((prev) => [novaNota, ...prev]);
    setShowNovaNFe(false);
  }, []);

  const handleCancelarNota = useCallback((notaId: string, justificativa: string) => {
    setNotas((prev) =>
      prev.map((nota) =>
        nota.id === notaId
          ? { ...nota, status: 'cancelada' as const, motivoCancelamento: justificativa }
          : nota
      )
    );
    setNotaCancelar(null);
  }, []);

  const totalEmitido = notas
    .filter((n) => n.status === 'autorizada')
    .reduce((acc, n) => acc + n.valorTotal, 0);
  const totalCancelado = notas
    .filter((n) => n.status === 'cancelada')
    .reduce((acc, n) => acc + n.valorTotal, 0);
  const totalPendente = notas
    .filter((n) => n.status === 'pendente')
    .reduce((acc, n) => acc + n.valorTotal, 0);
  const notasAutorizadas = notas.filter((n) => n.status === 'autorizada').length;

  const filteredNotas = notas.filter((nota) => {
    const matchesSearch =
      nota.numero.includes(searchTerm) ||
      nota.destinatarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.chaveAcesso.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || nota.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpis = [
    {
      label: 'Total Emitido',
      value: totalEmitido,
      count: notasAutorizadas,
      icon: CheckCircle2,
      color: 'text-success',
    },
    {
      label: 'Pendente Autorização',
      value: totalPendente,
      count: notas.filter((n) => n.status === 'pendente').length,
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: 'Canceladas',
      value: totalCancelado,
      count: notas.filter((n) => n.status === 'cancelada').length,
      icon: XCircle,
      color: 'text-destructive',
    },
    {
      label: 'Notas Este Mês',
      value: notas.length,
      isCount: true,
      icon: FileText,
      color: 'text-primary',
    },
  ];

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais Eletrônicas</h1>
            <p className="text-muted-foreground mt-1">
              Emissão e consulta dependem de integração SEFAZ homologada.
            </p>
          </div>
          <Dialog open={showNovaNFe} onOpenChange={setShowNovaNFe}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Emitir NF-e
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Emitir Nova NF-e
                </DialogTitle>
              </DialogHeader>
              <NovaNFeForm onClose={() => setShowNovaNFe(false)} onSuccess={handleNovaNota} />
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                        {kpi.isCount ? kpi.value : formatCurrency(kpi.value)}
                      </p>
                      {!kpi.isCount && kpi.count !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">{kpi.count} nota(s)</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-full bg-muted ${kpi.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <NotasFiscaisAbas
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            filteredNotas={filteredNotas}
            setNotaCancelar={setNotaCancelar}
            notas={notas}
            totalEmitido={totalEmitido}
            notasAutorizadas={notasAutorizadas}
          />
        </motion.div>

        {notaCancelar && (
          <CancelamentoNFe
            nota={notaCancelar}
            onClose={() => setNotaCancelar(null)}
            onSuccess={handleCancelarNota}
          />
        )}
      </motion.div>
    </MainLayout>
  );
}
