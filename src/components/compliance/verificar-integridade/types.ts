export interface ManifestArquivo {
  linhas: number;
  sha256: string;
}

export interface Manifest {
  gerado_em?: string;
  gerado_por?: string;
  gerado_por_id?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  escopos?: string[];
  arquivos: Record<string, ManifestArquivo>;
}

export type ResultadoArquivo =
  | { nome: string; status: "ok"; hashEsperado: string; hashCalculado: string }
  | {
      nome: string;
      status: "divergente";
      hashEsperado: string;
      hashCalculado: string;
    }
  | { nome: string; status: "ausente"; hashEsperado: string }
  | { nome: string; status: "extra"; hashCalculado: string };

export interface Resumo {
  totalManifest: number;
  ok: number;
  divergentes: number;
  ausentes: number;
  extras: number;
  resultados: ResultadoArquivo[];
}
