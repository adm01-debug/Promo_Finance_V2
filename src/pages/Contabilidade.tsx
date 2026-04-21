import { useState } from 'react';
import { BookOpen, FileText, Calculator, Building2, BookText, BarChart3 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmpresas } from '@/hooks/useFinancialData';
import { PlanoContasTab } from '@/components/contabilidade/PlanoContasTab';
import { LancamentosTab } from '@/components/contabilidade/LancamentosTab';
import { SpedContabilTab } from '@/components/contabilidade/SpedContabilTab';
import { RazaoDiarioTab } from '@/components/contabilidade/RazaoDiarioTab';
import { DreBalancoTab } from '@/components/contabilidade/DreBalancoTab';

export default function Contabilidade() {
  const { data: empresas = [] } = useEmpresas();
  const [empresaId, setEmpresaId] = useState<string>('');
  const [ano, setAno] = useState(new Date().getFullYear() - 1);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Contabilidade & SPED
            </h1>
            <p className="text-muted-foreground">Plano de contas, lançamentos e geração de ECD/ECF</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="w-[220px]">
                  <Building2 className="mr-2 h-4 w-4" /><SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ano-calendário</Label>
              <Input type="number" min={2010} max={new Date().getFullYear()} value={ano} onChange={e => setAno(Number(e.target.value))} className="w-[100px]" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="plano" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="plano" className="gap-1.5"><BookOpen className="h-4 w-4" />Plano</TabsTrigger>
            <TabsTrigger value="lancamentos" className="gap-1.5"><Calculator className="h-4 w-4" />Lançamentos</TabsTrigger>
            <TabsTrigger value="razao" className="gap-1.5"><BookText className="h-4 w-4" />Razão & Diário</TabsTrigger>
            <TabsTrigger value="dre" className="gap-1.5"><BarChart3 className="h-4 w-4" />DRE & Balanço</TabsTrigger>
            <TabsTrigger value="ecd" className="gap-1.5"><FileText className="h-4 w-4" />SPED ECD</TabsTrigger>
            <TabsTrigger value="ecf" className="gap-1.5"><FileText className="h-4 w-4" />SPED ECF</TabsTrigger>
          </TabsList>

          <TabsContent value="plano"><PlanoContasTab empresaId={empresaId} /></TabsContent>
          <TabsContent value="lancamentos"><LancamentosTab empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="razao"><RazaoDiarioTab empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="dre"><DreBalancoTab empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="ecd"><SpedContabilTab tipo="ECD" empresaId={empresaId} /></TabsContent>
          <TabsContent value="ecf"><SpedContabilTab tipo="ECF" empresaId={empresaId} /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
