import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, Printer } from 'lucide-react';

interface RelatoriosContabeisTributariosFiltrosProps {
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
  periodoInicio: string;
  setPeriodoInicio: import('react').Dispatch<import('react').SetStateAction<string>>;
  periodoFim: string;
  setPeriodoFim: import('react').Dispatch<import('react').SetStateAction<string>>;
  handleExportar: (formato: 'pdf' | 'excel') => void;
}

export function RelatoriosContabeisTributariosFiltros({
  empresaId,
  setEmpresaId,
  empresas,
  periodoInicio,
  setPeriodoInicio,
  periodoFim,
  setPeriodoFim,
  handleExportar,
}: RelatoriosContabeisTributariosFiltrosProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Relatórios Contábeis Tributários
        </CardTitle>
        <CardDescription>DRE Tributário, Balancete e Análises de Carga Tributária</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2 min-w-48">
            <Label>Empresa</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
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
          <div className="space-y-2">
            <Label>Período Inicial</Label>
            <Input
              type="month"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-2">
            <Label>Período Final</Label>
            <Input
              type="month"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!empresaId} onClick={() => handleExportar('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel (CSV)
            </Button>
            <Button variant="outline" disabled={!empresaId} onClick={() => handleExportar('pdf')}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
