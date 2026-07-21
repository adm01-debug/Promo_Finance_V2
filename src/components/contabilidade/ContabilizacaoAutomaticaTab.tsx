import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  Play,
  Plus,
  Zap,
} from 'lucide-react';
import { LogsTable } from './contabilizacao-automatica/LogsTable';
import { RegraFormDialog } from './contabilizacao-automatica/RegraFormDialog';
import { RegrasTable } from './contabilizacao-automatica/RegrasTable';
import { SimulacaoDialog } from './contabilizacao-automatica/SimulacaoDialog';
import { StatsCards } from './contabilizacao-automatica/StatsCards';
import { useContabilizacaoMutations } from './contabilizacao-automatica/useContabilizacaoMutations';
import { useContabilizacaoQueries } from './contabilizacao-automatica/useContabilizacaoQueries';

/**
 * Aba "Contabilização Automática": regras que transformam eventos financeiros
 * em lançamentos contábeis por partidas dobradas. O componente atua como
 * orquestrador fino — toda a lógica está nos hooks e sub-componentes em
 * `./contabilizacao-automatica/`.
 */
export function ContabilizacaoAutomaticaTab({ empresaId }: { empresaId: string }) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openNew, setOpenNew] = useState(false);
  const [openSim, setOpenSim] = useState(false);

  const { regrasQuery, contasQuery, categoriasQuery, logsQuery } =
    useContabilizacaoQueries(empresaId);
  const mutations = useContabilizacaoMutations(empresaId);

  if (!empresaId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Selecione uma empresa</AlertTitle>
        <AlertDescription>
          Escolha uma empresa no topo para configurar a contabilização automática.
        </AlertDescription>
      </Alert>
    );
  }

  const regras = [...(regrasQuery.data ?? [])].sort((a, b) =>
    sortOrder === 'asc' ? a.prioridade - b.prioridade : b.prioridade - a.prioridade,
  );
  const contas = contasQuery.data ?? [];
  const categorias = categoriasQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <StatsCards logs={logs} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Regras de Contabilização Automática
            </CardTitle>
            <CardDescription>
              Cada evento financeiro dispara uma regra que gera lançamento em
              partidas dobradas.
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpAZ className="h-4 w-4" />
              )}
              Prioridade
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setOpenSim(true)}
            >
              <Play className="h-4 w-4" />
              Simular dry-run
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4" />
              Nova regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RegrasTable
            regras={regras}
            contas={contas}
            categorias={categorias}
            loading={regrasQuery.isLoading}
            sortOrder={sortOrder}
            onToggleAtivo={(id, ativo) => mutations.toggleAtivo.mutate({ id, ativo })}
            onUpdate={(regra) => mutations.updateRegra.mutate(regra)}
            onDuplicate={(regra) => mutations.duplicateRegra.mutate(regra)}
            onDelete={(id) => mutations.deleteRegra.mutate(id)}
            isUpdating={mutations.updateRegra.isPending}
            isDuplicating={mutations.duplicateRegra.isPending}
          />
        </CardContent>
      </Card>

      <LogsTable logs={logs} loading={logsQuery.isLoading} />

      <SimulacaoDialog
        open={openSim}
        onOpenChange={setOpenSim}
        contas={contas}
        categorias={categorias}
        mutation={mutations.dryRunSimulation}
      />

      <RegraFormDialog
        open={openNew}
        onOpenChange={setOpenNew}
        contas={contas}
        categorias={categorias}
        onSubmit={(form) =>
          mutations.createRegra.mutate(form, {
            onSuccess: () => setOpenNew(false),
          })
        }
        isSubmitting={mutations.createRegra.isPending}
      />
    </motion.div>
  );
}
