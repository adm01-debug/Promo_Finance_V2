import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { 
  Settings2, 
  Plus, 
  Trash2, 
  Settings,
  Layout,
  Tag,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCustomFieldDefinitions, useSaveCustomFieldDefinition, useDeleteCustomFieldDefinition, type EntityType, type FieldType } from '@/hooks/useCustomFields';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'contas_pagar', label: 'Contas a Pagar' },
  { value: 'contas_receber', label: 'Contas a Receber' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'fornecedores', label: 'Fornecedores' },
  { value: 'empresas', label: 'Empresas' },
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Lista de Opções (Select)' },
  { value: 'boolean', label: 'Sim/Não (Checkbox)' },
];

export default function CustomFieldsAdmin() {
  const { currentEmpresaId } = useAuth();
  const { data: definitions = [], isLoading } = useCustomFieldDefinitions(undefined, currentEmpresaId || undefined);
  const saveDefinition = useSaveCustomFieldDefinition();
  const deleteDefinition = useDeleteCustomFieldDefinition();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    entity_type: 'clientes' as EntityType,
    name: '',
    label: '',
    field_type: 'text' as FieldType,
    placeholder: '',
    options: '',
    required: false,
  });

  const handleSave = async () => {
    if (!formData.name || !formData.label || !currentEmpresaId) return;
    
    try {
      await saveDefinition.mutateAsync({
        id: editingId || undefined,
        ...formData,
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        options: formData.field_type === 'select' ? formData.options.split(',').map(s => s.trim()) : null,
        empresa_id: currentEmpresaId
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      entity_type: 'clientes',
      name: '',
      label: '',
      field_type: 'text',
      placeholder: '',
      options: '',
      required: false,
    });
  };

  const handleEdit = (def: any) => {
    setEditingId(def.id);
    setFormData({
      entity_type: def.entity_type,
      name: def.name,
      label: def.label,
      field_type: def.field_type,
      placeholder: def.placeholder || '',
      options: def.options ? def.options.join(', ') : '',
      required: def.required,
    });
    setIsDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10 space-y-8">
          <PageHeader 
            title="Campos Customizados" 
            subtitle="Adicione campos extras aos seus registros sem a necessidade de desenvolvedores."
            badge="Personalização Enterprise"
            icon={Settings2}
            gradientFrom="from-purple-600"
            gradientVia="via-primary"
            gradientTo="to-indigo-500"
          >
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" />
              Novo Campo
            </Button>
          </PageHeader>

          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-card/5 border-border backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-foreground">Dicionário de Dados Customizados</CardTitle>
                <CardDescription>
                  Estes campos aparecerão automaticamente nos formulários de criação e edição das entidades selecionadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-foreground/40">Entidade</TableHead>
                      <TableHead className="text-foreground/40">Label</TableHead>
                      <TableHead className="text-foreground/40">Nome Técnico</TableHead>
                      <TableHead className="text-foreground/40">Tipo</TableHead>
                      <TableHead className="text-foreground/40">Obrigatório</TableHead>
                      <TableHead className="text-right text-foreground/40">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-foreground/40">Carregando...</TableCell></TableRow>
                    ) : definitions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-foreground/20">Nenhum campo customizado definido.</TableCell></TableRow>
                    ) : (
                      definitions.map((def) => (
                        <TableRow key={def.id} className="border-white/5 hover:bg-card/5 transition-colors">
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {ENTITY_TYPES.find(e => e.value === def.entity_type)?.label || def.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-foreground">{def.label}</TableCell>
                          <TableCell><code className="text-xs text-foreground/40">{def.name}</code></TableCell>
                          <TableCell className="text-foreground/60">
                            {FIELD_TYPES.find(f => f.value === def.field_type)?.label || def.field_type}
                          </TableCell>
                          <TableCell>
                            {def.required ? (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20">Sim</Badge>
                            ) : (
                              <Badge variant="outline" className="text-foreground/20">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="text-foreground/20 hover:text-foreground" onClick={() => handleEdit(def)}>
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-foreground/20 hover:text-destructive" onClick={() => deleteDefinition.mutate(def.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-popover border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Campo' : 'Novo Campo Customizado'}</DialogTitle>
            <DialogDescription className="text-foreground/40">
              Configure como o campo aparecerá para os usuários.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entidade de Destino</Label>
              <Select 
                value={formData.entity_type} 
                onValueChange={(val: EntityType) => setFormData({ ...formData, entity_type: val })}
              >
                <SelectTrigger className="bg-card/5 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (Exibição)</Label>
                <Input 
                  value={formData.label} 
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ex: Cor Favorita"
                  className="bg-card/5 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Técnico (DB)</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: cor_favorita"
                  disabled={!!editingId}
                  className="bg-card/5 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Dado</Label>
              <Select 
                value={formData.field_type} 
                onValueChange={(val: FieldType) => setFormData({ ...formData, field_type: val })}
              >
                <SelectTrigger className="bg-card/5 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.field_type === 'select' && (
              <div className="space-y-2">
                <Label>Opções (separadas por vírgula)</Label>
                <Input 
                  value={formData.options} 
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Azul, Verde, Vermelho"
                  className="bg-card/5 border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Placeholder / Dica</Label>
              <Input 
                value={formData.placeholder} 
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Dica para o usuário"
                className="bg-card/5 border-border"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="required" 
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              />
              <Label htmlFor="required">Campo obrigatório</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-foreground/40">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary">
              {editingId ? 'Salvar Alterações' : 'Criar Campo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
