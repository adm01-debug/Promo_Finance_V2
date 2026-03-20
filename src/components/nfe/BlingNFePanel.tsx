import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, Search, FileText, Send, Loader2, Package, 
  DollarSign, Ban, Calendar, ExternalLink, CheckCircle2,
  Clock, XCircle, AlertCircle, Download, FileCode, Mail,
  Heart, Edit
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useBlingNFe, BlingNFe } from '@/hooks/useBlingNFe';
import { toast } from 'sonner';

/** Gap #1: Correct Bling API v3 situation codes */
const situacaoConfig: Record<number, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  1: { label: 'Em Digitação', color: 'bg-muted text-muted-foreground border-muted', icon: Edit },
  2: { label: 'Validando', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  3: { label: 'Aguardando', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  4: { label: 'Validada', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
  5: { label: 'Processando', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  6: { label: 'Autorizada', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  7: { label: 'Cancelada', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  8: { label: 'Rejeitada', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
  9: { label: 'Denegada', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
  10: { label: 'Inutilizada', color: 'bg-muted text-muted-foreground border-muted', icon: Ban },
};

const defaultSituacao = { label: 'Desconhecida', color: 'bg-muted text-muted-foreground', icon: Clock };

export function BlingNFePanel() {
  const { notas, loading, syncing, listarNFe, enviarSefaz, cancelarNFe, lancarEstoque, lancarContas, healthCheck } = useBlingNFe();
  const [search, setSearch] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [blingHealthy, setBlingHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    listarNFe();
    // Gap #12: Health check on mount
    healthCheck().then(r => setBlingHealthy(r.ok));
  }, [listarNFe, healthCheck]);

  /** Gap #8: Server-side filtering via API params */
  const handleBuscar = () => {
    const filtros: Record<string, unknown> = {};
    if (filtroSituacao !== 'todos') filtros.situacao = Number(filtroSituacao);
    if (filtroTipo !== 'todos') filtros.tipo = Number(filtroTipo);
    if (dataInicial) filtros.dataEmissaoInicial = dataInicial;
    if (dataFinal) filtros.dataEmissaoFinal = dataFinal;
    listarNFe(filtros as any);
  };

  const filtered = notas.filter(n => {
    if (!search) return true;
    const s = search.toLowerCase();
    return n.numero.includes(s) || 
      n.contato?.nome?.toLowerCase().includes(s) ||
      (n.chaveAcesso || '').includes(s);
  });

  const totalAutorizado = notas.filter(n => n.situacao === 6).reduce((s, n) => s + n.valorTotal, 0);
  const totalPendente = notas.filter(n => [1, 4].includes(n.situacao)).reduce((s, n) => s + n.valorTotal, 0);

  /** Gap #10: email toggle */
  const handleEnviarSefaz = async (nota: BlingNFe) => {
    try {
      await enviarSefaz(nota.id, enviarEmail);
      await listarNFe();
    } catch { /* handled in hook */ }
  };

  const handleCancelar = async (nota: BlingNFe) => {
    try {
      await cancelarNFe([nota.id]);
      await listarNFe();
    } catch { /* handled in hook */ }
  };

  /** Gap #9: Download XML/DANFE */
  const handleDownload = (url: string | undefined, label: string) => {
    if (!url) {
      toast.error(`Link ${label} não disponível para esta nota.`);
      return;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Notas Bling</p>
                <p className="text-xl font-bold">{notas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Autorizadas</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totalAutorizado)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(totalPendente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Heart className={`h-4 w-4 ${blingHealthy === true ? 'text-success' : blingHealthy === false ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground">
                {blingHealthy === true ? 'Bling conectado' : blingHealthy === false ? 'Bling offline' : 'Verificando...'}
              </span>
            </div>
            <Button 
              onClick={handleBuscar} 
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
              size="sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sincronizar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gap #8: Full API Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente ou chave..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Situações</SelectItem>
                  <SelectItem value="1">Em Digitação</SelectItem>
                  <SelectItem value="4">Validada</SelectItem>
                  <SelectItem value="6">Autorizada</SelectItem>
                  <SelectItem value="7">Cancelada</SelectItem>
                  <SelectItem value="8">Rejeitada</SelectItem>
                  <SelectItem value="9">Denegada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="0">Entrada</SelectItem>
                  <SelectItem value="1">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Data Final</Label>
                <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
              </div>
              {/* Gap #10: Email toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch id="enviar-email" checked={enviarEmail} onCheckedChange={setEnviarEmail} />
                <Label htmlFor="enviar-email" className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Enviar email
                </Label>
              </div>
              <Button onClick={handleBuscar} disabled={loading} className="gap-2 shrink-0">
                <Search className="h-4 w-4" /> Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            NF-e no Bling ERP
          </CardTitle>
          <CardDescription>{filtered.length} nota(s) sincronizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando do Bling...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma NF-e encontrada no Bling</p>
              <p className="text-sm">Verifique a conexão OAuth ou ajuste os filtros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((nota, idx) => {
                const config = situacaoConfig[nota.situacao] || defaultSituacao;
                const StatusIcon = config.icon;
                return (
                  <motion.div
                    key={nota.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2.5 rounded-full bg-primary/10 shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">NF-e #{nota.numero}</span>
                            <span className="text-sm text-muted-foreground">Série {nota.serie}</span>
                            <Badge variant="outline" className={config.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {nota.contato?.nome || 'Consumidor Final'}
                          </p>
                          {nota.chaveAcesso && (
                            <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{nota.chaveAcesso}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg">{formatCurrency(nota.valorTotal)}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {nota.dataEmissao ? formatDate(nota.dataEmissao) : '-'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 flex-wrap">
                        {/* Gap #9: XML Download */}
                        {nota.xml && (
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(nota.xml, 'XML')} title="Download XML">
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        {/* Gap #9 & #17: DANFE/PDF Download */}
                        {(nota.linkDanfe || nota.linkPDF) && (
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(nota.linkDanfe || nota.linkPDF, 'DANFE')} title="Download DANFE/PDF">
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        {/* Send to SEFAZ: only for digitação(1) or validada(4) */}
                        {[1, 4].includes(nota.situacao) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEnviarSefaz(nota)}
                            disabled={syncing}
                            title={`Enviar para SEFAZ${enviarEmail ? ' + Email' : ''}`}
                          >
                            <Send className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => lancarEstoque(nota.id)} title="Lançar Estoque">
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => lancarContas(nota.id)} title="Lançar Contas">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        {/* Cancel: only for autorizada(6) */}
                        {nota.situacao === 6 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelar(nota)}
                            disabled={syncing}
                            className="text-destructive hover:text-destructive"
                            title="Cancelar NF-e"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
