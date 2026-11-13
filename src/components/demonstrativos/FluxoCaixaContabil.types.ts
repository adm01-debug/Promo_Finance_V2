export interface FluxoCaixaContabilProps {
  periodo: string;
  mes: number;
  ano: number;
  empresaId: string;
}

export interface FluxoLinha {
  codigo: string;
  descricao: string;
  valor: number;
  nivel: number;
  tipo: 'entrada' | 'saida' | 'subtotal' | 'total';
}
