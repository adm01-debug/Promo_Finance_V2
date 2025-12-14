import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Building2, Mail, Phone, MapPin, FileText, Edit, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
import { maskCnpjCpf, maskPhone } from '@/lib/masks';

const clienteSchema = z.object({
  razao_social: z.string().min(2, 'Razão social é obrigatória').max(200, 'Nome muito longo'),
  nome_fantasia: z.string().max(200, 'Nome muito longo').optional(),
  cnpj_cpf: z.string().max(18, 'CNPJ/CPF inválido').optional(),
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
      toast({
        title: 'Cliente cadastrado',
        description: 'O cliente foi adicionado com sucesso.',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating cliente:', error);
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
    onError: (error) => {
      console.error('Error updating cliente:', error);
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
            {/* Razão Social e Nome Fantasia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
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
                    <FormLabel>Nome Fantasia</FormLabel>
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
                    <FormLabel>CNPJ/CPF</FormLabel>
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
                    <FormLabel>Pessoa de Contato</FormLabel>
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
                    <FormLabel>E-mail</FormLabel>
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
                    <FormLabel>Telefone</FormLabel>
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
                  <FormLabel>Endereço</FormLabel>
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

            {/* Limite de Crédito */}
            <FormField
              control={form.control}
              name="limite_credito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite de Crédito</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
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
                    <FormLabel className="text-base">Cliente Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Clientes inativos não aparecem nas listagens
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
              <Button
                type="submit"
                disabled={isPending}
                className={cn(
                  "gap-2 shadow-lg",
                  isEditing 
                    ? "bg-gradient-to-r from-secondary to-secondary/80 shadow-secondary/25" 
                    : "bg-gradient-to-r from-primary to-primary/80 shadow-primary/25"
                )}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
