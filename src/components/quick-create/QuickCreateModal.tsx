import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Receipt,
  FileText,
  Users,
  Building2,
  CreditCard,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EntityType = 'conta-pagar' | 'conta-receber' | 'cliente' | 'fornecedor' | 'nota-fiscal';

interface EntityOption {
  id: EntityType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  route: string;
}

const entityOptions: EntityOption[] = [
  {
    id: 'conta-pagar',
    label: 'Conta a Pagar',
    description: 'Nova despesa ou pagamento',
    icon: Receipt,
    color: 'text-red-500 bg-red-500/10',
    route: '/contas-pagar',
  },
  {
    id: 'conta-receber',
    label: 'Conta a Receber',
    description: 'Nova receita ou cobrança',
    icon: CreditCard,
    color: 'text-green-500 bg-green-500/10',
    route: '/contas-receber',
  },
  {
    id: 'cliente',
    label: 'Cliente',
    description: 'Novo cliente ou empresa',
    icon: Users,
    color: 'text-blue-500 bg-blue-500/10',
    route: '/clientes',
  },
  {
    id: 'fornecedor',
    label: 'Fornecedor',
    description: 'Novo fornecedor',
    icon: Building2,
    color: 'text-purple-500 bg-purple-500/10',
    route: '/fornecedores',
  },
  {
    id: 'nota-fiscal',
    label: 'Nota Fiscal',
    description: 'Emitir nova NF-e',
    icon: FileText,
    color: 'text-orange-500 bg-orange-500/10',
    route: '/notas-fiscais',
  },
];

export function QuickCreateModal({ open, onOpenChange }: QuickCreateModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    name: '',
  });

  const handleSelectEntity = (entity: EntityType) => {
    setSelectedEntity(entity);
    setStep('form');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedEntity(null);
    setFormData({ description: '', value: '', name: '' });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('select');
      setSelectedEntity(null);
      setFormData({ description: '', value: '', name: '' });
    }, 200);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simular delay para feedback visual
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const entity = entityOptions.find((e) => e.id === selectedEntity);
    if (entity) {
      navigate(entity.route, { state: { quickCreate: formData } });
    }
    
    setIsSubmitting(false);
    handleClose();
  };

  const selectedEntityData = entityOptions.find((e) => e.id === selectedEntity);

  const renderSelectStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {entityOptions.map((entity, index) => {
        const Icon = entity.icon;
        return (
          <motion.button
            key={entity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleSelectEntity(entity.id)}
            className={cn(
              'group relative flex items-center gap-3 p-4 rounded-xl border border-border',
              'bg-card hover:bg-accent/50 transition-all duration-200',
              'hover:border-primary/30 hover:shadow-md',
              'focus:outline-none focus:ring-2 focus:ring-primary/50'
            )}
          >
            <div className={cn('p-2.5 rounded-lg', entity.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{entity.label}</p>
              <p className="text-xs text-muted-foreground">{entity.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        );
      })}
    </motion.div>
  );

  const renderFormStep = () => {
    if (!selectedEntityData) return null;
    const Icon = selectedEntityData.icon;

    const isFinancial = selectedEntity === 'conta-pagar' || selectedEntity === 'conta-receber';
    const isEntity = selectedEntity === 'cliente' || selectedEntity === 'fornecedor';

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* Entity Header */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className={cn('p-2 rounded-lg', selectedEntityData.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{selectedEntityData.label}</p>
            <p className="text-xs text-muted-foreground">Preencha os dados básicos</p>
          </div>
        </div>

        {/* Quick Form */}
        <div className="space-y-3">
          {isEntity ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">
                  {selectedEntity === 'cliente' ? 'Nome do Cliente' : 'Nome do Fornecedor'}
                </Label>
                <Input
                  id="name"
                  placeholder={selectedEntity === 'cliente' ? 'Ex: Empresa ABC Ltda' : 'Ex: Fornecedor XYZ'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10"
                />
              </div>
            </>
          ) : isFinancial ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Pagamento de fornecedor"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="value" className="text-sm">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0,00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="h-10"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição da nota fiscal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-10"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Criar e Continuar
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Você será redirecionado para completar o cadastro
        </p>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            {step === 'select' ? 'Criar Novo' : `Novo ${selectedEntityData?.label}`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'select' ? renderSelectStep() : renderFormStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Hook for triggering quick create from anywhere
export function useQuickCreate() {
  const [open, setOpen] = useState(false);
  
  return {
    open,
    setOpen,
    QuickCreateTrigger: ({ children }: { children: React.ReactNode }) => (
      <button onClick={() => setOpen(true)}>{children}</button>
    ),
  };
}
