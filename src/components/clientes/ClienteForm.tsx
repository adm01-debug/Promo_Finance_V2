import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Edit } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { ClienteFormFields } from './ClienteFormFields';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { logger } from '@/lib/logger';
import { sounds } from '@/lib/sound-feedback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateCnpjCpf } from '@/lib/masks';

const clienteSchema = z.object({
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
  limite_credito: z.number().min(0, 'Limite não pode ser negativo').optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
  ativo: z.boolean().default(true),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface Cliente {
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
  limite_credito: number | null;
  observacoes: string | null;
  ativo: boolean;
}

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
}

export function ClienteForm({ open, onOpenChange, cliente }: ClienteFormProps) {
  const queryClient = useQueryClient();
  const { customCelebration } = useConfetti();
  const isEditing = !!cliente;

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      razao_social: '',
      nome_fantasia: '',
      cnpj_cpf: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      contato: '',
      limite_credito: 0,
      observacoes: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (cliente && open) {
      form.reset({
        razao_social: cliente.razao_social,
        nome_fantasia: cliente.nome_fantasia || '',
        cnpj_cpf: cliente.cnpj_cpf || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        contato: cliente.contato || '',
        limite_credito: cliente.limite_credito || 0,
        observacoes: cliente.observacoes || '',
        ativo: cliente.ativo,
      });
    } else if (!cliente && open) {
      form.reset({
        razao_social: '',
        nome_fantasia: '',
        cnpj_cpf: '',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        contato: '',
        limite_credito: 0,
        observacoes: '',
        ativo: true,
      });
    }
  }, [cliente, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const { error } = await supabase.from('clientes').insert({
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        cnpj_cpf: data.cnpj_cpf || null,
        email: data.email || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        contato: data.contato || null,
        limite_credito: data.limite_credito || 0,
        observacoes: data.observacoes || null,
        ativo: data.ativo,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      sounds.success();
      customCelebration({ title: 'Cliente cadastrado!', description: 'Cliente adicionado com sucesso.' });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      sounds.error();
      logger.error('Error creating cliente:', error);
      toast({
        title: 'Erro ao cadastrar cliente',
        description: 'Não foi possível cadastrar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      if (!cliente) throw new Error('Cliente não encontrado');

      const { error } = await supabase
        .from('clientes')
        .update({
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || null,
          cnpj_cpf: data.cnpj_cpf || null,
          email: data.email || null,
          telefone: data.telefone || null,
          endereco: data.endereco || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          contato: data.contato || null,
          limite_credito: data.limite_credito || 0,
          observacoes: data.observacoes || null,
          ativo: data.ativo,
        })
        .eq('id', cliente.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: 'Cliente atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      logger.error('Error updating cliente:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ClienteFormData) => {
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
              isEditing ? "bg-secondary/10" : "bg-primary/10"
            )}>
              {isEditing ? (
                <Edit className="h-5 w-5 text-secondary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ClienteFormFields form={form} />

            {/* Actions */}
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
                    : "bg-gradient-to-r from-primary to-primary/80 shadow-primary/25"
                )}
              >
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </ActionButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
