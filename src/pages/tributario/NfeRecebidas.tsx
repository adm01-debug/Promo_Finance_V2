import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, FileText, Link2, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  getNfeXmlSignedUrl,
  useNfeRecebidas,
  type ManifestacaoStatus,
  type NfeFiltros,
} from '@/hooks/useNfeRecebidas';

const STATUS_LABELS: Record<ManifestacaoStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  ciencia: { label: 'Ciência', variant: 'secondary' },
  confirmada: { label: 'Confirmada', variant: 'default' },
  desconhecida: { label: 'Desconhecida', variant: 'secondary' },
  nao_realizada: { label: 'Não realizada', variant: 'destructive' },
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function NfeRecebidasPage() {
  const [filtros, setFiltros] = useState<NfeFiltros>({ status: 'todos', vinculadaContaPagar: 'todos' });
  const { data = [], isLoading, refetch, isFetching } = useNfeRecebidas(filtros);

  const totals = useMemo(() => {
    const total = data.reduce((acc, n) => acc + Number(n.valor_total ?? 0), 0);
    const pendentes = data.filter((n) => n.manifestacao_status === 'pendente').length;
    const semVinculo = data.filter((n) => !n.conta_pagar_id).length;
    return { total, pendentes, semVinculo, count: data.length };
  }, [data]);

  async function downloadXml(id: string, xmlPath: string | null) {
    if (!xmlPath) {
      toast.error('XML ainda não disponível');
      return;
    }
    const url = await getNfeXmlSignedUrl(xmlPath);
    if (!url) {
      toast.error('Falha ao gerar link do XML');
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  return (
    <>
      <Helmet>
        <title>NF-e Recebidas | Tributário</title>
        <meta
          name="description"
          content="NF-e emitidas contra seus CNPJs, sincronizadas via SEFAZ Nacional (NFeDistribuicaoDFe)."
        />
      </Helmet>

      <div className="container mx-auto space-y-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">NF-e Recebidas</h1>
            <p className="text-sm text-muted-foreground">
              Notas fiscais emitidas contra os CNPJs monitorados, obtidas do SEFAZ Nacional.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard label="NF-e no período" value={String(totals.count)} icon={<FileText className="h-4 w-4" />} />
          <KpiCard label="Valor total" value={currency.format(totals.total)} />
          <KpiCard label="Pendentes de manifestação" value={String(totals.pendentes)} tone="warning" />
          <KpiCard label="Sem vínculo financeiro" value={String(totals.semVinculo)} tone="muted" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por CNPJ ou razão do emitente"
                value={filtros.emitente ?? ''}
                onChange={(e) => setFiltros((f) => ({ ...f, emitente: e.target.value }))}
              />
            </div>
            <Select
              value={filtros.status ?? 'todos'}
              onValueChange={(v) => setFiltros((f) => ({ ...f, status: v as NfeFiltros['status'] }))}
            >
              <SelectTrigger><SelectValue placeholder="Status manifestação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="ciencia">Ciência</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="desconhecida">Desconhecida</SelectItem>
                <SelectItem value="nao_realizada">Não realizada</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filtros.vinculadaContaPagar ?? 'todos'}
              onValueChange={(v) => setFiltros((f) => ({ ...f, vinculadaContaPagar: v as NfeFiltros['vinculadaContaPagar'] }))}
            >
              <SelectTrigger><SelectValue placeholder="Vínculo financeiro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vínculos</SelectItem>
                <SelectItem value="sim">Já vinculada</SelectItem>
                <SelectItem value="nao">Sem vínculo</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filtros.dataInicio ?? ''}
                onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value || undefined }))}
              />
              <Input
                type="date"
                value={filtros.dataFim ?? ''}
                onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value || undefined }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emitente</TableHead>
                  <TableHead>NF-e</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Manifestação</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhuma NF-e recebida encontrada com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {data.map((n) => {
                  const st = STATUS_LABELS[n.manifestacao_status];
                  return (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="font-medium">{n.razao_emitente ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.cnpj_emitente} {n.uf_emitente ? `· ${n.uf_emitente}` : ''}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>{n.numero ?? '—'}/{n.serie ?? '—'}</div>
                        <div className="text-muted-foreground">{n.chave_acesso}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {n.data_emissao
                          ? formatDistanceToNow(new Date(n.data_emissao), { addSuffix: true, locale: ptBR })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {n.valor_total != null ? currency.format(Number(n.valor_total)) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {n.conta_pagar_id ? (
                          <Badge variant="secondary" className="gap-1">
                            <Link2 className="h-3 w-3" /> Vinculada
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadXml(n.id, n.xml_path)}
                          disabled={!n.xml_path}
                        >
                          <Download className="mr-1 h-4 w-4" /> XML
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: 'warning' | 'muted';
}) {
  const valueClass =
    tone === 'warning' ? 'text-warning' : tone === 'muted' ? 'text-muted-foreground' : 'text-foreground';
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</div>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardContent>
    </Card>
  );
}
