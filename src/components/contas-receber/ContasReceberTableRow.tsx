import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ClienteCell } from './row/ClienteCell';
import { DescricaoCell } from './row/DescricaoCell';
import { ValorCell } from './row/ValorCell';
import { VencimentoCell, DiasAtrasoCell } from './row/VencimentoCell';
import { StatusCell, ScoreCell } from './row/StatusCell';
import { AcoesCell } from './row/AcoesCell';
import type { ContaReceberWithRelations } from './row/rowConfig';

export type { ContaReceberWithRelations } from './row/rowConfig';

interface ContasReceberTableRowProps {
  conta: ContaReceberWithRelations;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (conta: ContaReceberWithRelations) => void;
  onDelete: (conta: ContaReceberWithRelations) => void;
  onRegistrarRecebimento: (conta: ContaReceberWithRelations) => void;
  onView?: (conta: ContaReceberWithRelations) => void;
  onEnviarCobranca?: (conta: ContaReceberWithRelations) => void;
  onAplicarDesconto?: (conta: ContaReceberWithRelations) => void;
  showEmpresa?: boolean;
  showDiasAtraso?: boolean;
  animate?: boolean;
}

export function ContasReceberTableRow({
  conta,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onRegistrarRecebimento,
  onView,
  onEnviarCobranca,
  onAplicarDesconto,
  showEmpresa = false,
  showDiasAtraso = true,
  animate = false,
}: ContasReceberTableRowProps) {
  const RowComponent = animate ? motion.tr : 'tr';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: index * 0.02 },
      }
    : {};

  return (
    <RowComponent
      data-highlight-id={conta.id}
      {...animationProps}
      className={cn(
        'group transition-all duration-500 border-white/5 relative overflow-hidden',
        isSelected ? 'bg-primary/10 shadow-inner' : 'hover:bg-card/[0.04]',
      )}
    >
      <TableCell className="p-6 text-center">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect(conta.id)}
          aria-label={`Selecionar ${conta.descricao}`}
        />
      </TableCell>
      <ClienteCell conta={conta} />
      <DescricaoCell conta={conta} />
      <ValorCell conta={conta} />
      <VencimentoCell conta={conta} />
      {showDiasAtraso && <DiasAtrasoCell conta={conta} />}
      <StatusCell conta={conta} />
      <TableCell className="p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-tight">
          {conta.contas_bancarias?.banco || '-'}
        </p>
      </TableCell>
      {showEmpresa && (
        <TableCell className="p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-tight">
            {conta.empresas?.nome_fantasia || conta.empresas?.razao_social || 'GLOBAL'}
          </p>
        </TableCell>
      )}
      <ScoreCell conta={conta} />
      <AcoesCell
        conta={conta}
        onEdit={onEdit}
        onDelete={onDelete}
        onRegistrarRecebimento={onRegistrarRecebimento}
        onView={onView}
        onEnviarCobranca={onEnviarCobranca}
        onAplicarDesconto={onAplicarDesconto}
      />
    </RowComponent>
  );
}
