import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Truck,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFornecedores, Fornecedor } from '@/hooks/useFinancialData';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { FornecedorForm } from '@/components/fornecedores/FornecedorForm';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFornecedor, setDeletingFornecedor] = useState<Fornecedor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();
  const { data: fornecedores = [], isLoading } = useFornecedores();

  const filteredFornecedores = fornecedores.filter(f => {
    const matchesSearch = 
      f.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.cnpj_cpf?.includes(searchTerm)) ||
      (f.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const totalFornecedores = fornecedores.length;
  const fornecedoresAtivos = fornecedores.filter(f => f.ativo).length;

  const handleDelete = async () => {
    if (!deletingFornecedor) return;
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('fornecedores')
      .update({ ativo: false })
      .eq('id', deletingFornecedor.id);
    
    setIsDeleting(false);
    
    if (error) {
      toast.error('Erro ao excluir fornecedor');
      return;
    }
    
    toast.success('Fornecedor excluído com sucesso');
    queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    setDeleteDialogOpen(false);
    setDeletingFornecedor(null);
  };
  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua base de fornecedores</p>
          </div>
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 shadow-lg shadow-warning/25 text-warning-foreground"
            onClick={() => {
              setEditingFornecedor(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Fornecedores</p>
                  <p className="text-2xl font-bold font-display mt-1">{totalFornecedores}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110">
                  <Truck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fornecedores Ativos</p>
                  <p className="text-2xl font-bold font-display mt-1">{fornecedoresAtivos}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por razão social, nome fantasia, CNPJ ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Fornecedor</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFornecedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {fornecedores.length === 0 ? 'Nenhum fornecedor cadastrado' : 'Nenhum fornecedor encontrado'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFornecedores.map((fornecedor, index) => (
                        <motion.tr
                          key={fornecedor.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-warning" />
                              </div>
                              <div>
                                <p className="font-medium">{fornecedor.razao_social}</p>
                                {fornecedor.nome_fantasia && (
                                  <p className="text-xs text-muted-foreground">{fornecedor.nome_fantasia}</p>
                                )}
                                {fornecedor.cnpj_cpf && (
                                  <p className="text-xs text-muted-foreground">{fornecedor.cnpj_cpf}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {fornecedor.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">{fornecedor.email}</span>
                                </div>
                              )}
                              {fornecedor.telefone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{fornecedor.telefone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(fornecedor.cidade || fornecedor.estado) && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {fornecedor.cidade}{fornecedor.cidade && fornecedor.estado && ' - '}{fornecedor.estado}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                fornecedor.ativo 
                                  ? "bg-success/10 text-success border-success/20" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Eye className="h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="gap-2"
                                  onClick={() => {
                                    setEditingFornecedor(fornecedor);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="gap-2 text-destructive"
                                  onClick={() => {
                                    setDeletingFornecedor(fornecedor);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </motion.div>

        <FornecedorForm 
          open={formOpen} 
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingFornecedor(null);
          }}
          fornecedor={editingFornecedor}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o fornecedor{' '}
                <span className="font-semibold text-foreground">
                  {deletingFornecedor?.razao_social}
                </span>
                ? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </MainLayout>
  );
}
