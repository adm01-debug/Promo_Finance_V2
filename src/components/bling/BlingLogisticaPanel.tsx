import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Truck, Package, MapPin, Box, Search, Loader2, Printer, MoreHorizontal } from 'lucide-react';
import { useBlingLogisticas, useBlingRemessas, useBlingObjetos, useBlingLogisticaMutations, useBlingServicosLogistica } from '@/hooks/useBling';
import { LoadingSkeleton } from './BlingShared';

export function BlingLogisticaPanel() {
  const [subTab, setSubTab] = useState<'integracoes' | 'remessas' | 'objetos' | 'servicos'>('integracoes');
  const { data: logisticasData, refetch: refetchLogisticas, isFetching: fetchingLogisticas } = useBlingLogisticas();
  const { data: remessasData, refetch: refetchRemessas, isFetching: fetchingRemessas } = useBlingRemessas();
  const { data: objetosData, refetch: refetchObjetos, isFetching: fetchingObjetos } = useBlingObjetos();
  const { data: servicosData, refetch: refetchServicos, isFetching: fetchingServicos } = useBlingServicosLogistica();
  const { gerarEtiqueta, rastrearObjeto } = useBlingLogisticaMutations();
  const logisticas = logisticasData?.data || [];
  const remessas = remessasData?.data || [];
  const objetos = objetosData?.data || [];
  const servicos = servicosData?.data || [];

  const [rastreioCode, setRastreioCode] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant={subTab === 'integracoes' ? 'default' : 'outline'} onClick={() => { setSubTab('integracoes'); refetchLogisticas(); }} size="sm">
          <Truck className="h-4 w-4 mr-1" /> Integrações
        </Button>
        <Button variant={subTab === 'servicos' ? 'default' : 'outline'} onClick={() => { setSubTab('servicos'); refetchServicos(); }} size="sm">
          <Box className="h-4 w-4 mr-1" /> Serviços
        </Button>
        <Button variant={subTab === 'remessas' ? 'default' : 'outline'} onClick={() => { setSubTab('remessas'); refetchRemessas(); }} size="sm">
          <Package className="h-4 w-4 mr-1" /> Remessas
        </Button>
        <Button variant={subTab === 'objetos' ? 'default' : 'outline'} onClick={() => { setSubTab('objetos'); refetchObjetos(); }} size="sm">
          <MapPin className="h-4 w-4 mr-1" /> Objetos/Rastreamento
        </Button>
      </div>

      {subTab === 'integracoes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Integrações Logísticas</CardTitle>
            <CardDescription>Transportadoras configuradas no Bling</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingLogisticas ? <LoadingSkeleton /> : logisticas.length === 0 ? (
              <EmptyState icon={Truck} title="Nenhuma integração" description="Clique para carregar as integrações logísticas" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Transportadora</TableHead><TableHead>Situação</TableHead><TableHead>Serviços</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {logisticas.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">{l.id}</TableCell>
                        <TableCell className="font-medium">{l.descricao || l.nome || '-'}</TableCell>
                        <TableCell><Badge variant={l.situacao === 'H' ? 'default' : 'secondary'}>{l.situacao === 'H' ? 'Habilitada' : 'Desabilitada'}</Badge></TableCell>
                        <TableCell>{l.servicos?.length || 0} serviço(s)</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'servicos' && (
        <Card>
          <CardHeader><CardTitle>Serviços Logísticos</CardTitle><CardDescription>Serviços disponíveis nas integrações</CardDescription></CardHeader>
          <CardContent>
            {fetchingServicos ? <LoadingSkeleton /> : servicos.length === 0 ? (
              <EmptyState icon={Box} title="Nenhum serviço" description="Clique no botão acima para carregar" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nome</TableHead><TableHead>Transportadora</TableHead><TableHead>Tipo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {servicos.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="font-medium">{s.nome || s.descricao || '-'}</TableCell>
                        <TableCell>{s.transportadora || s.logistica?.descricao || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{s.tipo || '-'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'remessas' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Remessas de Envio</CardTitle>
            <CardDescription>Remessas criadas para envio via transportadoras</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingRemessas ? <LoadingSkeleton /> : remessas.length === 0 ? (
              <EmptyState icon={Package} title="Nenhuma remessa" description="Clique para carregar as remessas" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Transportadora</TableHead><TableHead>Status</TableHead><TableHead>Rastreio</TableHead><TableHead className="w-10">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {remessas.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell>{r.dataCriacao ? new Date(r.dataCriacao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell>{r.logistica?.descricao || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{r.situacao || '-'}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{r.codigoRastreamento || '-'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => gerarEtiqueta.mutate({ remessa: { id: r.id } })}>
                                <Printer className="h-4 w-4 mr-2" /> Gerar Etiqueta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'objetos' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Objetos / Volumes</CardTitle>
            <CardDescription>Objetos e volumes enviados — rastreamento em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Código de rastreio..." value={rastreioCode} onChange={e => setRastreioCode(e.target.value)} className="max-w-sm" />
              <Button onClick={() => { if (rastreioCode) rastrearObjeto.mutate(rastreioCode); }} disabled={!rastreioCode || rastrearObjeto.isPending} variant="outline" className="gap-1.5">
                {rastrearObjeto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Rastrear
              </Button>
            </div>
            {fetchingObjetos ? <LoadingSkeleton /> : objetos.length === 0 ? (
              <EmptyState icon={MapPin} title="Nenhum objeto" description="Clique para carregar os objetos de envio" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Remessa</TableHead><TableHead>Status</TableHead><TableHead>Última Atualização</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {objetos.map((o: any) => (
                      <TableRow key={o.id || o.codigo}>
                        <TableCell className="font-mono">{o.codigo || o.id}</TableCell>
                        <TableCell>{o.remessa?.id || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{o.situacao || o.status || '-'}</Badge></TableCell>
                        <TableCell>{o.ultimaAtualizacao ? new Date(o.ultimaAtualizacao).toLocaleString('pt-BR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
