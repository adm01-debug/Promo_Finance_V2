import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Building2 } from 'lucide-react';

interface DashboardReformaTributariaHeaderWithGlobalEmpresaProps {
  empresaId: string;
  setEmpresaId: import('react').Dispatch<import('react').SetStateAction<string>>;
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  faseAtual: import('@/types/reforma-tributaria').FaseTransicao;
  anoReferencia: number;
  setAnoReferencia: (ano: number) => void;
}

export function DashboardReformaTributariaHeaderWithGlobalEmpresa({
  empresaId,
  setEmpresaId,
  empresas,
  faseAtual,
  anoReferencia,
  setAnoReferencia,
}: DashboardReformaTributariaHeaderWithGlobalEmpresaProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
            Reforma Tributária
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            Gestão contábil - LC 214/2025
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
          {/* Seletor de Empresa Global */}
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="w-36 sm:w-48 h-8 sm:h-10 text-xs sm:text-sm">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <SelectValue placeholder="Todas empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Empresas</SelectItem>
              {empresas.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.razao_social || emp.nome_fantasia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="px-2 sm:px-4 py-1 sm:py-2 text-xs whitespace-nowrap">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Fase: </span>
            {faseAtual.replace('_', ' ').toUpperCase()}
          </Badge>

          <Select value={String(anoReferencia)} onValueChange={(v) => setAnoReferencia(Number(v))}>
            <SelectTrigger className="w-20 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((ano) => (
                <SelectItem key={ano} value={String(ano)}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
