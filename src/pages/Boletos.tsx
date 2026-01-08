import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { PrimaryActionButton } from '@/components/wrappers';
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
  gerado: { label: 'Gerado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: FileText },
  enviado: { label: 'Enviado', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Mail },
  pago: { label: 'Pago', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  vencido: { label: 'Vencido', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
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

// Boleto Preview Component
const BoletoPreview = ({ boleto, onUpdateStatus }: { 
  boleto: Boleto; 
  onUpdateStatus: (data: { id: string; status: Boleto['status'] }) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLinhaDigitavel = () => {
    navigator.clipboard.writeText(boleto.linha_digitavel.replace(/\s/g, ''));
    setCopied(true);
    toast.success('Linha digitável copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // Import and use the PDF generator
    import('@/lib/pdf-generator').then(({ generateBoletoPDF }) => {
      generateBoletoPDF({
        numero: boleto.numero,
        linha_digitavel: boleto.linha_digitavel,
        codigo_barras: boleto.codigo_barras,
        valor: boleto.valor,
        vencimento: boleto.vencimento,
        cedente_nome: boleto.cedente_nome,
        cedente_cnpj: boleto.cedente_cnpj,
        sacado_nome: boleto.sacado_nome,
        sacado_cpf_cnpj: boleto.sacado_cpf_cnpj,
        banco: boleto.banco,
        agencia: boleto.agencia,
        conta: boleto.conta,
        descricao: boleto.descricao,
      });
      toast.success('PDF do boleto gerado com sucesso!');
    });
  };

  const handlePrint = () => {
    window.print();
    toast.success('Enviado para impressão!');
  };

  const handleSendEmail = () => {
    onUpdateStatus({ id: boleto.id, status: 'enviado' });
    toast.success('Boleto enviado por e-mail!');
  };

  const handleMarkAsPaid = () => {
    onUpdateStatus({ id: boleto.id, status: 'pago' });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header do Boleto */}
      <div className="bg-white text-black rounded-lg p-6 space-y-4 print:shadow-none">
        {/* Banco e Logo */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
              Logo Banco
            </div>
            <div className="text-2xl font-bold">{boleto.banco}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Nosso Número</div>
            <div className="text-lg font-mono font-bold">{boleto.numero}</div>
          </div>
        </div>

        {/* Linha Digitável */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Linha Digitável</div>
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono tracking-wider flex-1">
              {boleto.linha_digitavel}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLinhaDigitavel}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Informações do Cedente e Sacado */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Beneficiário (Cedente)</div>
              <div className="font-semibold">{boleto.cedente_nome}</div>
              <div className="text-sm text-muted-foreground">{boleto.cedente_cnpj}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Agência/Código do Beneficiário</div>
              <div className="font-mono">{boleto.agencia} / {boleto.conta}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Pagador (Sacado)</div>
              <div className="font-semibold">{boleto.sacado_nome}</div>
              <div className="text-sm text-muted-foreground">{boleto.sacado_cpf_cnpj}</div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Vencimento</div>
                <div className="font-semibold">{formatDate(boleto.vencimento)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Valor</div>
                <div className="font-semibold text-lg">{formatCurrency(boleto.valor)}</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Código de Barras */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Código de Barras</div>
          <BarcodeVisual code={boleto.codigo_barras} />
          <div className="text-xs font-mono text-center text-muted-foreground">
            {boleto.codigo_barras}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 print:hidden flex-wrap">
        <Button onClick={handleDownloadPDF} className="flex-1 gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={handleSendEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          Enviar
        </Button>
        {boleto.status !== 'pago' && boleto.status !== 'cancelado' && (
          <Button variant="outline" onClick={handleMarkAsPaid} className="gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Marcar Pago
          </Button>
        )}
      </div>
    </div>
  );
};

// Form para novo boleto
const NovoBoletoForm = ({ 
  onClose, 
  empresas, 
  contasBancarias,
  onSubmit,
  isCreating
}: { 
  onClose: () => void;
  empresas: any[] | undefined;
  contasBancarias: any[] | undefined;
  onSubmit: (data: NovoBoletoData) => void;
  isCreating: boolean;
}) => {
  const [formData, setFormData] = useState({
    sacado_nome: '',
    sacado_cpf_cnpj: '',
    valor: '',
    vencimento: '',
    conta_bancaria_id: '',
    empresa_id: '',
    descricao: ''
  });

  const filteredContas = contasBancarias?.filter(
    c => !formData.empresa_id || c.empresa_id === formData.empresa_id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.empresa_id || !formData.conta_bancaria_id) {
      toast.error('Selecione a empresa e conta bancária');
      return;
    }

    onSubmit({
      sacado_nome: formData.sacado_nome,
      sacado_cpf_cnpj: formData.sacado_cpf_cnpj,
      valor: parseFloat(formData.valor),
      vencimento: formData.vencimento,
      empresa_id: formData.empresa_id,
      conta_bancaria_id: formData.conta_bancaria_id,
      descricao: formData.descricao || undefined,
    });
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="sacado_nome">Pagador (Sacado)</Label>
          <Input
            id="sacado_nome"
            value={formData.sacado_nome}
            onChange={(e) => setFormData({ ...formData, sacado_nome: e.target.value })}
            placeholder="Nome do pagador"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="sacado_cpf_cnpj">CPF/CNPJ do Pagador</Label>
          <Input
            id="sacado_cpf_cnpj"
            value={formData.sacado_cpf_cnpj}
            onChange={(e) => setFormData({ ...formData, sacado_cpf_cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
            required
          />
        </div>

        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            placeholder="0,00"
            required
          />
        </div>

        <div>
          <Label htmlFor="vencimento">Vencimento</Label>
          <Input
            id="vencimento"
            type="date"
            value={formData.vencimento}
            onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="empresa_id">Empresa (Cedente)</Label>
          <Select
            value={formData.empresa_id}
            onValueChange={(value) => setFormData({ ...formData, empresa_id: value, conta_bancaria_id: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas?.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="conta_bancaria_id">Conta Bancária</Label>
          <Select
            value={formData.conta_bancaria_id}
            onValueChange={(value) => setFormData({ ...formData, conta_bancaria_id: value })}
            disabled={!formData.empresa_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {filteredContas?.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.banco} - {conta.agencia}/{conta.conta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descrição ou referência do boleto"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 gap-2" disabled={isCreating}>
          {isCreating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Barcode className="h-4 w-4" />
          )}
          {isCreating ? 'Gerando...' : 'Gerar Boleto'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default function Boletos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [showNovoBoleto, setShowNovoBoleto] = useState(false);

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
    { label: 'Total Gerado', value: stats.totalGerado, icon: FileText, color: 'text-primary' },
    { label: 'Total Pago', value: stats.totalPago, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Total Vencido', value: stats.totalVencido, icon: XCircle, color: 'text-red-500' },
    { label: 'Pendente', value: stats.totalPendente, icon: Clock, color: 'text-amber-500' }
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
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emissão de Boletos</h1>
            <p className="text-muted-foreground mt-1">
              Gere e gerencie boletos bancários com código de barras
            </p>
          </div>
          <Dialog open={showNovoBoleto} onOpenChange={setShowNovoBoleto}>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-muted", kpi.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className="text-xl font-bold">{formatCurrency(kpi.value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                                  <BoletoPreview 
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
              <p className="text-3xl font-bold text-blue-500">{stats.countGerado}</p>
              <p className="text-sm text-muted-foreground">Boletos Gerados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{stats.countEnviado}</p>
              <p className="text-sm text-muted-foreground">Enviados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">{stats.countPago}</p>
              <p className="text-sm text-muted-foreground">Pagos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{stats.countVencido}</p>
              <p className="text-sm text-muted-foreground">Vencidos</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
