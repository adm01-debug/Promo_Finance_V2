import { useState } from 'react';
import { Plus, Tag, ArrowUpDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriaForm } from '@/components/categorias/CategoriaForm';
import { CategoriaTable } from '@/components/categorias/CategoriaTable';
import { useCategorias } from '@/hooks/useCategorias';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { StandardFilterSection } from '@/components/shared/StandardFilterSection';
import { StandardTableCard } from '@/components/shared/StandardTableCard';

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
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="relative z-10 space-y-10 pb-20">
          <PageHeader 
            title="Categorias Financeiras" 
            subtitle="Gerencie a classificação de receitas e despesas do seu negócio."
            badge="Chart of Accounts"
            icon={Tag}
            actions={
              <Button onClick={handleCreate} size="lg" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]">
                <Plus className="h-5 w-5" /> Novo Registro
              </Button>
            }
          />

          <StandardFilterSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar categoria..."
            badge="Classificação"
          >
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as any)} 
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-2 w-full md:w-[300px] h-10 bg-white/5 border-white/10 rounded-xl">
                <TabsTrigger value="despesa" className="gap-2 rounded-lg">
                  <ArrowUpDown className="h-4 w-4 text-destructive" />
                  Despesas
                </TabsTrigger>
                <TabsTrigger value="receita" className="gap-2 rounded-lg">
                  <ArrowUpDown className="h-4 w-4 text-success" />
                  Receitas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </StandardFilterSection>

          <StandardTableCard isLoading={isLoading}>
            <CategoriaTable 
              categorias={filteredCategorias} 
              isLoading={isLoading} 
              onEdit={handleEdit}
            />
          </StandardTableCard>
        </div>
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
