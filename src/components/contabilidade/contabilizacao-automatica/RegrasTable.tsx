import { useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Copy,
  Edit2,
  History as HistoryIcon,
  RefreshCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Categoria, PlanoConta, Regra, TipoEvento } from './types';
import { EVENTOS } from './types';

export interface RegrasTableProps {
  regras: Regra[];
  contas: PlanoConta[];
  categorias: Categoria[];
  loading: boolean;
  sortOrder: 'asc' | 'desc';
  onToggleAtivo: (id: string, ativo: boolean) => void;
  onUpdate: (regra: Regra) => void;
  onDuplicate: (regra: Regra) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDuplicating: boolean;
}

export function RegrasTable({
  regras,
  contas,
  categorias,
  loading,
  sortOrder,
  onToggleAtivo,
  onUpdate,
  onDuplicate,
  onDelete,
  isUpdating,
  isDuplicating,
}: RegrasTableProps) {
  const [editingRegra, setEditingRegra] = useState<Regra | null>(null);
  const [originalRegra, setOriginalRegra] = useState<Regra | null>(null);
  const [confirmDeleteRegraId, setConfirmDeleteRegraId] = useState<string | null>(
    null,
  );

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (regras.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Nenhuma regra cadastrada ainda. Crie a primeira para iniciar a
        contabilização automática.
      </div>
    );
  }

  const handleUpdate = (regra: Regra) => {
    onUpdate(regra);
    setEditingRegra(null);
    setOriginalRegra(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>D / C</TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                Prio
                {sortOrder === 'asc' ? (
                  <ArrowDownAZ className="h-3 w-3" />
                ) : (
                  <ArrowUpAZ className="h-3 w-3" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-center">Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regras.map((r) => {
            const dCta = contas.find((c) => c.id === r.conta_debito_id);
            const cCta = contas.find((c) => c.id === r.conta_credito_id);
            const isEditing = editingRegra?.id === r.id;

            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {isEditing && editingRegra ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingRegra.nome}
                        onChange={(e) =>
                          setEditingRegra({ ...editingRegra, nome: e.target.value })
                        }
                        className="h-8"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        title="Restaurar nome"
                        onClick={() =>
                          setEditingRegra({
                            ...editingRegra,
                            nome: originalRegra?.nome || '',
                          })
                        }
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    r.nome
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && editingRegra ? (
                    <Select
                      value={editingRegra.tipo_evento}
                      onValueChange={(v) =>
                        setEditingRegra({
                          ...editingRegra,
                          tipo_evento: v as TipoEvento,
                        })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENTOS.map((e) => (
                          <SelectItem key={e.value} value={e.value}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">{r.tipo_evento}</Badge>
                      {r.categoria_id && (
                        <Badge variant="secondary" className="text-[9px] h-4">
                          {categorias.find((c) => c.id === r.categoria_id)?.nome ||
                            'Cat. externa'}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {isEditing && editingRegra ? (
                    <div className="flex flex-col gap-1 relative group">
                      <Select
                        value={editingRegra.conta_debito_id}
                        onValueChange={(v) =>
                          setEditingRegra({ ...editingRegra, conta_debito_id: v })
                        }
                      >
                        <SelectTrigger className="h-7 text-[10px] flex-1">
                          <SelectValue placeholder="Débito" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {contas.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="text-xs"
                            >
                              {c.codigo} - {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={editingRegra.conta_credito_id}
                        onValueChange={(v) =>
                          setEditingRegra({ ...editingRegra, conta_credito_id: v })
                        }
                      >
                        <SelectTrigger className="h-7 text-[10px] flex-1">
                          <SelectValue placeholder="Crédito" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {contas.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="text-xs"
                            >
                              {c.codigo} - {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Restaurar contas"
                        onClick={() =>
                          setEditingRegra({
                            ...editingRegra,
                            conta_debito_id: originalRegra?.conta_debito_id || '',
                            conta_credito_id: originalRegra?.conta_credito_id || '',
                          })
                        }
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      D {dCta?.codigo ?? '?'} / C {cCta?.codigo ?? '?'}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing && editingRegra ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Input
                        type="number"
                        value={editingRegra.prioridade}
                        onChange={(e) =>
                          setEditingRegra({
                            ...editingRegra,
                            prioridade: Number(e.target.value),
                          })
                        }
                        className="h-8 w-16"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground"
                        title="Restaurar prioridade"
                        onClick={() =>
                          setEditingRegra({
                            ...editingRegra,
                            prioridade: originalRegra?.prioridade || 100,
                          })
                        }
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    r.prioridade
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={r.ativo}
                    onCheckedChange={(v) => onToggleAtivo(r.id, v)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isEditing && editingRegra ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-500"
                          onClick={() => handleUpdate(editingRegra)}
                          disabled={isUpdating}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => {
                            setEditingRegra(null);
                            setOriginalRegra(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {originalRegra && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-500"
                            title="Restaurar valores originais"
                            onClick={() => setEditingRegra(originalRegra)}
                          >
                            <HistoryIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingRegra(r);
                            setOriginalRegra(r);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onDuplicate(r)}
                          disabled={isDuplicating}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setConfirmDeleteRegraId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!confirmDeleteRegraId}
        onOpenChange={(o) => !o && setConfirmDeleteRegraId(null)}
        title="Remover regra"
        description="Deseja remover esta regra de contabilização? Esta ação não pode ser desfeita."
        confirmText="Remover"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteRegraId) onDelete(confirmDeleteRegraId);
          setConfirmDeleteRegraId(null);
        }}
      />
    </>
  );
}
