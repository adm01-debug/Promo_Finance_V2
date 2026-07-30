import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, MessageSquare, Phone, Plus, Copy, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Template {
  id: string;
  nome: string;
  tipo: 'email' | 'sms' | 'whatsapp';
  assunto?: string;
  conteudo: string;
  variaveis: string[];
}

interface Props {
  templates: Template[];
  templateDialogOpen: boolean;
  selectedTemplate: Template | null;
  onTemplateDialogChange: (open: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function TemplatesTab({ templates, templateDialogOpen, selectedTemplate, onTemplateDialogChange }: Props) {
  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates de Mensagem</CardTitle>
              <CardDescription>Crie e gerencie templates para e-mail, SMS e WhatsApp</CardDescription>
            </div>
            <Dialog open={templateDialogOpen} onOpenChange={onTemplateDialogChange}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Novo Template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Nome do Template</Label>
                      <Input placeholder="Ex: Lembrete de Vencimento" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Select defaultValue="email">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Assunto (apenas e-mail)</Label>
                    <Input placeholder="Assunto do e-mail" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Conteúdo da Mensagem</Label>
                    <Textarea placeholder="Digite o conteúdo da mensagem..." className="min-h-[200px] font-mono text-sm" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Variáveis disponíveis:</p>
                    <div className="flex flex-wrap gap-2">
                      {['{{cliente}}', '{{valor}}', '{{data_vencimento}}', '{{link_pagamento}}', '{{empresa}}', '{{dias_atraso}}'].map(v => (
                        <Badge key={v} variant="outline" className="cursor-pointer hover:bg-primary/10">{v}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">Salvar Template</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {templates.map((template) => {
              const tipoConfig = {
                email: { icon: Mail, color: 'text-secondary', bg: 'bg-secondary/10' },
                sms: { icon: MessageSquare, color: 'text-success', bg: 'bg-success/10' },
                whatsapp: { icon: Phone, color: 'text-success', bg: 'bg-success/10' },
              }[template.tipo];
              const Icon = tipoConfig.icon;
              return (
                <motion.div key={template.id} variants={itemVariants} className="p-4 rounded-lg border hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2 rounded-lg", tipoConfig.bg)}>
                      <Icon className={cn("h-5 w-5", tipoConfig.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.nome}</h4>
                        <Badge variant="secondary">{template.tipo.toUpperCase()}</Badge>
                      </div>
                      {template.assunto && (
                        <p className="text-sm text-muted-foreground mt-1">Assunto: {template.assunto}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{template.conteudo}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
