import { todayISOLocal } from '@/lib/formatters';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tag, Receipt, CreditCard } from 'lucide-react';
import {
  useBlingFinanceiro,
  useBlingFinanceiroMutations,
  useBlingFormasPagamento,
  useBlingContasContabeis,
  useBlingCategoriasFinanceiras,
  useBlingBorderos,
} from '@/hooks/useBling';
import { LoadingSkeleton } from './BlingShared';
import type {
  BlingFormaPagamento,
  BlingPortador,
  BlingCategoriaFinanceira,
  BlingBordero,
} from './BlingFinanceiroPanel.types';
import { BlingFinanceiroPanelFinanceiro } from './BlingFinanceiroPanelFinanceiro';
import { BlingFinanceiroPanelConteudo } from './BlingFinanceiroPanelConteudo';
import { BlingFinanceiroPanelConteudo2 } from './BlingFinanceiroPanelConteudo2';

export function BlingFinanceiroPanel() {
  const [tipo, setTipo] = useState<'receber' | 'pagar'>('receber');
  const [subTab, setSubTab] = useState<
    'contas' | 'formas' | 'portadores' | 'categorias' | 'borderos'
  >('contas');
  const [pagina, setPagina] = useState(1);
  const [showBaixa, setShowBaixa] = useState<{ id: string; tipo: 'receber' | 'pagar' } | null>(
    null
  );
  const { data, refetch, isFetching } = useBlingFinanceiro(tipo, { pagina });
  const {
    excluirContaReceber,
    excluirContaPagar,
    darBaixaReceber,
    darBaixaPagar,
    estornarBaixaReceber,
    estornarBaixaPagar,
  } = useBlingFinanceiroMutations();
  const {
    data: formasData,
    refetch: refetchFormas,
    isFetching: fetchingFormas,
  } = useBlingFormasPagamento();
  const {
    data: portadoresData,
    refetch: refetchPortadores,
    isFetching: fetchingPortadores,
  } = useBlingContasContabeis();
  const {
    data: categoriasData,
    refetch: refetchCategorias,
    isFetching: fetchingCategorias,
  } = useBlingCategoriasFinanceiras();
  const {
    data: borderosData,
    refetch: refetchBorderos,
    isFetching: fetchingBorderos,
  } = useBlingBorderos();
  const contas = data?.data || [];
  const formas = formasData?.data || [];
  const portadores = portadoresData?.data || [];
  const categorias = categoriasData?.data || [];
  const borderos = borderosData?.data || [];

  const [baixaForm, setBaixaForm] = useState({ valorRecebido: '', data: todayISOLocal() });
  const [confirmEstorno, setConfirmEstorno] = useState<{
    id: string;
    tipo: 'receber' | 'pagar';
  } | null>(null);
  const [confirmExclusao, setConfirmExclusao] = useState<{
    id: string;
    tipo: 'receber' | 'pagar';
  } | null>(null);

  return (
    <div className="space-y-4">
      <BlingFinanceiroPanelConteudo
        subTab={subTab}
        setSubTab={setSubTab}
        refetchFormas={refetchFormas}
        refetchPortadores={refetchPortadores}
        refetchCategorias={refetchCategorias}
        refetchBorderos={refetchBorderos}
      />

      {subTab === 'contas' && (
        <BlingFinanceiroPanelFinanceiro
          tipo={tipo}
          setTipo={setTipo}
          setPagina={setPagina}
          refetch={refetch}
          isFetching={isFetching}
          contas={contas}
          setBaixaForm={setBaixaForm}
          setShowBaixa={setShowBaixa}
          setConfirmEstorno={setConfirmEstorno}
          setConfirmExclusao={setConfirmExclusao}
          pagina={pagina}
        />
      )}

      {subTab === 'formas' && (
        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
            <CardDescription>Cadastros de formas de pagamento no Bling</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingFormas ? (
              <LoadingSkeleton />
            ) : formas.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="Nenhuma forma"
                description="Clique no botão acima para carregar"
              />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formas.map((f: BlingFormaPagamento) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs">{f.id}</TableCell>
                        <TableCell className="font-medium">{f.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.tipoPagamento || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              f.situacao === 'A' || f.situacao === 1 ? 'default' : 'secondary'
                            }
                          >
                            {f.situacao === 'A' || f.situacao === 1 ? 'Ativo' : 'Inativo'}
                          </Badge>
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

      {subTab === 'portadores' && (
        <Card>
          <CardHeader>
            <CardTitle>Portadores (Contas Contábeis)</CardTitle>
            <CardDescription>Bancos e portadores cadastrados no Bling</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingPortadores ? (
              <LoadingSkeleton />
            ) : portadores.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nenhum portador"
                description="Clique no botão acima para carregar"
              />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portadores.map((p: BlingPortador) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                        <TableCell className="font-medium">{p.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.tipo || '-'}</Badge>
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

      {subTab === 'categorias' && (
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Receitas e Despesas</CardTitle>
            <CardDescription>Plano de contas financeiro do Bling</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingCategorias ? (
              <LoadingSkeleton />
            ) : categorias.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="Nenhuma categoria"
                description="Clique no botão acima para carregar"
              />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.map((c: BlingCategoriaFinanceira) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell className="font-medium">{c.descricao}</TableCell>
                        <TableCell>
                          <Badge variant={c.tipo === 1 ? 'default' : 'destructive'}>
                            {c.tipo === 1 ? 'Receita' : 'Despesa'}
                          </Badge>
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

      {subTab === 'borderos' && (
        <Card>
          <CardHeader>
            <CardTitle>Borderôs</CardTitle>
            <CardDescription>Borderôs financeiros do Bling</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingBorderos ? (
              <LoadingSkeleton />
            ) : borderos.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Nenhum borderô"
                description="Clique no botão acima para carregar"
              />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Portador</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borderos.map((b: BlingBordero) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.id}</TableCell>
                        <TableCell>
                          {b.data ? new Date(b.data).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>{b.portador?.descricao || '-'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R${' '}
                          {Number(b.valorTotal || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{b.situacao || '-'}</Badge>
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

      <Dialog open={!!showBaixa} onOpenChange={() => setShowBaixa(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Dar Baixa — Conta a {showBaixa?.tipo === 'receber' ? 'Receber' : 'Pagar'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Valor {showBaixa?.tipo === 'receber' ? 'Recebido' : 'Pago'} (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={baixaForm.valorRecebido}
                onChange={(e) => setBaixaForm((p) => ({ ...p, valorRecebido: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={baixaForm.data}
                onChange={(e) => setBaixaForm((p) => ({ ...p, data: e.target.value }))}
              />
            </div>
          </div>
          <BlingFinanceiroPanelConteudo2
            setShowBaixa={setShowBaixa}
            showBaixa={showBaixa}
            baixaForm={baixaForm}
            darBaixaReceber={darBaixaReceber}
            darBaixaPagar={darBaixaPagar}
            refetch={refetch}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmEstorno}
        onOpenChange={(o) => !o && setConfirmEstorno(null)}
        title="Estornar baixa"
        description="Deseja estornar a última baixa desta conta?"
        confirmText="Estornar"
        variant="warning"
        onConfirm={() => {
          if (!confirmEstorno) return;
          const mut = confirmEstorno.tipo === 'receber' ? estornarBaixaReceber : estornarBaixaPagar;
          mut.mutate({ id: confirmEstorno.id, baixaId: 'last' });
          setConfirmEstorno(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmExclusao}
        onOpenChange={(o) => !o && setConfirmExclusao(null)}
        title="Excluir conta"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        onConfirm={() => {
          if (!confirmExclusao) return;
          const mut = confirmExclusao.tipo === 'receber' ? excluirContaReceber : excluirContaPagar;
          mut.mutate(confirmExclusao.id);
          setConfirmExclusao(null);
        }}
      />
    </div>
  );
}
