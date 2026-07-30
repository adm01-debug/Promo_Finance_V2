import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import {
  GRUPOS_MONOFASICOS, classificarNcmMonofasico,
  type ItemMonofasico, type PosicaoCadeia,
} from '@/lib/tributario/monofasico';

export const POSICOES: { value: PosicaoCadeia; label: string }[] = [
  { value: 'industria', label: 'Indústria' },
  { value: 'importador', label: 'Importador' },
  { value: 'produtor', label: 'Produtor' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'atacado', label: 'Atacado' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'revenda', label: 'Revenda' },
];

interface MixEditorProps {
  itens: ItemMonofasico[];
  onChange: (itens: ItemMonofasico[]) => void;
}

export function MixEditor({ itens, onChange }: MixEditorProps) {
  const atualizar = (index: number, patch: Partial<ItemMonofasico>) => {
    onChange(itens.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <datalist id="ncms-monofasicos">
        {GRUPOS_MONOFASICOS.flatMap((g) =>
          g.ncms.map((n) => <option key={`${g.chave}-${n.ncm}`} value={n.ncm}>{n.descricao}</option>),
        )}
      </datalist>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">NCM</TableHead>
              <TableHead className="min-w-[160px]">Classificação</TableHead>
              <TableHead className="min-w-[150px]">Receita (R$)</TableHead>
              <TableHead className="min-w-[150px]">Posição na cadeia</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum NCM informado. Adicione ao menos um item para apurar o mix.
                </TableCell>
              </TableRow>
            )}
            {itens.map((item, i) => {
              const classificacao = classificarNcmMonofasico(item.ncm);
              return (
                <TableRow key={`linha-${i}`}>
                  <TableCell>
                    <Label className="sr-only" htmlFor={`ncm-${i}`}>NCM do item {i + 1}</Label>
                    <Input
                      id={`ncm-${i}`}
                      list="ncms-monofasicos"
                      value={item.ncm}
                      placeholder="0000.00.00"
                      onChange={(e) => atualizar(i, { ncm: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    {classificacao ? (
                      <Badge variant="outline" className="border-success/40 text-success">
                        {classificacao.grupo.nome}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Não monofásico</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Label className="sr-only" htmlFor={`receita-${i}`}>Receita do item {i + 1}</Label>
                    <Input
                      id={`receita-${i}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={Number.isFinite(item.receita) ? item.receita : 0}
                      onChange={(e) => atualizar(i, { receita: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.posicao ?? ''}
                      onValueChange={(v) => atualizar(i, { posicao: v as PosicaoCadeia })}
                    >
                      <SelectTrigger aria-label={`Posição na cadeia do item ${i + 1}`}>
                        <SelectValue placeholder="Usar padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSICOES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover item ${i + 1}`}
                      onClick={() => onChange(itens.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={() => onChange([...itens, { ncm: '', receita: 0 }])}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar NCM
      </Button>
    </div>
  );
}
