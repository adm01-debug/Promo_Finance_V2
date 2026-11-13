import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  User,
  Clock,
  Zap,
  CheckCircle2,
  Search,
  X,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateConciliacaoAuditPDF } from '@/lib/pdf-generator';
import { ConciliacaoAuditPanelConteudo } from './ConciliacaoAuditPanelConteudo';

export function ConciliacaoAuditPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: profiles } = useQuery({
    queryKey: ['profiles-audit'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name');
      return data || [];
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts-audit'],
    queryFn: async () => {
      const { data } = await supabase.from('contas_bancarias').select('id, nome, banco');
      return data || [];
    },
  });

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['conciliacao-audit', userFilter, accountFilter, classFilter, dateFrom, dateTo],
    queryFn: async () => {
      // Compensações de centavos
      let compQuery = supabase
        .from('transacoes_bancarias')
        .select(
          `
          id, 
          descricao, 
          data, 
          valor, 
          conta_bancaria_id,
          compensacao_valor, 
          compensacao_motivo, 
          compensacao_classificacao, 
          compensacao_regra, 
          compensacao_aceita_por,
          compensacao_aceita_em,
          compensacao_evidencia_url
        `
        )
        .not('compensacao_valor', 'is', null)
        .neq('compensacao_valor', 0);

      if (userFilter !== 'all') compQuery = compQuery.eq('compensacao_aceita_por', userFilter);
      if (accountFilter !== 'all') compQuery = compQuery.eq('conta_bancaria_id', accountFilter);
      if (classFilter !== 'all') compQuery = compQuery.eq('compensacao_classificacao', classFilter);
      if (dateFrom) compQuery = compQuery.gte('compensacao_aceita_em', dateFrom);
      if (dateTo) compQuery = compQuery.lte('compensacao_aceita_em', dateTo);

      const { data: compensacoes } = await compQuery.order('compensacao_aceita_em', {
        ascending: false,
      });

      // Divergências
      let divQuery = supabase
        .from('divergencias_conciliacao')
        .select(
          `
          id,
          descricao,
          tipo_divergencia,
          valor_divergencia,
          conta_bancaria_id,
          created_at,
          status,
          resolvido_por,
          resolvido_em
        `
        )
        .eq('status', 'aceito');

      if (userFilter !== 'all') divQuery = divQuery.eq('resolvido_por', userFilter);
      if (accountFilter !== 'all') divQuery = divQuery.eq('conta_bancaria_id', accountFilter);
      if (dateFrom) divQuery = divQuery.gte('resolvido_em', dateFrom);
      if (dateTo) divQuery = divQuery.lte('resolvido_em', dateTo);

      const { data: divergencias } = await divQuery.order('resolvido_em', { ascending: false });

      return { compensacoes: compensacoes || [], divergencias: divergencias || [] };
    },
  });

  const filteredItems = useMemo(() => {
    if (!auditData) return [];

    const all = [
      ...auditData.compensacoes.map((c) => ({
        id: `comp-${c.id}`,
        type: 'compensacao',
        evento: c.descricao,
        valor: c.compensacao_valor || 0,
        responsavel:
          profiles?.find((p) => p.id === c.compensacao_aceita_por)?.full_name ||
          (c.compensacao_aceita_por ? 'Usuário' : 'IA (Automático)'),
        data: c.compensacao_aceita_em || c.data,
        regra: c.compensacao_regra || c.compensacao_motivo || '',
        classificacao: c.compensacao_classificacao ?? undefined,
        evidencia_url: c.compensacao_evidencia_url,
        conta: accounts?.find((a) => a.id === c.conta_bancaria_id)?.nome || 'N/A',
      })),
      ...auditData.divergencias.map((d) => ({
        id: `div-${d.id}`,
        type: 'divergencia',
        evento: `Divergência: ${d.descricao}`,
        valor: d.valor_divergencia || 0,
        responsavel: profiles?.find((p) => p.id === d.resolvido_por)?.full_name || 'Sistema',
        data: d.resolvido_em || d.created_at || '',
        regra: 'Aceite manual de divergência de saldo',
        classificacao: 'Divergência',
        evidencia_url: null,
        conta: accounts?.find((a) => a.id === d.conta_bancaria_id)?.nome || 'N/A',
      })),
    ];

    if (!searchTerm)
      return all.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return all
      .filter(
        (item) =>
          item.evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.regra?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [auditData, searchTerm, profiles, accounts]);

  const handleExportPDF = () => {
    const filters = {
      user:
        userFilter !== 'all'
          ? (profiles?.find((p) => p.id === userFilter)?.full_name ?? undefined)
          : 'Todos',
      conta:
        accountFilter !== 'all'
          ? (accounts?.find((a) => a.id === accountFilter)?.nome ?? undefined)
          : 'Todas',
      inicio: dateFrom,
      fim: dateTo,
      classificacao: classFilter !== 'all' ? classFilter : 'Todas',
    };

    generateConciliacaoAuditPDF(
      filteredItems.map((i) => ({
        evento: i.evento,
        valor: i.valor,
        responsavel: i.responsavel,
        data: i.data,
        regra: i.regra,
        classificacao: i.classificacao,
        evidencia_url: i.evidencia_url || undefined,
      })),
      filters
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUserFilter('all');
    setAccountFilter('all');
    setClassFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Auditoria de Conciliação</h2>
          <p className="text-muted-foreground">
            Rastreio completo de ajustes, compensações e aceites manuais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" /> Exportar Relatório (PDF)
          </Button>
        </div>
      </div>

      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3 w-3" /> Buscar
              </label>
              <Input
                placeholder="Evento, responsável ou regra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" /> Usuário
              </label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Classificação
              </label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas as regras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regras</SelectItem>
                  <SelectItem value="Juros">Juros</SelectItem>
                  <SelectItem value="Desconto">Desconto</SelectItem>
                  <SelectItem value="Divergência">Divergência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Conta Bancária
              </label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome} ({a.banco})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-end justify-between gap-4 pt-2">
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> De
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Até
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            {(searchTerm ||
              userFilter !== 'all' ||
              accountFilter !== 'all' ||
              classFilter !== 'all' ||
              dateFrom ||
              dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs gap-1.5 h-9"
              >
                <X className="h-3.5 w-3.5" /> Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
              <Zap className="h-4 w-4" /> Ajustes de Centavos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{auditData?.compensacoes.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-warning flex items-center gap-2">
              <Shield className="h-4 w-4" /> Divergências Aceitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{auditData?.divergencias.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-muted bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Total Auditado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredItems.length}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Divergências Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {auditData?.divergencias.filter((d) => d.status === 'pendente').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <ConciliacaoAuditPanelConteudo isLoading={isLoading} filteredItems={filteredItems} />
        </CardContent>
      </Card>
    </div>
  );
}
