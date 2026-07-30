import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, RefreshCw, Loader2 } from 'lucide-react';

interface Empresa { id: string; nome_fantasia?: string | null; razao_social: string }
interface Conta { id: string; banco: string; conta: string }

interface Props {
  periodoInicio: string;
  periodoFim: string;
  empresaSelecionada: string;
  contaSelecionada: string;
  empresas: Empresa[];
  contasBancarias: Conta[];
  isLoading: boolean;
  onPeriodoInicioChange: (v: string) => void;
  onPeriodoFimChange: (v: string) => void;
  onEmpresaChange: (v: string) => void;
  onContaChange: (v: string) => void;
  onRefresh: () => void;
}

export function RelatoriosFilters({
  periodoInicio, periodoFim, empresaSelecionada, contaSelecionada,
  empresas, contasBancarias, isLoading,
  onPeriodoInicioChange, onPeriodoFimChange, onEmpresaChange, onContaChange, onRefresh,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input type="date" value={periodoInicio} onChange={(e) => onPeriodoInicioChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input type="date" value={periodoFim} onChange={(e) => onPeriodoFimChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={empresaSelecionada} onValueChange={onEmpresaChange}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {empresas.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Conta Bancária</Label>
            <Select value={contaSelecionada} onValueChange={onContaChange}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {contasBancarias.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.banco} - {c.conta}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
