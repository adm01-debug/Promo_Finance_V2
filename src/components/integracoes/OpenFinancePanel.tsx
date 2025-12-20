import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Link2,
  RefreshCw,
  Wallet,
  ArrowRightLeft,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Unlink,
  Download,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpenFinance } from '@/hooks/useOpenFinance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

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
  const [selectedConsent, setSelectedConsent] = useState<any>(null);
  const [selectedContaBancaria, setSelectedContaBancaria] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  // Fetch contas bancarias for mapping
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

  const handleOpenImportDialog = (consent: any) => {
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
        accountId: 'acc_001', // In real implementation, this would be selected by user
        contaBancariaId: selectedContaBancaria,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'authorized':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Autorizado</Badge>;
      case 'awaiting_authorization':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Aguardando</Badge>;
      case 'revoked':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Revogado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Link2 className="h-4 w-4" />
              Conectar Banco
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Conectar Instituição Financeira</DialogTitle>
              <DialogDescription>
                Selecione o banco que deseja conectar via Open Finance
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {loadingInstitutions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  institutions?.map((institution) => (
                    <motion.button
                      key={institution.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleConnect(institution.id)}
                      disabled={creatingConsent}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {institution.logo ? (
                          <img
                            src={institution.logo}
                            alt={institution.name}
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{institution.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {institution.status === 'active' ? 'Disponível' : 'Indisponível'}
                        </p>
                      </div>
                      {institution.status === 'active' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t">
              <Shield className="h-4 w-4" />
              Conexão segura via Open Finance Brasil. Seus dados são protegidos.
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contas Conectadas</CardTitle>
          <CardDescription>Gerencie suas conexões com instituições financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConsents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : consents && consents.length > 0 ? (
            <div className="space-y-4">
              {consents.map((consent: any) => {
                const institution = institutions?.find((i) => i.id === consent.institution_id);
                return (
                  <div
                    key={consent.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {institution?.name || consent.institution_id}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(consent.status)}
                          <span className="text-xs text-muted-foreground">
                            Conectado em{' '}
                            {new Date(consent.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {consent.status === 'authorized' && (
                        <>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Wallet className="h-4 w-4" />
                            Saldos
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <ArrowRightLeft className="h-4 w-4" />
                            Extrato
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleOpenImportDialog(consent)}
                          >
                            <Download className="h-4 w-4" />
                            Importar
                          </Button>
                        </>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive gap-1">
                            <Unlink className="h-4 w-4" />
                            Desconectar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar Consentimento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja desconectar esta conta? Você precisará
                              autorizar novamente para acessar os dados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeConsent(consent.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {revokingConsent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Revogar'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conta conectada</p>
              <p className="text-sm">Clique em "Conectar Banco" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importar Transações
            </DialogTitle>
            <DialogDescription>
              Importe as transações do Open Finance para conciliação bancária
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Conta Bancária de Destino</Label>
              <Select value={selectedContaBancaria} onValueChange={setSelectedContaBancaria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta no sistema" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias?.map((conta: any) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.banco} - Ag: {conta.agencia} / Cc: {conta.conta}
                      {conta.empresas && ` (${conta.empresas.razao_social})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincule a conta do Open Finance com uma conta cadastrada no sistema
              </p>
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Transações duplicadas serão ignoradas</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    O sistema identifica automaticamente transações já importadas
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!selectedContaBancaria || importingTransactions}
              className="gap-2"
            >
              {importingTransactions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Importar Transações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <Shield className="h-8 w-8 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">Sobre o Open Finance Brasil</h3>
            <p className="text-sm text-muted-foreground">
              O Open Finance é regulado pelo Banco Central do Brasil e permite o
              compartilhamento seguro de dados financeiros entre instituições autorizadas.
              Você tem controle total sobre quais dados compartilhar e pode revogar o acesso
              a qualquer momento.
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