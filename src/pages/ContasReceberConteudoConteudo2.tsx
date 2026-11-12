import { motion } from 'framer-motion';
import { QuickDateFilters } from '@/components/ui/quick-date-filters';
import { ContasReceberFilters } from '@/components/contas-receber/ContasReceberFilters';
import { itemVariants } from './ContasReceber.helpers';

interface ContasReceberConteudoConteudo2Props {
  filterType: import('@/components/ui/quick-date-filters').DateFilterOption;
  handleFilterChange: (
    type: import('@/components/ui/quick-date-filters').DateFilterOption,
    range: { start: Date; end: Date } | null
  ) => void;
  searchTerm: string;
  handleSearchChange: (value: string) => void;
  statusFilter: string;
  handleStatusChange: (value: string) => void;
  centroCustoFilter: string;
  handleCentroCustoChange: (value: string) => void;
  centrosCusto: {
    ativo: boolean | null;
    codigo: string | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    orcamento_previsto: number | null;
    orcamento_realizado: number | null;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  empresaFilter: string;
  handleEmpresaChange: (value: string) => void;
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
  formaFilter: string;
  handleFormaChange: (value: string) => void;
  contaBancariaFilter: string;
  handleContaBancariaChange: (value: string) => void;
  contasBancarias: import('@/hooks/financial/types').ContaBancariaComRegras[];
  advancedFilters: import('@/components/ui/advanced-filters').AdvancedFilters;
  setAdvancedFilters: import('react').Dispatch<
    import('react').SetStateAction<import('@/components/ui/advanced-filters').AdvancedFilters>
  >;
}

export function ContasReceberConteudoConteudo2({
  filterType,
  handleFilterChange,
  searchTerm,
  handleSearchChange,
  statusFilter,
  handleStatusChange,
  centroCustoFilter,
  handleCentroCustoChange,
  centrosCusto,
  empresaFilter,
  handleEmpresaChange,
  empresas,
  formaFilter,
  handleFormaChange,
  contaBancariaFilter,
  handleContaBancariaChange,
  contasBancarias,
  advancedFilters,
  setAdvancedFilters,
}: ContasReceberConteudoConteudo2Props) {
  return (
    <div className="space-y-6">
      <motion.div variants={itemVariants}>
        <QuickDateFilters value={filterType} onChange={handleFilterChange} showOverdue />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ContasReceberFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          centroCustoFilter={centroCustoFilter}
          onCentroCustoChange={handleCentroCustoChange}
          centrosCusto={centrosCusto}
          empresaFilter={empresaFilter}
          onEmpresaChange={handleEmpresaChange}
          empresas={empresas}
          formaFilter={formaFilter}
          onFormaChange={handleFormaChange}
          contaBancariaFilter={contaBancariaFilter}
          onContaBancariaChange={handleContaBancariaChange}
          contasBancarias={contasBancarias}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
        />
      </motion.div>
    </div>
  );
}
