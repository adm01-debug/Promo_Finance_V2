/**
 * Bitrix24 Integration Service
 * Handles all interactions with the Bitrix24 CRM platform
 */

const BITRIX24_WEBHOOK_URL = import.meta.env.VITE_BITRIX24_WEBHOOK_URL || '';

export interface BitrixContact {
  ID?: string;
  NAME: string;
  LAST_NAME?: string;
  EMAIL?: { VALUE: string; VALUE_TYPE: string }[];
  PHONE?: { VALUE: string; VALUE_TYPE: string }[];
  COMPANY_ID?: string;
  TYPE_ID?: string;
  SOURCE_ID?: string;
  COMMENTS?: string;
}

export interface BitrixCompany {
  ID?: string;
  TITLE: string;
  COMPANY_TYPE?: string;
  INDUSTRY?: string;
  EMAIL?: { VALUE: string; VALUE_TYPE: string }[];
  PHONE?: { VALUE: string; VALUE_TYPE: string }[];
  ADDRESS?: string;
  ADDRESS_CITY?: string;
  ADDRESS_REGION?: string;
  ADDRESS_POSTAL_CODE?: string;
  COMMENTS?: string;
}

export interface BitrixDeal {
  ID?: string;
  TITLE: string;
  TYPE_ID?: string;
  STAGE_ID?: string;
  PROBABILITY?: number;
  CURRENCY_ID?: string;
  OPPORTUNITY?: number;
  COMPANY_ID?: string;
  CONTACT_ID?: string;
  COMMENTS?: string;
  CLOSEDATE?: string;
  ASSIGNED_BY_ID?: string;
}

export interface BitrixLead {
  ID?: string;
  TITLE: string;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: { VALUE: string; VALUE_TYPE: string }[];
  PHONE?: { VALUE: string; VALUE_TYPE: string }[];
  STATUS_ID?: string;
  SOURCE_ID?: string;
  COMMENTS?: string;
}

class Bitrix24Service {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = BITRIX24_WEBHOOK_URL;
  }

  /**
   * Check if Bitrix24 integration is configured
   */
  isConfigured(): boolean {
    return !!this.webhookUrl;
  }

  /**
   * Make API call to Bitrix24
   */
  private async callMethod<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Bitrix24 integration not configured');
    }

    const url = `${this.webhookUrl}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Bitrix24 API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Bitrix24 error: ${data.error_description || data.error}`);
      }

      return data.result as T;
    } catch (error) {
      console.error('Bitrix24 API call failed:', error);
      throw error;
    }
  }

  // ============================================
  // CONTACTS
  // ============================================

  /**
   * Get all contacts
   */
  async getContacts(filter?: Record<string, unknown>): Promise<BitrixContact[]> {
    return this.callMethod<BitrixContact[]>('crm.contact.list', {
      filter,
      select: ['*', 'EMAIL', 'PHONE'],
    });
  }

  /**
   * Get contact by ID
   */
  async getContact(id: string): Promise<BitrixContact> {
    return this.callMethod<BitrixContact>('crm.contact.get', { id });
  }

  /**
   * Create a new contact
   */
  async createContact(contact: BitrixContact): Promise<string> {
    return this.callMethod<string>('crm.contact.add', { fields: contact });
  }

  /**
   * Update a contact
   */
  async updateContact(id: string, contact: Partial<BitrixContact>): Promise<boolean> {
    return this.callMethod<boolean>('crm.contact.update', { id, fields: contact });
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<boolean> {
    return this.callMethod<boolean>('crm.contact.delete', { id });
  }

  // ============================================
  // COMPANIES
  // ============================================

  /**
   * Get all companies
   */
  async getCompanies(filter?: Record<string, unknown>): Promise<BitrixCompany[]> {
    return this.callMethod<BitrixCompany[]>('crm.company.list', {
      filter,
      select: ['*', 'EMAIL', 'PHONE'],
    });
  }

  /**
   * Get company by ID
   */
  async getCompany(id: string): Promise<BitrixCompany> {
    return this.callMethod<BitrixCompany>('crm.company.get', { id });
  }

  /**
   * Create a new company
   */
  async createCompany(company: BitrixCompany): Promise<string> {
    return this.callMethod<string>('crm.company.add', { fields: company });
  }

  /**
   * Update a company
   */
  async updateCompany(id: string, company: Partial<BitrixCompany>): Promise<boolean> {
    return this.callMethod<boolean>('crm.company.update', { id, fields: company });
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<boolean> {
    return this.callMethod<boolean>('crm.company.delete', { id });
  }

  // ============================================
  // DEALS
  // ============================================

  /**
   * Get all deals
   */
  async getDeals(filter?: Record<string, unknown>): Promise<BitrixDeal[]> {
    return this.callMethod<BitrixDeal[]>('crm.deal.list', { filter });
  }

  /**
   * Get deal by ID
   */
  async getDeal(id: string): Promise<BitrixDeal> {
    return this.callMethod<BitrixDeal>('crm.deal.get', { id });
  }

  /**
   * Create a new deal
   */
  async createDeal(deal: BitrixDeal): Promise<string> {
    return this.callMethod<string>('crm.deal.add', { fields: deal });
  }

  /**
   * Update a deal
   */
  async updateDeal(id: string, deal: Partial<BitrixDeal>): Promise<boolean> {
    return this.callMethod<boolean>('crm.deal.update', { id, fields: deal });
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<boolean> {
    return this.callMethod<boolean>('crm.deal.delete', { id });
  }

  // ============================================
  // LEADS
  // ============================================

  /**
   * Get all leads
   */
  async getLeads(filter?: Record<string, unknown>): Promise<BitrixLead[]> {
    return this.callMethod<BitrixLead[]>('crm.lead.list', {
      filter,
      select: ['*', 'EMAIL', 'PHONE'],
    });
  }

  /**
   * Get lead by ID
   */
  async getLead(id: string): Promise<BitrixLead> {
    return this.callMethod<BitrixLead>('crm.lead.get', { id });
  }

  /**
   * Create a new lead
   */
  async createLead(lead: BitrixLead): Promise<string> {
    return this.callMethod<string>('crm.lead.add', { fields: lead });
  }

  /**
   * Update a lead
   */
  async updateLead(id: string, lead: Partial<BitrixLead>): Promise<boolean> {
    return this.callMethod<boolean>('crm.lead.update', { id, fields: lead });
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<boolean> {
    return this.callMethod<boolean>('crm.lead.delete', { id });
  }

  // ============================================
  // SYNC HELPERS
  // ============================================

  /**
   * Convert Promo Finance cliente to Bitrix contact
   */
  clienteToBitrixContact(cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    observacoes?: string;
    tipo?: 'PF' | 'PJ';
  }): BitrixContact {
    const [firstName, ...lastNameParts] = cliente.nome.split(' ');
    
    return {
      NAME: firstName,
      LAST_NAME: lastNameParts.join(' ') || undefined,
      EMAIL: cliente.email ? [{ VALUE: cliente.email, VALUE_TYPE: 'WORK' }] : undefined,
      PHONE: cliente.telefone ? [{ VALUE: cliente.telefone, VALUE_TYPE: 'WORK' }] : undefined,
      COMMENTS: cliente.observacoes,
      TYPE_ID: cliente.tipo === 'PJ' ? 'CLIENT' : 'CLIENT',
    };
  }

  /**
   * Convert Promo Finance fornecedor to Bitrix company
   */
  fornecedorToBitrixCompany(fornecedor: {
    razao_social: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    categoria?: string;
    observacoes?: string;
  }): BitrixCompany {
    return {
      TITLE: fornecedor.razao_social,
      EMAIL: fornecedor.email ? [{ VALUE: fornecedor.email, VALUE_TYPE: 'WORK' }] : undefined,
      PHONE: fornecedor.telefone ? [{ VALUE: fornecedor.telefone, VALUE_TYPE: 'WORK' }] : undefined,
      ADDRESS: fornecedor.endereco,
      ADDRESS_CITY: fornecedor.cidade,
      ADDRESS_REGION: fornecedor.estado,
      ADDRESS_POSTAL_CODE: fornecedor.cep,
      INDUSTRY: fornecedor.categoria,
      COMMENTS: fornecedor.observacoes,
      COMPANY_TYPE: 'SUPPLIER',
    };
  }

  /**
   * Convert Promo Finance conta a pagar to Bitrix deal
   */
  contaPagarToBitrixDeal(conta: {
    descricao: string;
    valor: number;
    data_vencimento: string;
    fornecedor_id?: string;
    observacoes?: string;
  }, companyId?: string): BitrixDeal {
    return {
      TITLE: `Conta a Pagar: ${conta.descricao}`,
      OPPORTUNITY: conta.valor,
      CURRENCY_ID: 'BRL',
      CLOSEDATE: conta.data_vencimento,
      COMPANY_ID: companyId,
      COMMENTS: conta.observacoes,
      TYPE_ID: 'GOODS',
      STAGE_ID: 'PREPARATION',
    };
  }

  /**
   * Sync cliente to Bitrix24
   */
  async syncCliente(cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    observacoes?: string;
    tipo?: 'PF' | 'PJ';
    bitrix_id?: string;
  }): Promise<string> {
    const contact = this.clienteToBitrixContact(cliente);

    if (cliente.bitrix_id) {
      await this.updateContact(cliente.bitrix_id, contact);
      return cliente.bitrix_id;
    } else {
      return this.createContact(contact);
    }
  }

  /**
   * Sync fornecedor to Bitrix24
   */
  async syncFornecedor(fornecedor: {
    razao_social: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    categoria?: string;
    observacoes?: string;
    bitrix_id?: string;
  }): Promise<string> {
    const company = this.fornecedorToBitrixCompany(fornecedor);

    if (fornecedor.bitrix_id) {
      await this.updateCompany(fornecedor.bitrix_id, company);
      return fornecedor.bitrix_id;
    } else {
      return this.createCompany(company);
    }
  }
}

export const bitrix24Service = new Bitrix24Service();

export default bitrix24Service;
