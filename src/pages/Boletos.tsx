import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Search, 
  Copy, 
  Check,
  Printer,
  Mail,
  Barcode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Ban
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { useBoletos, Boleto, NovoBoletoData } from '@/hooks/useBoletos';
import { toastWithUndo } from '@/lib/toast-with-undo';
import { BoletoBarcode } from '@/components/boletos/BoletoBarcode';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/micro-interactions';

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

const statusConfig = {
  gerado: { label: 'Gerado', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: FileText },
  enviado: { label: 'Enviado', color: 'bg-warning/10 text-warning border-warning/20', icon: Mail },
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: AlertCircle }
};

// Barcode component
const BarcodeVisual = ({ code }: { code: string }) => {
  const bars = code.split('').map((char, i) => {
    const width = parseInt(char) % 2 === 0 ? 2 : 1;
    const isBlack = i % 2 === 0;
    return { width, isBlack };
  });

  return (
    <div className="flex items-end h-16 bg-white p-2 rounded">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={bar.isBlack ? 'bg-black' : 'bg-white'}
          style={{ width: `${bar.width}px`, height: '100%' }}
        />
      ))}
    </div>
  );
};
import { BoletoPreviewPanel } from '@/components/boletos/BoletoPreviewPanel';
import { NovoBoletoForm } from '@/components/boletos/NovoBoletoForm';

export default function Boletos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [showNovoBoleto, setShowNovoBoleto] = useState(false);
  const [activeTab, setActiveTab] = useState('lista');

  const {
    boletos,
    isLoading,
    stats,
    empresas,
    contasBancarias,
    createBoleto,
    updateStatus,
    cancelBoleto,
    isCreating,
  } = useBoletos();

  const filteredBoletos = boletos?.filter(boleto => {
    const matchesSearch = boleto.sacado_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.numero.includes(searchTerm) ||
      boleto.linha_digitavel.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || boleto.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const kpis = [
    { label: 'Total Gerado', value: stats.totalGerado, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', filter: 'todos' },
    { label: 'Total Pago', value: stats.totalPago, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', filter: 'pago' },
    { label: 'Total Vencido', value: stats.totalVencido, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', filter: 'vencido' },
    { label: 'Pendente', value: stats.totalPendente, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', filter: 'gerado' }
  ];


  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Emissão de Boletos</h1>
            <p className="text-muted-foreground mt-1">
              Gere e gerencie boletos bancários com código de barras
            </p>
          </div>
          <Dialog open={showNovoBoleto} onOpenChange={setShowNovoBoleto}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25" size="sm">
                <Plus className="h-4 w-4" />
                Novo Boleto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  Gerar Novo Boleto
                </DialogTitle>
              </DialogHeader>
              <NovoBoletoForm 
                onClose={() => setShowNovoBoleto(false)}
                empresas={empresas}
                contasBancarias={contasBancarias}
                onSubmit={createBoleto}
                isCreating={isCreating}
              />
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
              >
                <Card className="stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
                  <CardContent className="p-3 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{kpi.label}</p>
                        <p className="text-lg sm:text-2xl font-bold font-display mt-1 tabular-nums">{formatCurrency(kpi.value)}</p>
                      </div>
                      <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0", kpi.bg, kpi.color)}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por sacado, número ou linha digitável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="gerado">Gerado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Boletos List */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Boletos Emitidos</CardTitle>
              <CardDescription>
                {isLoading ? 'Carregando...' : `${filteredBoletos.length} boletos encontrados`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableShimmerSkeleton rows={5} columns={4} />
              ) : filteredBoletos.length > 0 ? (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredBoletos.map((boleto) => {
                      const status = statusConfig[boleto.status];
                      const StatusIcon = status.icon;
                      
                      return (
                        <motion.div
                          key={boleto.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-lg", status.color)}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">#{boleto.numero}</span>
                                <Badge variant="outline" className={status.color}>
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="font-medium">{boleto.sacado_nome}</p>
                              <p className="text-sm text-muted-foreground">
                                Vence em {formatDate(boleto.vencimento)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatCurrency(boleto.valor)}</p>
                              <p className="text-xs text-muted-foreground">{boleto.banco}</p>
                            </div>
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setSelectedBoleto(boleto)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Boleto #{boleto.numero}</DialogTitle>
                                  </DialogHeader>
                                   <BoletoPreviewPanel 
                                    boleto={boleto} 
                                    onUpdateStatus={updateStatus}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  navigator.clipboard.writeText(boleto.linha_digitavel);
                                  toast.success('Linha digitável copiada!');
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {boleto.status !== 'cancelado' && boleto.status !== 'pago' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    const previousStatus = boleto.status;
                                    cancelBoleto(boleto.id);
                                    toastWithUndo({
                                      title: `Boleto #${boleto.numero} cancelado`,
                                      description: 'O boleto foi cancelado.',
                                      onUndo: () => {
                                        updateStatus({ id: boleto.id, status: previousStatus });
                                      },
                                    });
                                  }}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState
                  icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                  title="Nenhum boleto encontrado"
                  description="Gere seu primeiro boleto para começar a receber pagamentos."
                  action={
                    <Button onClick={() => setShowNovoBoleto(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Boleto
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-secondary">{stats.countGerado}</p>
              <p className="text-sm text-muted-foreground">Boletos Gerados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning">{stats.countEnviado}</p>
              <p className="text-sm text-muted-foreground">Enviados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{stats.countPago}</p>
              <p className="text-sm text-muted-foreground">Pagos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{stats.countVencido}</p>
              <p className="text-sm text-muted-foreground">Vencidos</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
