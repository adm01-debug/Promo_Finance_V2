import { useState, useMemo, useEffect } from 'react';
import { Loader2, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useAllCentrosCusto,
  useExcluirCentroCusto,
  useReativarCentroCusto,
} from '@/hooks/useCentrosCusto';
import type { CentroCusto } from '@/hooks/useCentrosCusto';
import { CentroCustoForm } from '@/components/centros-custo/CentroCustoForm';
import { CentroCustoHistorico } from '@/components/centros-custo/CentroCustoHistorico';
import { toastWithUndo } from '@/lib/toast-with-undo';
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { CentroCustosArvore } from './CentroCustosArvore';

export default function CentroCustos() {
  const { data: centros = [], isLoading } = useAllCentrosCusto();
  const excluirCentroCusto = useExcluirCentroCusto();
  const reativarCentroCusto = useReativarCentroCusto();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('tree');
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [historyCentro, setHistoryCentro] = useState<CentroCusto | null>(null);

  // codigo/orcamento_* são NOT NULL na base mas nullable no tipo gerado;
  // normalizamos uma vez para o consumo do painel inteiro.
  const centrosNormalizados = useMemo(
    () =>
      centros.map((c) => ({
        ...c,
        codigo: c.codigo ?? '',
        orcamento_previsto: c.orcamento_previsto ?? 0,
        orcamento_realizado: c.orcamento_realizado ?? 0,
      })),
    [centros]
  );

  const filteredCentros = useMemo(
    () =>
      centrosNormalizados.filter((c) => {
        const matchesSearch =
          c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
        return (showInactive || c.ativo) && matchesSearch;
      }),
    [centrosNormalizados, searchTerm, showInactive]
  );

  const activeCentros = centrosNormalizados.filter((c) => c.ativo);
  const totalOrcado = activeCentros.reduce((sum, c) => sum + c.orcamento_previsto, 0);
  const totalRealizado = activeCentros.reduce((sum, c) => sum + c.orcamento_realizado, 0);
  const percentualGasto = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : 0;
  const saldoDisponivel = totalOrcado - totalRealizado;

  const barData = activeCentros.slice(0, 8).map((c) => ({
    nome: c.codigo,
    Orçado: c.orcamento_previsto,
    Realizado: c.orcamento_realizado,
  }));
  const distribuicao = activeCentros.map((c) => ({
    nome: c.nome,
    valor: c.orcamento_realizado,
    percentual: totalRealizado > 0 ? (c.orcamento_realizado / totalRealizado) * 100 : 0,
  }));

  useEffect(() => {
    if (activeCentros.length === 0) return;
    const alertsShown = sessionStorage.getItem('cc_alerts_shown');
    if (alertsShown) return;
    const overBudget = activeCentros.filter(
      (c) => c.orcamento_previsto > 0 && c.orcamento_realizado > c.orcamento_previsto
    );
    const near100 = activeCentros.filter((c) => {
      const pct =
        c.orcamento_previsto > 0 ? (c.orcamento_realizado / c.orcamento_previsto) * 100 : 0;
      return pct >= 90 && pct <= 100;
    });
    const near80 = activeCentros.filter((c) => {
      const pct =
        c.orcamento_previsto > 0 ? (c.orcamento_realizado / c.orcamento_previsto) * 100 : 0;
      return pct >= 80 && pct < 90;
    });
    if (overBudget.length > 0)
      toast.error(`🚨 ${overBudget.length} centro(s) estouraram o orçamento!`, {
        description: overBudget.map((c) => c.nome).join(', '),
        duration: 8000,
      });
    if (near100.length > 0)
      toast.warning(`⚠️ ${near100.length} centro(s) acima de 90% do orçamento`, {
        description: near100.map((c) => c.nome).join(', '),
        duration: 6000,
      });
    if (near80.length > 0)
      toast.info(`📊 ${near80.length} centro(s) acima de 80% do orçamento`, {
        description: near80.map((c) => c.nome).join(', '),
        duration: 5000,
      });
    if (overBudget.length > 0 || near100.length > 0 || near80.length > 0)
      sessionStorage.setItem('cc_alerts_shown', 'true');
  }, [activeCentros]);

  const handleOpenCreate = (parentId?: string) => {
    setEditingCentro(null);
    setParentIdForNew(parentId || null);
    setIsFormOpen(true);
  };
  const handleOpenEdit = (centro: CentroCusto) => {
    setEditingCentro(centro);
    setParentIdForNew(null);
    setIsFormOpen(true);
  };
  const handleDelete = async (centro: CentroCusto) => {
    await excluirCentroCusto.mutateAsync(centro.id);
    toastWithUndo({
      title: `"${centro.nome}" desativado`,
      description: 'O centro de custo foi desativado.',
      onUndo: async () => {
        await reativarCentroCusto.mutateAsync(centro.id);
      },
    });
  };
  const handleReactivate = async (centro: CentroCusto) => {
    await reativarCentroCusto.mutateAsync(centro.id);
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCentro(null);
    setParentIdForNew(null);
  };

  if (isLoading)
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <CentroCustosArvore
        viewMode={viewMode}
        setViewMode={setViewMode}
        centros={centros}
        setShowInactive={setShowInactive}
        showInactive={showInactive}
        handleOpenCreate={handleOpenCreate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        totalOrcado={totalOrcado}
        totalRealizado={totalRealizado}
        percentualGasto={percentualGasto}
        saldoDisponivel={saldoDisponivel}
        activeCentros={activeCentros}
        barData={barData}
        distribuicao={distribuicao}
        filteredCentros={filteredCentros}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        handleReactivate={handleReactivate}
        setHistoryCentro={setHistoryCentro}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingCentro ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
            </DialogTitle>
          </DialogHeader>
          <CentroCustoForm
            centroCusto={editingCentro}
            centrosCusto={centros}
            defaultParentId={parentIdForNew}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={!!historyCentro} onOpenChange={(open) => !open && setHistoryCentro(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico - {historyCentro?.nome}
            </DialogTitle>
          </DialogHeader>
          {historyCentro && (
            <CentroCustoHistorico centroId={historyCentro.id} centroNome={historyCentro.nome} />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
