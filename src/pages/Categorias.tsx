import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Layers, ArrowUpDown, Filter, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriaForm } from '@/components/categorias/CategoriaForm';
import { CategoriaTable } from '@/components/categorias/CategoriaTable';
import { useCategorias } from '@/hooks/useCategorias';

export default function Categorias() {
  const [activeTab, setActiveTab] = useState<'despesa' | 'receita'>('despesa');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any>(null);

  const { categoriasDespesa, categoriasReceita, isLoading } = useCategorias();

  const currentCategorias = activeTab === 'despesa' ? categoriasDespesa : categoriasReceita;
  
  const filteredCategorias = currentCategorias.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (categoria: any) => {
    setEditingCategoria(categoria);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategoria(null);
    setIsFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Tag className="h-7 w-7 text-primary" />
              Categorias Financeiras
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a classificação de receitas e despesas do seu negócio
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as any)} 
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-2 w-full md:w-[300px]">
              <TabsTrigger value="despesa" className="gap-2">
                <ArrowUpDown className="h-4 w-4 text-destructive" />
                Despesas
              </TabsTrigger>
              <TabsTrigger value="receita" className="gap-2">
                <ArrowUpDown className="h-4 w-4 text-success" />
                Receitas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="border-none bg-background/50 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <CardContent className="p-0">
            <CategoriaTable 
              categorias={filteredCategorias} 
              isLoading={isLoading} 
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>
      </div>

      <CategoriaForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        categoria={editingCategoria}
        defaultType={activeTab}
      />
    </MainLayout>
  );
}
