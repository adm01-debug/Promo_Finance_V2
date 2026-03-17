import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Edit2,
  Trash2,
  RotateCcw,
  Plus,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { CentroCusto } from '@/hooks/useCentrosCusto';

interface TreeNode extends CentroCusto {
  children: TreeNode[];
  level: number;
}

interface CentroCustoTreeProps {
  centros: CentroCusto[];
  onEdit: (centro: CentroCusto) => void;
  onDelete: (centro: CentroCusto) => void;
  onReactivate: (centro: CentroCusto) => void;
  onAddChild: (parentId: string) => void;
  onHistory?: (centro: CentroCusto) => void;
}

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

function buildTree(centros: CentroCusto[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  centros.forEach((c) => {
    map.set(c.id, { ...c, children: [], level: 0 });
  });

  // Build tree
  centros.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      const parent = map.get(c.parent_id)!;
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by codigo
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo));
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

// Calculate aggregated budget for parent nodes
function calculateAggregatedBudget(node: TreeNode): { previsto: number; realizado: number } {
  let previsto = node.orcamento_previsto;
  let realizado = node.orcamento_realizado;

  node.children.forEach((child) => {
    const childBudget = calculateAggregatedBudget(child);
    previsto += childBudget.previsto;
    realizado += childBudget.realizado;
  });

  return { previsto, realizado };
}

interface TreeNodeItemProps {
  node: TreeNode;
  colorIndex: number;
  onEdit: (centro: CentroCusto) => void;
  onDelete: (centro: CentroCusto) => void;
  onReactivate: (centro: CentroCusto) => void;
  onAddChild: (parentId: string) => void;
  onHistory?: (centro: CentroCusto) => void;
  defaultExpanded?: boolean;
}

function TreeNodeItem({
  node,
  colorIndex,
  onEdit,
  onDelete,
  onReactivate,
  onAddChild,
  onHistory,
  defaultExpanded = true,
}: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;

  const aggregated = useMemo(() => calculateAggregatedBudget(node), [node]);
  const percentual = aggregated.previsto > 0 ? (aggregated.realizado / aggregated.previsto) * 100 : 0;
  const isOver = aggregated.realizado > aggregated.previsto;
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'group flex items-center gap-2 py-2 px-3 rounded-lg transition-colors hover:bg-muted/50',
          !node.ativo && 'opacity-60'
        )}
        style={{ marginLeft: node.level * 24 }}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded transition-colors hover:bg-muted',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Folder icon */}
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            <span className="font-bold text-xs">{node.codigo.slice(0, 2)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{node.nome}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {node.codigo}
            </Badge>
            {node.responsavel && (
              <Badge variant="secondary" className="text-xs shrink-0">
                👤 {node.responsavel}
              </Badge>
            )}
            {!node.ativo && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Inativo
              </Badge>
            )}
            {hasChildren && (
              <Badge variant="outline" className="text-xs shrink-0 bg-muted/50">
                {node.children.length} sub{node.children.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          {node.descricao && (
            <p className="text-xs text-muted-foreground truncate">{node.descricao}</p>
          )}
        </div>

        {/* Budget info */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="text-right min-w-[100px]">
            <p className="text-xs text-muted-foreground">Orçado</p>
            <p className="text-sm font-medium">{formatCurrency(aggregated.previsto)}</p>
          </div>
          <div className="text-right min-w-[100px]">
            <p className="text-xs text-muted-foreground">Realizado</p>
            <p className={cn('text-sm font-medium', isOver ? 'text-destructive' : 'text-success')}>
              {formatCurrency(aggregated.realizado)}
            </p>
          </div>
          <div className="w-24">
            <Progress
              value={percentual > 100 ? 100 : percentual}
              className={cn('h-2', isOver && '[&>div]:bg-destructive')}
            />
            <p className="text-xs text-muted-foreground text-center mt-1">
              {percentual.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(node.id)}
            title="Adicionar sub-centro"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          {onHistory && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onHistory(node)}
              title="Histórico"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(node)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          {node.ativo ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(node)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-success hover:text-success"
              onClick={() => onReactivate(node)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child, idx) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                colorIndex={colorIndex + idx + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onReactivate={onReactivate}
                onAddChild={onAddChild}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CentroCustoTree({
  centros,
  onEdit,
  onDelete,
  onReactivate,
  onAddChild,
}: CentroCustoTreeProps) {
  const tree = useMemo(() => buildTree(centros), [centros]);

  if (tree.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum centro de custo encontrado
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2">
      {tree.map((node, idx) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          colorIndex={idx}
          onEdit={onEdit}
          onDelete={onDelete}
          onReactivate={onReactivate}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}
