import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Truck } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { sounds } from '@/lib/sound-feedback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateCnpjCpf } from '@/lib/masks';
import { logger } from '@/lib/logger';
import { FornecedorDadosBasicos } from './form/FornecedorDadosBasicos';
import { FornecedorContatoEndereco } from './form/FornecedorContatoEndereco';
import { FornecedorObservacoes } from './form/FornecedorObservacoes';

const fornecedorSchema = z.object({
  razao_social: z.string().min(2, 'Razão social é obrigatória').max(200, 'Nome muito longo'),
  nome_fantasia: z.string().max(200, 'Nome muito longo').optional(),
  cnpj_cpf: z.string().max(18, 'CNPJ/CPF inválido').optional().refine(
    (val) => !val || validateCnpjCpf(val).valid,
    (val) => ({ message: val ? validateCnpjCpf(val).message : 'Documento inválido' })
  ),
  email: z.string().email('E-mail inválido').max(255, 'E-mail muito longo').optional().or(z.literal('')),
  telefone: z.string().max(20, 'Telefone muito longo').optional(),
  endereco: z.string().max(300, 'Endereço muito longo').optional(),
  cidade: z.string().max(100, 'Cidade muito longa').optional(),
  estado: z.string().max(2, 'Use a sigla do estado').optional(),
  contato: z.string().max(100, 'Nome muito longo').optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
  ativo: z.boolean().default(true),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj_cpf: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  contato: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface FornecedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor | null;
}

const DEFAULT_VALUES: FornecedorFormData = {
  razao_social: '',
  nome_fantasia: '',
  cnpj_cpf: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  contato: '',
  observacoes: '',
  ativo: true,
};

export function FornecedorForm({ open, onOpenChange, fornecedor }: FornecedorFormProps) {
  const queryClient = useQueryClient();
  const { customCelebration } = useConfetti();
  const isEditing = !!fornecedor;

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (fornecedor && open) {
      form.reset({
        razao_social: fornecedor.razao_social,
        nome_fantasia: fornecedor.nome_fantasia || '',
        cnpj_cpf: fornecedor.cnpj_cpf || '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || '',
        contato: fornecedor.contato || '',
        observacoes: fornecedor.observacoes || '',
        ativo: fornecedor.ativo,
      });
    } else if (!fornecedor && open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [fornecedor, open, form]);

  const buildPayload = (data: FornecedorFormData) => ({
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia || null,
    cnpj_cpf: data.cnpj_cpf || null,
    email: data.email || null,
    telefone: data.telefone || null,
    endereco: data.endereco || null,
    cidade: data.cidade || null,
    estado: data.estado || null,
    contato: data.contato || null,
    observacoes: data.observacoes || null,
    ativo: data.ativo,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FornecedorFormData) => {
      const { error } = await supabase.from('fornecedores').insert(buildPayload(data));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      sounds.success();
      customCelebration({ title: 'Fornecedor cadastrado!', description: 'Fornecedor adicionado com sucesso.' });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      sounds.error();
      logger.error('Error creating fornecedor:', error);
      toast({
        title: 'Erro ao cadastrar fornecedor',
        description: 'Não foi possível cadastrar o fornecedor. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FornecedorFormData) => {
      if (!fornecedor) throw new Error('Fornecedor não encontrado');
      const { error } = await supabase
        .from('fornecedores')
        .update(buildPayload(data))
        .eq('id', fornecedor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast({
        title: 'Fornecedor atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      logger.error('Error updating fornecedor:', error);
      toast({
        title: 'Erro ao atualizar fornecedor',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FornecedorFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              isEditing ? "bg-secondary/10" : "bg-warning/10"
            )}>
              {isEditing ? (
                <Edit className="h-5 w-5 text-secondary" />
              ) : (
                <Truck className="h-5 w-5 text-warning" />
              )}
            </div>
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FornecedorDadosBasicos form={form} />
            <FornecedorContatoEndereco form={form} />
            <FornecedorObservacoes form={form} />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <ActionButton
                type="submit"
                state={isPending ? 'loading' : 'idle'}
                loadingText="Salvando..."
                successText="Salvo!"
                className={cn(
                  "gap-2 shadow-lg",
                  isEditing
                    ? "bg-gradient-to-r from-secondary to-secondary/80 shadow-secondary/25"
                    : "bg-gradient-to-r from-warning to-warning/80 shadow-warning/25 text-warning-foreground"
                )}
              >
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
              </ActionButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
