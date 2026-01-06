import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building2, Mail, Phone, MapPin, FileText, Edit, Truck } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { FieldLabel } from '@/components/ui/info-tooltip';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { maskCnpjCpf, maskPhone, validateCnpjCpf } from '@/lib/masks';

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

export function FornecedorForm({ open, onOpenChange, fornecedor }: FornecedorFormProps) {
  const queryClient = useQueryClient();
  const { customCelebration } = useConfetti();
  const isEditing = !!fornecedor;

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
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
      observacoes: '',
      ativo: true,
    },
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
        observacoes: '',
        ativo: true,
      });
    }
  }, [fornecedor, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FornecedorFormData) => {
      const { error } = await supabase.from('fornecedores').insert({
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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      sounds.success();
      customCelebration({ title: 'Fornecedor cadastrado!', description: 'Fornecedor adicionado com sucesso.' });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      sounds.error();
      console.error('Error creating fornecedor:', error);
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
          observacoes: data.observacoes || null,
          ativo: data.ativo,
        })
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
    onError: (error) => {
      console.error('Error updating fornecedor:', error);
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
            {/* Razão Social e Nome Fantasia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Razão Social" required tooltip="Nome oficial registrado da empresa fornecedora" />
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="Razão social" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nome_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Nome Fantasia" tooltip="Nome comercial pelo qual o fornecedor é conhecido" />
                    <FormControl>
                      <Input {...field} placeholder="Nome fantasia (opcional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CNPJ/CPF e Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="CNPJ/CPF" tooltip="Documento fiscal do fornecedor. Validação automática" />
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          placeholder="00.000.000/0000-00" 
                          className="pl-10"
                          onChange={(e) => field.onChange(maskCnpjCpf(e.target.value))}
                          maxLength={18}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contato"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Pessoa de Contato" tooltip="Responsável por negociações e atendimento" />
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="Nome do contato" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="E-mail" tooltip="E-mail para envio de pedidos e comunicações" />
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="email@exemplo.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Telefone" tooltip="Número de contato com DDD" />
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          placeholder="(00) 00000-0000" 
                          className="pl-10"
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          maxLength={15}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Endereço" tooltip="Endereço comercial do fornecedor" />
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} placeholder="Rua, número, bairro" className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cidade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SP" maxLength={2} className="uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Observações" tooltip="Notas internas sobre condições de pagamento, prazos, etc." />
                  <FormControl>
                    <Textarea {...field} placeholder="Observações adicionais (opcional)" className="min-h-[60px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ativo */}
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Fornecedor Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Fornecedores inativos não aparecem nas listagens
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

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
