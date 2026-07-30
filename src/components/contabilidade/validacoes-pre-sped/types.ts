export interface ValidacoesPreSpedArquivo {
  tipo: 'ECD' | 'ECF';
  ano_calendario: number;
  hash_sha256: string | null;
  status: string;
  validacoes: { erros: string[]; avisos: string[] };
  cnpj?: string;
  razao_social?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  gerado_por?: string | null;
  created_at?: string;
  total_lancamentos?: number | null;
  total_linhas?: number | null;
}
