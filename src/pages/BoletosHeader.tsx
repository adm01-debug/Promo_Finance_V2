import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Plus, Barcode, History as HistoryIcon } from 'lucide-react';
import { NovoBoletoForm } from '@/components/boletos/NovoBoletoForm';
import { itemVariants } from './Boletos.helpers';

interface BoletosHeaderProps {
  activeTab: string;
  setActiveTab: import('react').Dispatch<import('react').SetStateAction<string>>;
  showNovoBoleto: boolean;
  setShowNovoBoleto: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  empresas: { id: string; razao_social: string; cnpj: string | null }[] | undefined;
  contasBancarias:
    | { banco: string; agencia: string; conta: string; empresa_id: string; id: string }[]
    | undefined;
  createBoleto: import('@tanstack/react-query').UseMutateFunction<
    {
      agencia: string | null;
      asaas_id: string | null;
      banco: string | null;
      banco_nome: string | null;
      bitrix_id: string | null;
      bitrix_status: string | null;
      cedente_cnpj: string | null;
      cedente_nome: string | null;
      codigo_barras: string | null;
      conta: string | null;
      conta_bancaria_id: string | null;
      conta_pagar_id: string | null;
      conta_receber_id: string | null;
      created_at: string;
      created_by: string | null;
      data_emissao: string | null;
      data_pagamento: string | null;
      desconto: number | null;
      descricao: string | null;
      empresa_id: string | null;
      eventos_pagamento: import('@/integrations/supabase/types').Json | null;
      external_provider: string | null;
      id: string;
      juros_multa: number | null;
      linha_digitavel: string | null;
      nosso_numero: string | null;
      numero: string | null;
      observacoes: string | null;
      rastreio_status: import('@/integrations/supabase/types').Json | null;
      sacado_cpf_cnpj: string | null;
      sacado_nome: string | null;
      status: string | null;
      updated_at: string | null;
      url_pdf: string | null;
      user_id: string;
      valor: number;
      valor_pago: number | null;
      vencimento: string | null;
    },
    Error,
    import('@/hooks/useBoletos.types').NovoBoletoData,
    unknown
  >;
  isCreating: boolean;
}

export function BoletosHeader({
  activeTab,
  setActiveTab,
  showNovoBoleto,
  setShowNovoBoleto,
  empresas,
  contasBancarias,
  createBoleto,
  isCreating,
}: BoletosHeaderProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Barcode className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-display-md text-foreground">Gestão de Boletos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Emissão, controle de registros e histórico de remessas
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-muted/50 p-1 rounded-xl">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="lista" className="rounded-lg gap-2">
              <FileText className="h-4 w-4" /> Lista
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-lg gap-2">
              <HistoryIcon className="h-4 w-4" /> Histórico
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog open={showNovoBoleto} onOpenChange={setShowNovoBoleto}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 h-10"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Novo Boleto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Gerar Novo Boleto
              </DialogTitle>
            </DialogHeader>
            <NovoBoletoForm
              onClose={() => setShowNovoBoleto(false)}
              empresas={empresas}
              contasBancarias={contasBancarias}
              onSubmit={createBoleto}
              isCreating={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
