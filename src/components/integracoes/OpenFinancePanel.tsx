import { useState } from 'react';
import { Building2, Link2, Shield, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOpenFinance } from '@/hooks/useOpenFinance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { OpenFinanceConnectDialog } from './open-finance/OpenFinanceConnectDialog';
import {
  OpenFinanceConsentList,
  type OpenFinanceConsent,
} from './open-finance/OpenFinanceConsentList';
import {
  OpenFinanceImportDialog,
  type ContaBancariaOpenFinance,
} from './open-finance/OpenFinanceImportDialog';

export const OpenFinancePanel = () => {
  const {
    institutions,
    consents,
    loadingInstitutions,
    loadingConsents,
    createConsent,
    creatingConsent,
    revokeConsent,
    revokingConsent,
    importTransactions,
    importingTransactions,
  } = useOpenFinance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<OpenFinanceConsent | null>(null);
  const [selectedContaBancaria, setSelectedContaBancaria] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  const { data: contasBancarias } = useQuery({
    queryKey: ['contas-bancarias-open-finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('id, banco, agencia, conta, empresa_id, empresas(razao_social)')
        .eq('ativo', true)
        .order('banco');

      if (error) throw error;
      return data;
    },
  });

  const handleConnect = (institutionId: string) => {
    createConsent({ institutionId });
    setDialogOpen(false);
  };

  const handleOpenImportDialog = (consent: OpenFinanceConsent) => {
    setSelectedConsent(consent);
    setSelectedContaBancaria('');
    setSelectedPeriod('30');
    setImportDialogOpen(true);
  };

  const handleImport = async () => {
    if (!selectedConsent || !selectedContaBancaria) {
      toast.error('Selecione uma conta bancária');
      return;
    }

    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(selectedPeriod));

    try {
      await importTransactions({
        consentId: selectedConsent.id,
        accountId: 'acc_001',
        contaBancariaId: selectedContaBancaria,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
      setImportDialogOpen(false);
    } catch (error: unknown) {
      logger.error('Import error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Open Finance Brasil
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte suas contas bancárias para sincronização automática de saldos e transações
          </p>
        </div>

        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Link2 className="h-4 w-4" />
          Conectar Banco
        </Button>

        <OpenFinanceConnectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          institutions={institutions}
          loading={loadingInstitutions}
          creating={creatingConsent}
          onConnect={handleConnect}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contas Conectadas</CardTitle>
          <CardDescription>Gerencie suas conexões com instituições financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <OpenFinanceConsentList
            consents={(consents as OpenFinanceConsent[]) || []}
            institutions={institutions}
            loading={loadingConsents}
            revoking={revokingConsent}
            onImport={handleOpenImportDialog}
            onRevoke={revokeConsent}
          />
        </CardContent>
      </Card>

      <OpenFinanceImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        contasBancarias={contasBancarias as ContaBancariaOpenFinance[] | undefined}
        selectedContaBancaria={selectedContaBancaria}
        setSelectedContaBancaria={setSelectedContaBancaria}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        importing={importingTransactions}
        onImport={handleImport}
      />

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <Shield className="h-8 w-8 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">Sobre o Open Finance Brasil</h3>
            <p className="text-sm text-muted-foreground">
              O Open Finance é regulado pelo Banco Central do Brasil e permite o compartilhamento
              seguro de dados financeiros entre instituições autorizadas. Você tem controle total
              sobre quais dados compartilhar e pode revogar o acesso a qualquer momento.
            </p>
            <a
              href="https://openbankingbrasil.org.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
            >
              Saiba mais <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
