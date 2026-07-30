import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AuditRow {
  id: string;
  empresa_id: string | null;
  empresa_nome: string | null;
  user_id: string | null;
  user_nome: string | null;
  user_email: string | null;
  acao: 'insert' | 'update' | 'delete';
  entidade_tipo: string;
  entidade_id: string | null;
  payload_anterior: unknown;
  payload_novo: unknown;
  criado_em: string;
}

const corAcao: Record<AuditRow['acao'], string> = {
  insert: 'bg-success/10 text-success border-success/30',
  update: 'bg-warning/10 text-warning border-warning/30',
  delete: 'bg-destructive/10 text-destructive border-destructive/30',
};

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function AuditoriaTributariaTab() {
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState<string>('todas');
  const [filtroEntidade, setFiltroEntidade] = useState<string>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria-tributaria-recente'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_auditoria_tributaria_recente' as never)
        .select('*');
      if (error) throw error;
      return (data ?? []) as unknown as AuditRow[];
    },
    refetchInterval: 60_000,
  });

  const linhas = useMemo(() => {
    const all = data ?? [];
    const buscaLower = busca.trim().toLowerCase();
    return all.filter((r) => {
      if (filtroAcao !== 'todas' && r.acao !== filtroAcao) return false;
      if (filtroEntidade !== 'todas' && r.entidade_tipo !== filtroEntidade) return false;
      if (buscaLower) {
        const hay = `${r.user_nome ?? ''} ${r.user_email ?? ''} ${r.empresa_nome ?? ''} ${r.entidade_tipo}`.toLowerCase();
        if (!hay.includes(buscaLower)) return false;
      }
      return true;
    });
  }, [data, busca, filtroAcao, filtroEntidade]);

  const entidadesUnicas = useMemo(() => {
    return Array.from(new Set((data ?? []).map((r) => r.entidade_tipo))).sort();
  }, [data]);

  const exportarCSV = () => {
    if (linhas.length === 0) {
      toast.info('Nada para exportar com os filtros atuais.');
      return;
    }
    const header = ['Data', 'Usuário', 'Email', 'Empresa', 'Ação', 'Entidade', 'ID Registro'];
    const rows = linhas.map((r) => [
      new Date(r.criado_em).toLocaleString('pt-BR'),
      r.user_nome ?? '',
      r.user_email ?? '',
      r.empresa_nome ?? '',
      r.acao,
      r.entidade_tipo,
      r.entidade_id ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-tributaria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${linhas.length} registros exportados`);
  };

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Auditoria tributária
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, empresa ou entidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroAcao} onValueChange={setFiltroAcao}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as ações</SelectItem>
              <SelectItem value="insert">Criação</SelectItem>
              <SelectItem value="update">Edição</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as entidades</SelectItem>
              {entidadesUnicas.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Data</th>
                    <th className="text-left px-3 py-2 font-medium">Usuário</th>
                    <th className="text-left px-3 py-2 font-medium">Empresa</th>
                    <th className="text-left px-3 py-2 font-medium">Ação</th>
                    <th className="text-left px-3 py-2 font-medium">Entidade</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {new Date(r.criado_em).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.user_nome ?? 'Sistema'}</div>
                        <div className="text-xs text-muted-foreground">{r.user_email}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">{r.empresa_nome ?? '—'}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={corAcao[r.acao]}>
                          {r.acao}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">{r.entidade_tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Exibindo até 1.000 eventos mais recentes · atualiza a cada 60s
        </p>
      </CardContent>
    </Card>
  );
}
