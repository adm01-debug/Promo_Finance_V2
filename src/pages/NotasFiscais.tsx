import { useState, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  Calendar,
  Building2,
  FileCode,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  FileX as FileXIcon,
  Package,
  User,
  Hash,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  Server,
  ShieldCheck,
  Zap,
  History,
  Ban,
  Bell,
  BarChart3,
  Shield,
  Activity
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { useEmpresas } from '@/hooks/useFinancialData';
import { toast } from 'sonner';
import { processarSefaz, NFEData, SefazResponse, SEFAZ_STATUS } from '@/lib/sefaz-simulator';
import { registrarEvento } from '@/lib/sefaz-event-logger';
import { EventosHistorico } from '@/components/nfe/EventosHistorico';
import { CancelamentoNFe } from '@/components/nfe/CancelamentoNFe';
import { AlertasRejeicao } from '@/components/nfe/AlertasRejeicao';
import { SefazAnalytics } from '@/components/nfe/SefazAnalytics';
import { InutilizacaoNFe } from '@/components/nfe/InutilizacaoNFe';
import { ContingenciaNFe } from '@/components/nfe/ContingenciaNFe';
import { SefazMonitor } from '@/components/nfe/SefazMonitor';

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

interface ItemNFe {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  chaveAcesso: string;
  naturezaOperacao: string;
  dataEmissao: string;
  dataSaida?: string;
  cnpjEmitente: string;
  emitenteNome: string;
  cnpjDestinatario: string;
  destinatarioNome: string;
  destinatarioEndereco: string;
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  valorDesconto: number;
  valorIPI: number;
  valorICMS: number;
  valorTotal: number;
  status: 'autorizada' | 'pendente' | 'cancelada' | 'denegada' | 'inutilizada';
  protocolo?: string;
  motivoCancelamento?: string;
  itens: ItemNFe[];
}

// Mock NF-e data
const mockNotasFiscais: NotaFiscal[] = [
  {
    id: '1',
    numero: '000001234',
    serie: '1',
    chaveAcesso: '35240112345678000190550010000012341234567890',
    naturezaOperacao: 'Venda de Mercadoria',
    dataEmissao: '2024-01-20T10:30:00',
    dataSaida: '2024-01-20T14:00:00',
    cnpjEmitente: '12.345.678/0001-90',
    emitenteNome: 'Promo Brindes Ltda',
    cnpjDestinatario: '98.765.432/0001-10',
    destinatarioNome: 'Tech Solutions Ltda',
    destinatarioEndereco: 'Av. Paulista, 1000 - São Paulo/SP',
    valorProdutos: 15750.00,
    valorFrete: 350.00,
    valorSeguro: 0,
    valorDesconto: 500.00,
    valorIPI: 0,
    valorICMS: 2835.00,
    valorTotal: 15600.00,
    status: 'autorizada',
    protocolo: '135240000123456',
    itens: [
      { codigo: 'PROD001', descricao: 'Caneta Personalizada', ncm: '96082000', cfop: '5102', unidade: 'UN', quantidade: 1000, valorUnitario: 5.50, valorTotal: 5500.00 },
      { codigo: 'PROD002', descricao: 'Bloco de Notas A5', ncm: '48201000', cfop: '5102', unidade: 'UN', quantidade: 500, valorUnitario: 8.50, valorTotal: 4250.00 },
      { codigo: 'PROD003', descricao: 'Squeeze 500ml', ncm: '39241000', cfop: '5102', unidade: 'UN', quantidade: 300, valorUnitario: 20.00, valorTotal: 6000.00 }
    ]
  },
  {
    id: '2',
    numero: '000001235',
    serie: '1',
    chaveAcesso: '35240112345678000190550010000012351234567891',
    naturezaOperacao: 'Venda de Mercadoria',
    dataEmissao: '2024-01-18T14:15:00',
    cnpjEmitente: '12.345.678/0001-90',
    emitenteNome: 'Promo Brindes Ltda',
    cnpjDestinatario: '11.222.333/0001-44',
    destinatarioNome: 'Marketing Digital SA',
    destinatarioEndereco: 'Rua Augusta, 500 - São Paulo/SP',
    valorProdutos: 8500.00,
    valorFrete: 0,
    valorSeguro: 0,
    valorDesconto: 0,
    valorIPI: 0,
    valorICMS: 1530.00,
    valorTotal: 8500.00,
    status: 'autorizada',
    protocolo: '135240000123457',
    itens: [
      { codigo: 'PROD004', descricao: 'Mochila Executiva', ncm: '42029200', cfop: '5102', unidade: 'UN', quantidade: 50, valorUnitario: 85.00, valorTotal: 4250.00 },
      { codigo: 'PROD005', descricao: 'Power Bank 10000mAh', ncm: '85076000', cfop: '5102', unidade: 'UN', quantidade: 50, valorUnitario: 85.00, valorTotal: 4250.00 }
    ]
  },
  {
    id: '3',
    numero: '000001236',
    serie: '1',
    chaveAcesso: '35240112345678000190550010000012361234567892',
    naturezaOperacao: 'Venda de Mercadoria',
    dataEmissao: '2024-01-15T09:00:00',
    cnpjEmitente: '12.345.678/0001-90',
    emitenteNome: 'Promo Brindes Ltda',
    cnpjDestinatario: '55.666.777/0001-88',
    destinatarioNome: 'Eventos Premium Ltda',
    destinatarioEndereco: 'Av. Brasil, 2000 - Rio de Janeiro/RJ',
    valorProdutos: 25000.00,
    valorFrete: 800.00,
    valorSeguro: 250.00,
    valorDesconto: 1000.00,
    valorIPI: 0,
    valorICMS: 4500.00,
    valorTotal: 25050.00,
    status: 'cancelada',
    protocolo: '135240000123458',
    motivoCancelamento: 'Erro no pedido - cliente solicitou cancelamento',
    itens: [
      { codigo: 'PROD006', descricao: 'Kit Escritório Premium', ncm: '96081000', cfop: '5102', unidade: 'KIT', quantidade: 100, valorUnitario: 250.00, valorTotal: 25000.00 }
    ]
  },
  {
    id: '4',
    numero: '000001237',
    serie: '1',
    chaveAcesso: '35240112345678000190550010000012371234567893',
    naturezaOperacao: 'Venda de Mercadoria',
    dataEmissao: '2024-01-22T16:45:00',
    cnpjEmitente: '12.345.678/0001-90',
    emitenteNome: 'Promo Brindes Ltda',
    cnpjDestinatario: '22.333.444/0001-55',
    destinatarioNome: 'Corporação Delta',
    destinatarioEndereco: 'Rua das Flores, 123 - Curitiba/PR',
    valorProdutos: 45000.00,
    valorFrete: 1200.00,
    valorSeguro: 450.00,
    valorDesconto: 2000.00,
    valorIPI: 900.00,
    valorICMS: 8100.00,
    valorTotal: 45550.00,
    status: 'pendente',
    itens: [
      { codigo: 'PROD007', descricao: 'Camiseta Personalizada', ncm: '61091000', cfop: '5102', unidade: 'UN', quantidade: 500, valorUnitario: 45.00, valorTotal: 22500.00 },
      { codigo: 'PROD008', descricao: 'Boné Bordado', ncm: '65050090', cfop: '5102', unidade: 'UN', quantidade: 500, valorUnitario: 35.00, valorTotal: 17500.00 },
      { codigo: 'PROD009', descricao: 'Chaveiro Metal', ncm: '83062900', cfop: '5102', unidade: 'UN', quantidade: 500, valorUnitario: 10.00, valorTotal: 5000.00 }
    ]
  }
];

const statusConfig = {
  autorizada: { label: 'Autorizada', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  denegada: { label: 'Denegada', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
  inutilizada: { label: 'Inutilizada', color: 'bg-muted text-muted-foreground border-muted', icon: FileXIcon }
};

// NF-e Preview Component
const NFePreview = ({ nfe }: { nfe: NotaFiscal }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyChave = () => {
    navigator.clipboard.writeText(nfe.chaveAcesso);
    setCopied(true);
    toast.success('Chave de acesso copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXML = () => {
    toast.success('XML da NF-e baixado com sucesso!');
  };

  const handleDownloadDANFE = () => {
    toast.success('DANFE (PDF) gerado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Enviado para impressão!');
  };

  const handleSendEmail = () => {
    toast.success('NF-e enviada por e-mail!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">NF-e #{nfe.numero}</h3>
              <p className="text-sm text-muted-foreground">Série {nfe.serie}</p>
            </div>
          </div>
          <Badge variant="outline" className={statusConfig[nfe.status].color}>
            {statusConfig[nfe.status].label}
          </Badge>
        </div>

        {/* Chave de Acesso */}
        <div className="bg-background rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Chave de Acesso</div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono flex-1 break-all">
              {nfe.chaveAcesso}
            </code>
            <Button variant="ghost" size="sm" onClick={handleCopyChave}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {nfe.protocolo && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Protocolo:</span>
            <span className="font-mono">{nfe.protocolo}</span>
          </div>
        )}
      </div>

      {/* Emitente e Destinatário */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Emitente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{nfe.emitenteNome}</p>
            <p className="text-muted-foreground">{nfe.cnpjEmitente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{nfe.destinatarioNome}</p>
            <p className="text-muted-foreground">{nfe.cnpjDestinatario}</p>
            <p className="text-muted-foreground text-xs">{nfe.destinatarioEndereco}</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Data Emissão</span>
          <p className="font-medium">{formatDateTime(nfe.dataEmissao)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Natureza da Operação</span>
          <p className="font-medium">{nfe.naturezaOperacao}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Valor Total</span>
          <p className="font-bold text-lg text-primary">{formatCurrency(nfe.valorTotal)}</p>
        </div>
      </div>

      {/* Itens */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Itens ({nfe.itens.length})
        </h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Código</th>
                <th className="text-left p-2">Descrição</th>
                <th className="text-center p-2">Qtd</th>
                <th className="text-right p-2">Valor Unit.</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {nfe.itens.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 font-mono text-xs">{item.codigo}</td>
                  <td className="p-2">{item.descricao}</td>
                  <td className="p-2 text-center">{item.quantidade} {item.unidade}</td>
                  <td className="p-2 text-right">{formatCurrency(item.valorUnitario)}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totais */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Produtos</span>
            <p className="font-medium">{formatCurrency(nfe.valorProdutos)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Frete</span>
            <p className="font-medium">{formatCurrency(nfe.valorFrete)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Desconto</span>
            <p className="font-medium text-destructive">-{formatCurrency(nfe.valorDesconto)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ICMS</span>
            <p className="font-medium">{formatCurrency(nfe.valorICMS)}</p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <span className="font-medium">Valor Total da NF-e</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(nfe.valorTotal)}</span>
        </div>
      </div>

      {nfe.status === 'cancelada' && nfe.motivoCancelamento && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Nota Fiscal Cancelada</span>
          </div>
          <p className="text-sm text-muted-foreground">{nfe.motivoCancelamento}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDownloadXML} variant="outline" className="gap-2">
          <FileCode className="h-4 w-4" />
          Download XML
        </Button>
        <Button onClick={handleDownloadDANFE} className="gap-2">
          <Download className="h-4 w-4" />
          Download DANFE
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={handleSendEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          Enviar
        </Button>
      </div>
    </div>
  );
};

// Componente de Status SEFAZ em tempo real
const SefazStatusPanel = ({ 
  isProcessing, 
  currentStep, 
  response 
}: { 
  isProcessing: boolean; 
  currentStep: string; 
  response: SefazResponse | null;
}) => {
  const steps = [
    { id: 'validating', label: 'Validando dados', icon: ShieldCheck },
    { id: 'connecting', label: 'Conectando à SEFAZ', icon: Wifi },
    { id: 'sending', label: 'Enviando NF-e', icon: Send },
    { id: 'processing', label: 'Processando resposta', icon: Server },
    { id: 'done', label: 'Finalizado', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  if (!isProcessing && !response) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-muted/50 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        {isProcessing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : response?.success ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        <span className="font-medium">
          {isProcessing ? 'Comunicando com SEFAZ...' : 
           response?.success ? 'NF-e Autorizada!' : 'Erro na Autorização'}
        </span>
      </div>

      {isProcessing && (
        <>
          <Progress value={progress} className="h-2" />
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentIndex;
              const isDone = idx < currentIndex;
              return (
                <div 
                  key={step.id}
                  className={`text-center transition-colors ${
                    isActive ? 'text-primary' : isDone ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                >
                  <StepIcon className={`h-4 w-4 mx-auto mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-xs">{step.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {response && (
        <div className={`rounded-lg p-3 ${response.success ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={response.success ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
              cStat: {response.cStat}
            </Badge>
            <span className="text-sm font-medium">{response.xMotivo}</span>
          </div>
          {response.chaveAcesso && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Chave:</span>
                <code className="font-mono text-xs bg-background px-2 py-1 rounded">{response.chaveAcesso}</code>
              </div>
              {response.protocolo && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Protocolo:</span>
                  <code className="font-mono text-xs">{response.protocolo}</code>
                </div>
              )}
            </div>
          )}
          {response.errors && response.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {response.errors.map((err, idx) => (
                <p key={idx} className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Form para nova NF-e
const NovaNFeForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (nota: NotaFiscal) => void }) => {
  const { data: empresas = [] } = useEmpresas();
  
  const [formData, setFormData] = useState({
    destinatarioNome: '',
    destinatarioCnpj: '',
    destinatarioEndereco: '',
    naturezaOperacao: 'Venda de Mercadoria',
    empresa: '',
    observacoes: ''
  });

  const [itens, setItens] = useState<ItemNFe[]>([
    { codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, valorTotal: 0 }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [sefazResponse, setSefazResponse] = useState<SefazResponse | null>(null);

  const addItem = () => {
    setItens([...itens, { codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemNFe, value: string | number) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    if (field === 'quantidade' || field === 'valorUnitario') {
      newItens[index].valorTotal = newItens[index].quantidade * newItens[index].valorUnitario;
    }
    setItens(newItens);
  };

  const totalProdutos = itens.reduce((acc, item) => acc + item.valorTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setSefazResponse(null);

    const empresa = empresas.find(c => c.id === formData.empresa);
    
    // Simula os passos de processamento
    const steps = ['validating', 'connecting', 'sending', 'processing', 'done'];
    
    for (const step of steps.slice(0, -1)) {
      setCurrentStep(step);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    }

    // Prepara dados para o simulador SEFAZ
    const nfeData: NFEData = {
      numero: Math.floor(1000 + Math.random() * 9000),
      serie: 1,
      naturezaOperacao: formData.naturezaOperacao,
      dataEmissao: new Date(),
      emitente: {
        cnpj: empresa?.cnpj || '12.345.678/0001-90',
        razaoSocial: empresa?.razao_social || 'Promo Brindes Ltda',
        inscricaoEstadual: empresa?.inscricao_estadual || '123.456.789.123',
        uf: empresa?.estado || 'SP'
      },
      destinatario: {
        cpfCnpj: formData.destinatarioCnpj,
        nome: formData.destinatarioNome,
        endereco: formData.destinatarioEndereco
      },
      itens: itens.map(item => ({
        codigo: item.codigo || 'PROD001',
        descricao: item.descricao,
        ncm: item.ncm || '96082000',
        cfop: item.cfop,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal
      })),
      valorTotal: totalProdutos
    };

    // Registra evento de validação
    const tempoInicio = Date.now();
    registrarEvento({
      tipo: 'VALIDACAO',
      numeroNfe: String(nfeData.numero).padStart(9, '0'),
      cStat: '000',
      xMotivo: 'Validação de schema XML concluída',
      ambiente: 'homologacao',
      tempoResposta: Date.now() - tempoInicio,
      detalhes: 'Estrutura XML validada conforme schema NF-e 4.00'
    });

    // Registra evento de envio
    registrarEvento({
      tipo: 'ENVIO_LOTE',
      numeroNfe: String(nfeData.numero).padStart(9, '0'),
      cStat: '103',
      xMotivo: 'Lote recebido com sucesso',
      ambiente: 'homologacao',
      tempoResposta: 1200,
      detalhes: 'Lote enviado para processamento na SEFAZ'
    });

    // Processa com o simulador
    const response = await processarSefaz({
      tipo: 'autorizacao',
      nfeData
    });

    const tempoTotal = Date.now() - tempoInicio;

    // Registra evento de retorno
    registrarEvento({
      tipo: response.success ? 'AUTORIZACAO' : 'REJEICAO',
      numeroNfe: String(nfeData.numero).padStart(9, '0'),
      chaveAcesso: response.chaveAcesso,
      cStat: response.cStat,
      xMotivo: response.xMotivo,
      protocolo: response.protocolo,
      ambiente: 'homologacao',
      tempoResposta: tempoTotal,
      detalhes: response.success 
        ? 'NF-e autorizada com sucesso pela SEFAZ' 
        : `Rejeição: ${response.errors?.join(', ') || response.xMotivo}`
    });

    setCurrentStep('done');
    setSefazResponse(response);
    setIsProcessing(false);

    if (response.success) {
      toast.success(`NF-e autorizada! Protocolo: ${response.protocolo}`);
      
      // Cria a nota fiscal para adicionar à lista
      const novaNota: NotaFiscal = {
        id: Date.now().toString(),
        numero: String(nfeData.numero).padStart(9, '0'),
        serie: '1',
        chaveAcesso: response.chaveAcesso!,
        naturezaOperacao: formData.naturezaOperacao,
        dataEmissao: new Date().toISOString(),
        cnpjEmitente: nfeData.emitente.cnpj,
        emitenteNome: nfeData.emitente.razaoSocial,
        cnpjDestinatario: formData.destinatarioCnpj,
        destinatarioNome: formData.destinatarioNome,
        destinatarioEndereco: formData.destinatarioEndereco,
        valorProdutos: totalProdutos,
        valorFrete: 0,
        valorSeguro: 0,
        valorDesconto: 0,
        valorIPI: 0,
        valorICMS: totalProdutos * 0.18,
        valorTotal: totalProdutos,
        status: 'autorizada',
        protocolo: response.protocolo,
        itens: itens
      };

      setTimeout(() => onSuccess(novaNota), 1500);
    } else {
      toast.error(`Rejeição SEFAZ: ${response.xMotivo}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      {/* SEFAZ Status Panel */}
      <AnimatePresence>
        <SefazStatusPanel 
          isProcessing={isProcessing} 
          currentStep={currentStep} 
          response={sefazResponse} 
        />
      </AnimatePresence>

      {/* Destinatário */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Destinatário
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="destinatarioNome">Razão Social / Nome</Label>
            <Input
              id="destinatarioNome"
              value={formData.destinatarioNome}
              onChange={(e) => setFormData({ ...formData, destinatarioNome: e.target.value })}
              placeholder="Nome do destinatário"
              required
            />
          </div>
          <div>
            <Label htmlFor="destinatarioCnpj">CNPJ/CPF</Label>
            <Input
              id="destinatarioCnpj"
              value={formData.destinatarioCnpj}
              onChange={(e) => setFormData({ ...formData, destinatarioCnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>
          <div>
            <Label htmlFor="empresa">Empresa Emitente</Label>
            <Select
              value={formData.empresa}
              onValueChange={(value) => setFormData({ ...formData, empresa: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="destinatarioEndereco">Endereço Completo</Label>
            <Input
              id="destinatarioEndereco"
              value={formData.destinatarioEndereco}
              onChange={(e) => setFormData({ ...formData, destinatarioEndereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade/UF"
              required
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Itens */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Itens da NF-e
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus className="h-3 w-3" />
            Adicionar Item
          </Button>
        </div>

        {itens.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
              {itens.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Código</Label>
                <Input
                  value={item.codigo}
                  onChange={(e) => updateItem(index, 'codigo', e.target.value)}
                  placeholder="SKU"
                />
              </div>
              <div className="col-span-3">
                <Label>Descrição</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                  placeholder="Descrição do produto"
                  required
                />
              </div>
              <div>
                <Label>NCM</Label>
                <Input
                  value={item.ncm}
                  onChange={(e) => updateItem(index, 'ncm', e.target.value)}
                  placeholder="00000000"
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Valor Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.valorUnitario}
                  onChange={(e) => updateItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Total</Label>
                <Input
                  value={formatCurrency(item.valorTotal)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total dos Produtos:</span>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalProdutos)}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Observações */}
      <div>
        <Label htmlFor="observacoes">Informações Adicionais</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações, informações complementares..."
          rows={3}
        />
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-4 sticky bottom-0 bg-background">
        <Button 
          type="submit" 
          className="flex-1 gap-2"
          disabled={isProcessing || sefazResponse?.success}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : sefazResponse?.success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Autorizada!
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Transmitir para SEFAZ
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isProcessing}
        >
          {sefazResponse?.success ? 'Fechar' : 'Cancelar'}
        </Button>
      </div>
    </form>
  );
};

export default function NotasFiscais() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showNovaNFe, setShowNovaNFe] = useState(false);
  const [notas, setNotas] = useState<NotaFiscal[]>(mockNotasFiscais);
  const [isConsultando, setIsConsultando] = useState(false);
  const [notaCancelar, setNotaCancelar] = useState<NotaFiscal | null>(null);

  const handleNovaNota = useCallback((novaNota: NotaFiscal) => {
    setNotas(prev => [novaNota, ...prev]);
    setShowNovaNFe(false);
  }, []);

  const handleCancelarNota = useCallback((notaId: string, justificativa: string) => {
    setNotas(prev => prev.map(nota => 
      nota.id === notaId 
        ? { ...nota, status: 'cancelada' as const, motivoCancelamento: justificativa }
        : nota
    ));
    setNotaCancelar(null);
  }, []);

  const handleConsultarSefaz = useCallback(async () => {
    setIsConsultando(true);
    toast.info('Consultando status na SEFAZ...');
    
    // Simula consulta de notas pendentes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setNotas(prev => prev.map(nota => {
      if (nota.status === 'pendente') {
        // 80% de chance de autorizar
        if (Math.random() > 0.2) {
          toast.success(`NF-e #${nota.numero} autorizada!`);
          return {
            ...nota,
            status: 'autorizada' as const,
            protocolo: `135${new Date().getFullYear()}${String(Math.floor(Math.random() * 9999999999)).padStart(10, '0')}`
          };
        }
      }
      return nota;
    }));
    
    setIsConsultando(false);
    toast.success('Consulta SEFAZ finalizada!');
  }, []);

  // Calculate KPIs
  const totalEmitido = notas.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.valorTotal, 0);
  const totalCancelado = notas.filter(n => n.status === 'cancelada').reduce((acc, n) => acc + n.valorTotal, 0);
  const totalPendente = notas.filter(n => n.status === 'pendente').reduce((acc, n) => acc + n.valorTotal, 0);
  const notasAutorizadas = notas.filter(n => n.status === 'autorizada').length;

  const filteredNotas = notas.filter(nota => {
    const matchesSearch = nota.numero.includes(searchTerm) ||
      nota.destinatarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.chaveAcesso.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || nota.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpis = [
    { label: 'Total Emitido', value: totalEmitido, count: notasAutorizadas, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Pendente Autorização', value: totalPendente, count: notas.filter(n => n.status === 'pendente').length, icon: Clock, color: 'text-amber-500' },
    { label: 'Canceladas', value: totalCancelado, count: notas.filter(n => n.status === 'cancelada').length, icon: XCircle, color: 'text-red-500' },
    { label: 'Notas Este Mês', value: notas.length, isCount: true, icon: FileText, color: 'text-primary' }
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
            <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais Eletrônicas</h1>
            <p className="text-muted-foreground mt-1">
              Emissão e controle de NF-e com integração SEFAZ
            </p>
          </div>
          <Dialog open={showNovaNFe} onOpenChange={setShowNovaNFe}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Emitir NF-e
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Emitir Nova NF-e
                </DialogTitle>
              </DialogHeader>
              <NovaNFeForm onClose={() => setShowNovaNFe(false)} onSuccess={handleNovaNota} />
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <p className="text-xs text-muted-foreground mt-1">
                          {kpi.count} nota(s)
                        </p>
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

        {/* Tabs para Notas e Histórico */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="notas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="notas" className="gap-2">
                <FileText className="h-4 w-4" />
                Notas Fiscais
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="inutilizacao" className="gap-2">
                <FileXIcon className="h-4 w-4" />
                Inutilização
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <History className="h-4 w-4" />
                Histórico SEFAZ
              </TabsTrigger>
              <TabsTrigger value="contingencia" className="gap-2">
                <Shield className="h-4 w-4" />
                Contingência
              </TabsTrigger>
              <TabsTrigger value="monitor" className="gap-2">
                <Activity className="h-4 w-4" />
                Monitor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notas" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por número, destinatário ou chave de acesso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="autorizada">Autorizada</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="denegada">Denegada</SelectItem>
                        <SelectItem value="inutilizada">Inutilizada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={handleConsultarSefaz}
                      disabled={isConsultando}
                    >
                      {isConsultando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Consultar SEFAZ
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notas List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                Notas Fiscais Emitidas
              </CardTitle>
              <CardDescription>
                {filteredNotas.length} nota(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredNotas.map((nota, index) => {
                    const StatusIcon = statusConfig[nota.status].icon;
                    return (
                      <motion.div
                        key={nota.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-3 rounded-full bg-primary/10 shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">NF-e #{nota.numero}</span>
                                <span className="text-muted-foreground text-sm">Série {nota.serie}</span>
                                <Badge 
                                  variant="outline" 
                                  className={statusConfig[nota.status].color}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[nota.status].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {nota.destinatarioNome}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                                {nota.chaveAcesso}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-lg">{formatCurrency(nota.valorTotal)}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3" />
                              {formatDate(nota.dataEmissao)}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    NF-e #{nota.numero}
                                  </DialogTitle>
                                </DialogHeader>
                                <NFePreview nfe={nota} />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(nota.chaveAcesso);
                                toast.success('Chave de acesso copiada!');
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toast.success('XML baixado!')}
                            >
                              <FileCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toast.success('DANFE gerado!')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {nota.status === 'autorizada' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setNotaCancelar(nota)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Cancelar NF-e"
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

                {filteredNotas.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma nota fiscal encontrada</p>
                    <p className="text-sm">Tente ajustar os filtros ou emita uma nova NF-e</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-emerald-500/10">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Autorização</p>
                    <p className="text-2xl font-bold">
                      {((notas.filter(n => n.status === 'autorizada').length / notas.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalEmitido / (notasAutorizadas || 1))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Hash className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Itens Faturados</p>
                    <p className="text-2xl font-bold">
                      {notas.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.itens.reduce((a, i) => a + i.quantidade, 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="analytics">
              <SefazAnalytics />
            </TabsContent>

            <TabsContent value="inutilizacao">
              <InutilizacaoNFe />
            </TabsContent>

            <TabsContent value="historico">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EventosHistorico />
                </div>
                <div>
                  <AlertasRejeicao />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contingencia">
              <ContingenciaNFe />
            </TabsContent>

            <TabsContent value="monitor">
              <SefazMonitor />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Dialog de Cancelamento */}
        <Dialog open={!!notaCancelar} onOpenChange={(open) => !open && setNotaCancelar(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Cancelar NF-e
              </DialogTitle>
            </DialogHeader>
            {notaCancelar && (
              <CancelamentoNFe
                nota={notaCancelar}
                onClose={() => setNotaCancelar(null)}
                onSuccess={handleCancelarNota}
              />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </MainLayout>
  );
}
