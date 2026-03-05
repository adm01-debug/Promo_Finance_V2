// @ts-nocheck - Tables bank_connections/bank_transactions not yet in schema
import { supabase } from '@/integrations/supabase/client';

// Types
interface BankConnection {
  id: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'investment';
  status: 'active' | 'pending' | 'error' | 'disconnected';
  lastSync?: string;
  balance?: number;
  error?: string;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface BankTransaction {
  id: string;
  connectionId: string;
  externalId: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
  balance?: number;
  metadata?: Record<string, unknown>;
}

interface Bank {
  id: string;
  name: string;
  code: string;
  color: string;
  logo?: string;
  supportsOpenBanking: boolean;
  supportsOFX: boolean;
}

// Brazilian banks
const brazilianBanks: Bank[] = [
  { id: 'bb', name: 'Banco do Brasil', code: '001', color: '#FFED00', supportsOpenBanking: true, supportsOFX: true },
  { id: 'itau', name: 'Itaú Unibanco', code: '341', color: '#FF6600', supportsOpenBanking: true, supportsOFX: true },
  { id: 'bradesco', name: 'Bradesco', code: '237', color: '#CC092F', supportsOpenBanking: true, supportsOFX: true },
  { id: 'caixa', name: 'Caixa Econômica', code: '104', color: '#0066CC', supportsOpenBanking: true, supportsOFX: true },
  { id: 'santander', name: 'Santander', code: '033', color: '#EC0000', supportsOpenBanking: true, supportsOFX: true },
  { id: 'nubank', name: 'Nubank', code: '260', color: '#8A05BE', supportsOpenBanking: true, supportsOFX: false },
  { id: 'inter', name: 'Banco Inter', code: '077', color: '#FF7A00', supportsOpenBanking: true, supportsOFX: false },
  { id: 'c6', name: 'C6 Bank', code: '336', color: '#1A1A1A', supportsOpenBanking: true, supportsOFX: false },
  { id: 'original', name: 'Banco Original', code: '212', color: '#00A651', supportsOpenBanking: true, supportsOFX: false },
  { id: 'neon', name: 'Neon', code: '655', color: '#00E5FF', supportsOpenBanking: true, supportsOFX: false },
  { id: 'btg', name: 'BTG Pactual', code: '208', color: '#003366', supportsOpenBanking: true, supportsOFX: true },
  { id: 'safra', name: 'Banco Safra', code: '422', color: '#003399', supportsOpenBanking: true, supportsOFX: true },
];

// Bank integration service
export const bankIntegrationService = {
  // Get available banks
  getBanks(): Bank[] {
    return brazilianBanks;
  },

  // Get bank by ID
  getBank(bankId: string): Bank | undefined {
    return brazilianBanks.find((b) => b.id === bankId);
  },

  // Get bank by code
  getBankByCode(code: string): Bank | undefined {
    return brazilianBanks.find((b) => b.code === code);
  },

  // Connect to bank (simulated - would integrate with Open Banking API)
  async connectBank(
    bankId: string,
    accountNumber: string,
    accountType: BankConnection['accountType']
  ): Promise<BankConnection> {
    const bank = this.getBank(bankId);
    if (!bank) {
      throw new Error('Banco não encontrado');
    }

    const now = new Date().toISOString();
    const connection: BankConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bankId,
      bankName: bank.name,
      accountNumber,
      accountType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save to database
    const { error } = await supabase.from('bank_connections').insert({
      ...connection,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) throw error;

    return { ...connection, status: 'active' };
  },

  // Disconnect bank
  async disconnectBank(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_connections')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (error) throw error;
  },

  // Get user connections
  async getConnections(): Promise<BankConnection[]> {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Sync transactions from bank
  async syncTransactions(connectionId: string): Promise<BankTransaction[]> {
    // Get connection
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      throw new Error('Conexão não encontrada');
    }

    // Simulate fetching transactions from bank API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock transactions for demo
    const mockTransactions: BankTransaction[] = this.generateMockTransactions(connectionId);

    // Save transactions
    const { error: txError } = await supabase
      .from('bank_transactions')
      .upsert(
        mockTransactions.map((t) => ({
          ...t,
          connection_id: connectionId,
        })),
        { onConflict: 'external_id' }
      );

    if (txError) throw txError;

    // Update last sync time and balance
    const latestBalance = mockTransactions[mockTransactions.length - 1]?.balance;
    await supabase
      .from('bank_connections')
      .update({
        last_sync: new Date().toISOString(),
        balance: latestBalance,
        status: 'active',
        error: null,
      })
      .eq('id', connectionId);

    return mockTransactions;
  },

  // Generate mock transactions for demo
  generateMockTransactions(connectionId: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const now = new Date();
    let balance = 15000;

    const descriptions = {
      credit: [
        'PIX Recebido',
        'TED Recebida',
        'Salário',
        'Transferência Recebida',
        'Estorno',
        'Rendimento Poupança',
      ],
      debit: [
        'PIX Enviado',
        'Pagamento Boleto',
        'Débito Automático',
        'Compra Cartão',
        'Saque',
        'Tarifa Bancária',
      ],
    };

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // 0-3 transactions per day
      const txCount = Math.floor(Math.random() * 4);

      for (let j = 0; j < txCount; j++) {
        const isCredit = Math.random() > 0.6;
        const type = isCredit ? 'credit' : 'debit';
        const amount = Math.floor(Math.random() * 2000) + 50;

        if (type === 'credit') {
          balance += amount;
        } else {
          balance -= amount;
        }

        transactions.push({
          id: `tx-${date.getTime()}-${j}`,
          connectionId,
          externalId: `ext-${date.getTime()}-${j}-${Math.random().toString(36).substr(2, 6)}`,
          date: date.toISOString().split('T')[0],
          description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
          amount,
          type,
          balance,
        });
      }
    }

    return transactions;
  },

  // Import OFX file
  async importOFX(connectionId: string, ofxContent: string): Promise<BankTransaction[]> {
    const transactions = this.parseOFX(ofxContent);

    // Save transactions
    const { error } = await supabase
      .from('bank_transactions')
      .upsert(
        transactions.map((t) => ({
          ...t,
          connection_id: connectionId,
        })),
        { onConflict: 'external_id' }
      );

    if (error) throw error;

    // Update connection
    await supabase
      .from('bank_connections')
      .update({
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    return transactions;
  },

  // Parse OFX content
  parseOFX(content: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = transactionRegex.exec(content)) !== null) {
      const block = match[1];

      const getTag = (tag: string): string => {
        const tagMatch = block.match(new RegExp(`<${tag}>([^<\n]+)`));
        return tagMatch ? tagMatch[1].trim() : '';
      };

      const trntype = getTag('TRNTYPE');
      const dtposted = getTag('DTPOSTED');
      const trnamt = getTag('TRNAMT');
      const name = getTag('NAME') || getTag('MEMO');
      const fitid = getTag('FITID');

      if (dtposted && trnamt && fitid) {
        const amount = parseFloat(trnamt);
        const date = `${dtposted.slice(0, 4)}-${dtposted.slice(4, 6)}-${dtposted.slice(6, 8)}`;

        transactions.push({
          id: `ofx-${fitid}`,
          connectionId: '',
          externalId: fitid,
          date,
          description: name || 'Sem descrição',
          amount: Math.abs(amount),
          type: amount < 0 || trntype === 'DEBIT' ? 'debit' : 'credit',
        });
      }
    }

    return transactions;
  },

  // Get transactions for a connection
  async getTransactions(
    connectionId: string,
    startDate?: string,
    endDate?: string
  ): Promise<BankTransaction[]> {
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('connection_id', connectionId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  },

  // Categorize transaction automatically
  categorizeTransaction(description: string): string | null {
    const categories: Record<string, string[]> = {
      alimentacao: ['restaurante', 'lanche', 'ifood', 'rappi', 'uber eats', 'supermercado', 'mercado'],
      transporte: ['uber', '99', 'combustível', 'gasolina', 'estacionamento', 'pedagio'],
      moradia: ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'gas', 'internet'],
      saude: ['farmacia', 'hospital', 'medico', 'clinica', 'plano de saude'],
      educacao: ['escola', 'faculdade', 'curso', 'livro', 'material escolar'],
      lazer: ['cinema', 'show', 'netflix', 'spotify', 'prime video', 'disney'],
      salario: ['salario', 'folha', 'pagamento', 'remuneracao'],
      transferencia: ['pix', 'ted', 'doc', 'transferencia'],
    };

    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
        return category;
      }
    }

    return null;
  },

  // Get account summary
  async getAccountSummary(connectionId: string): Promise<{
    balance: number;
    income: number;
    expenses: number;
    transactionCount: number;
  }> {
    const transactions = await this.getTransactions(connectionId);

    const income = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastTransaction = transactions[0];
    const balance = lastTransaction?.balance || income - expenses;

    return {
      balance,
      income,
      expenses,
      transactionCount: transactions.length,
    };
  },
};

export type { BankConnection, BankTransaction, Bank };
export { brazilianBanks };
export default bankIntegrationService;
