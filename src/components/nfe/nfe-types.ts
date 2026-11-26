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
  /** Grupo IBS/CBS/IS do item (NT 2025.002). Percentuais em %, não fração. */
  cstIbsCbs?: string;
  cClassTrib?: string;
  vBCIbsCbs?: number;
  pIBSUF?: number;
  vIBSUF?: number;
  pIBSMun?: number;
  vIBSMun?: number;
  pCBS?: number;
  vCBS?: number;
  vIBS?: number;
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
  /** Empresa dona da nota — necessária para assinar a URL do XML no bucket. */
  empresaId?: string;
  /** Sentido fiscal: compra (entrada) não entra nos indicadores de emissão. */
  direcao?: 'saida' | 'entrada' | 'indefinida';
  /** URLs dos arquivos realmente importados (XML autorizado e DANFE em PDF). */
  xmlUrl?: string;
  pdfUrl?: string;
  /** true quando o XML existe no bucket privado `nfe-xml` (URL assinada sob demanda). */
  xmlNoStorage?: boolean;
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
