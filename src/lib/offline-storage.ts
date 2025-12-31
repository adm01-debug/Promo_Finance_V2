import Dexie, { Table } from 'dexie';

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
}

export class OfflineDB extends Dexie {
  contas_pagar!: Table<ContaPagar>;
  contas_receber!: Table<ContaReceber>;
  
  constructor() {
    super('FinanceHubDB');
    
    this.version(1).stores({
      contas_pagar: '++id, vencimento, status',
      contas_receber: '++id, vencimento, status',
    });
  }
}

export const db = new OfflineDB();
