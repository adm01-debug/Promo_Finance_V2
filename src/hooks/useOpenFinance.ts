import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OpenFinanceInstitution {
  id: string;
  name: string;
  logo: string;
  status: string;
  api_base_url: string;
}

interface OpenFinanceAccount {
  id: string;
  type: string;
  subtype: string;
  currency: string;
  accountNumber: string;
  branch: string;
  bank: {
    code: string;
    name: string;
  };
}

interface OpenFinanceBalance {
  account_id: string;
  available: { amount: string; currency: string };
  current: { amount: string; currency: string };
  blocked: { amount: string; currency: string };
  updated_at: string;
}

interface OpenFinanceTransaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  description: string;
  category: string;
  date: string;
  status: string;
}

export const useOpenFinance = () => {
  const queryClient = useQueryClient();

  // Fetch participating institutions
  const {
    data: institutions,
    isLoading: loadingInstitutions,
    refetch: refetchInstitutions,
  } = useQuery({
    queryKey: ['open-finance-institutions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: { action: 'get_institutions' },
      });

      if (error) throw error;
      return data.institutions as OpenFinanceInstitution[];
    },
  });

  // Fetch user's consents
  const {
    data: consents,
    isLoading: loadingConsents,
    refetch: refetchConsents,
  } = useQuery({
    queryKey: ['open-finance-consents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_finance_consents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create consent mutation
  const createConsentMutation = useMutation({
    mutationFn: async ({ institutionId, permissions }: { institutionId: string; permissions?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: {
          action: 'create_consent',
          params: { institution_id: institutionId, permissions },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Consentimento criado', {
        description: 'Você será redirecionado para autorização no banco.',
      });
      queryClient.invalidateQueries({ queryKey: ['open-finance-consents'] });

      // Open authorization URL in new window
      if (data.authorization_url) {
        window.open(data.authorization_url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao criar consentimento', {
        description: error.message,
      });
    },
  });

  // Get accounts mutation
  const getAccountsMutation = useMutation({
    mutationFn: async (consentId: string) => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: {
          action: 'get_accounts',
          params: { consent_id: consentId },
        },
      });

      if (error) throw error;
      return data.accounts as OpenFinanceAccount[];
    },
  });

  // Get balances mutation
  const getBalancesMutation = useMutation({
    mutationFn: async ({ consentId, accountId }: { consentId: string; accountId: string }) => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: {
          action: 'get_balances',
          params: { consent_id: consentId, account_id: accountId },
        },
      });

      if (error) throw error;
      return data.balances as OpenFinanceBalance;
    },
  });

  // Get transactions mutation
  const getTransactionsMutation = useMutation({
    mutationFn: async ({
      consentId,
      accountId,
      startDate,
      endDate,
    }: {
      consentId: string;
      accountId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: {
          action: 'get_transactions',
          params: { consent_id: consentId, account_id: accountId, start_date: startDate, end_date: endDate },
        },
      });

      if (error) throw error;
      return data.transactions as OpenFinanceTransaction[];
    },
  });

  // Import transactions to system mutation
  const importTransactionsMutation = useMutation({
    mutationFn: async ({
      consentId,
      accountId,
      contaBancariaId,
      startDate,
      endDate,
    }: {
      consentId: string;
      accountId: string;
      contaBancariaId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: {
          action: 'import_transactions',
          params: { 
            consent_id: consentId, 
            account_id: accountId, 
            conta_bancaria_id: contaBancariaId,
            start_date: startDate, 
            end_date: endDate 
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Transações importadas', {
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast.error('Erro ao importar transações', {
        description: error.message,
      });
    },
  });

  // Revoke consent mutation
  const revokeConsentMutation = useMutation({
    mutationFn: async (consentId: string) => {
      const { data, error } = await supabase.functions.invoke('open-finance', {
        body: {
          action: 'revoke_consent',
          params: { consent_id: consentId },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Consentimento revogado');
      queryClient.invalidateQueries({ queryKey: ['open-finance-consents'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao revogar consentimento', {
        description: error.message,
      });
    },
  });

  return {
    institutions,
    consents,
    loadingInstitutions,
    loadingConsents,
    refetchInstitutions,
    refetchConsents,
    createConsent: createConsentMutation.mutate,
    creatingConsent: createConsentMutation.isPending,
    getAccounts: getAccountsMutation.mutateAsync,
    gettingAccounts: getAccountsMutation.isPending,
    getBalances: getBalancesMutation.mutateAsync,
    gettingBalances: getBalancesMutation.isPending,
    getTransactions: getTransactionsMutation.mutateAsync,
    gettingTransactions: getTransactionsMutation.isPending,
    importTransactions: importTransactionsMutation.mutateAsync,
    importingTransactions: importTransactionsMutation.isPending,
    revokeConsent: revokeConsentMutation.mutate,
    revokingConsent: revokeConsentMutation.isPending,
  };
};
