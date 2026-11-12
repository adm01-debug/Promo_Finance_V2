import { Calendar, Users, Building2, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardReceberConteudoProps {
  periodo: string;
  handlePeriodoChange: (value: string) => void;
  empresaId: string;
  setEmpresaId: (v: string) => void;
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
  vendedorId: string;
  setVendedorId: (v: string) => void;
  vendedores: {
    ativo: boolean | null;
    created_at: string | null;
    email: string | null;
    empresa_id: string | null;
    id: string;
    meta_mensal: number | null;
    nome: string;
    telefone: string | null;
  }[];
  ramoAtividade: string;
  setRamoAtividade: (v: string) => void;
  ramosAtividade: string[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  clienteId: string;
  setClienteId: (v: string) => void;
  clientes: import('@/hooks/useFinancialData').ExternalCliente[];
}

export function DashboardReceberConteudo({
  periodo,
  handlePeriodoChange,
  empresaId,
  setEmpresaId,
  empresas,
  vendedorId,
  setVendedorId,
  vendedores,
  ramoAtividade,
  setRamoAtividade,
  ramosAtividade,
  statusFilter,
  setStatusFilter,
  clienteId,
  setClienteId,
  clientes,
}: DashboardReceberConteudoProps) {
  return (
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Select value={periodo} onValueChange={handlePeriodoChange}>
          <SelectTrigger>
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger>
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas empresas</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome_fantasia || e.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vendedorId} onValueChange={setVendedorId}>
          <SelectTrigger>
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos vendedores</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ramoAtividade} onValueChange={setRamoAtividade}>
          <SelectTrigger>
            <PieChartIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ramo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos ramos</SelectItem>
            {ramosAtividade.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <Clock className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger>
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos clientes</SelectItem>
            {clientes.slice(0, 50).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome_fantasia || c.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  );
}
