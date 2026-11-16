import { UseFormReturn } from 'react-hook-form';

export interface ContaReceberFormValues {
  cliente_id?: string;
  cliente_nome?: string;
  descricao?: string;
  valor?: number;
  data_vencimento?: string;
  data_emissao?: string;
  empresa_id?: string;
  centro_custo_id?: string;
  categoria_id?: string;
  conta_bancaria_id?: string;
  vendedor_id?: string;
  tipo_cobranca?:
    | 'boleto'
    | 'pix'
    | 'cartao_credito'
    | 'cartao_debito'
    | 'transferencia'
    | 'dinheiro';
  numero_documento?: string;
  codigo_barras?: string;
  chave_pix?: string;
  link_boleto?: string;
  observacoes?: string;
  recorrente?: boolean;
  frequencia_recorrencia?: string;
  parcelado?: boolean;
  numero_parcelas?: number;
}

export interface ClienteOption {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj_cpf?: string | null;
  score?: number | null;
}

export interface EmpresaOption {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
}

export interface CentroCustoOption {
  id: string;
  codigo: string | null;
  nome: string | null;
}

export interface ContaBancariaOption {
  id: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
}

export interface VendedorOption {
  id: string;
  nome: string;
}

export interface CategoriaOption {
  id: string;
  nome: string;
}

export interface Props {
  form: UseFormReturn<ContaReceberFormValues>;
  isEditing: boolean;
  clientes: ClienteOption[];
  empresas: EmpresaOption[];
  centrosCusto: CentroCustoOption[];
  contasBancarias: ContaBancariaOption[];
  vendedores: VendedorOption[];
  showClienteSelect: boolean;
  setShowClienteSelect: (v: boolean) => void;
  onClienteSelect: (id: string) => void;
  categorias?: CategoriaOption[];
}
