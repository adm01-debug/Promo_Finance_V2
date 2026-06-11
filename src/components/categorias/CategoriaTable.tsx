import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteCategoria } from '@/hooks/useCategorias';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as Icons from 'lucide-react';

interface CategoriaTableProps {
  categorias: any[];
  isLoading: boolean;
  onEdit: (categoria: any) => void;
}

export function CategoriaTable({ categorias, isLoading, onEdit }: CategoriaTableProps) {
  const deleteMutation = useDeleteCategoria();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Nenhuma categoria encontrada nesta seção.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableHead className="w-12"></TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categorias.map((categoria) => {
          const pascalName = categoria.icone?.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') ?? '';
          const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[pascalName] || Icons.Tag;
          
          return (
            <TableRow key={categoria.id} className="border-white/5 group hover:bg-white/5 transition-colors">
              <TableCell>
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: categoria.cor || '#666' }}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
              </TableCell>
              <TableCell className="font-medium">{categoria.nome}</TableCell>
              <TableCell className="capitalize">{categoria.tipo}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(categoria)} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate(categoria.id)} 
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Desativar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
