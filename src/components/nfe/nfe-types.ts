import { CheckCircle2, Clock, XCircle, AlertCircle, FileX as FileXIcon } from 'lucide-react';

export interface ItemNFe {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface NotaFiscal {
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

export const statusConfig = {
  autorizada: {
    label: 'Autorizada',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  pendente: {
    label: 'Pendente',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  cancelada: {
    label: 'Cancelada',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  denegada: {
    label: 'Denegada',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
  },
  inutilizada: {
    label: 'Inutilizada',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: FileXIcon,
  },
};

export const mockNotasFiscais: NotaFiscal[] = [
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
    valorProdutos: 15750.0,
    valorFrete: 350.0,
    valorSeguro: 0,
    valorDesconto: 500.0,
    valorIPI: 0,
    valorICMS: 2835.0,
    valorTotal: 15600.0,
    status: 'autorizada',
    protocolo: '135240000123456',
    itens: [
      {
        codigo: 'PROD001',
        descricao: 'Caneta Personalizada',
        ncm: '96082000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 1000,
        valorUnitario: 5.5,
        valorTotal: 5500.0,
      },
      {
        codigo: 'PROD002',
        descricao: 'Bloco de Notas A5',
        ncm: '48201000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 500,
        valorUnitario: 8.5,
        valorTotal: 4250.0,
      },
      {
        codigo: 'PROD003',
        descricao: 'Squeeze 500ml',
        ncm: '39241000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 300,
        valorUnitario: 20.0,
        valorTotal: 6000.0,
      },
    ],
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
    valorProdutos: 8500.0,
    valorFrete: 0,
    valorSeguro: 0,
    valorDesconto: 0,
    valorIPI: 0,
    valorICMS: 1530.0,
    valorTotal: 8500.0,
    status: 'autorizada',
    protocolo: '135240000123457',
    itens: [
      {
        codigo: 'PROD004',
        descricao: 'Mochila Executiva',
        ncm: '42029200',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 50,
        valorUnitario: 85.0,
        valorTotal: 4250.0,
      },
      {
        codigo: 'PROD005',
        descricao: 'Power Bank 10000mAh',
        ncm: '85076000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 50,
        valorUnitario: 85.0,
        valorTotal: 4250.0,
      },
    ],
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
    valorProdutos: 25000.0,
    valorFrete: 800.0,
    valorSeguro: 250.0,
    valorDesconto: 1000.0,
    valorIPI: 0,
    valorICMS: 4500.0,
    valorTotal: 25050.0,
    status: 'cancelada',
    protocolo: '135240000123458',
    motivoCancelamento: 'Erro no pedido - cliente solicitou cancelamento',
    itens: [
      {
        codigo: 'PROD006',
        descricao: 'Kit Escritório Premium',
        ncm: '96081000',
        cfop: '5102',
        unidade: 'KIT',
        quantidade: 100,
        valorUnitario: 250.0,
        valorTotal: 25000.0,
      },
    ],
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
    valorProdutos: 45000.0,
    valorFrete: 1200.0,
    valorSeguro: 450.0,
    valorDesconto: 2000.0,
    valorIPI: 900.0,
    valorICMS: 8100.0,
    valorTotal: 45550.0,
    status: 'pendente',
    itens: [
      {
        codigo: 'PROD007',
        descricao: 'Camiseta Personalizada',
        ncm: '61091000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 500,
        valorUnitario: 45.0,
        valorTotal: 22500.0,
      },
      {
        codigo: 'PROD008',
        descricao: 'Boné Bordado',
        ncm: '65050090',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 500,
        valorUnitario: 35.0,
        valorTotal: 17500.0,
      },
      {
        codigo: 'PROD009',
        descricao: 'Chaveiro Metal',
        ncm: '83062900',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 500,
        valorUnitario: 10.0,
        valorTotal: 5000.0,
      },
    ],
  },
];
