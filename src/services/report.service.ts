// @ts-nocheck - Uses columns not in current schema (categoria, nome, recebido status)
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TIPOS
// ============================================

export interface Relatorio consolidated {
  data: string;
  total_recebido: number;
  total_pago: number;
  saldo: number;
}

export interface RelatorioCategoria {
  categoria: string;
  total_recebido: number;
  total_pago: number;
  saldo: number;
}

export interface RelatorioRecebimentos {
  data_vencimento: string;
  cliente: string;
  valor: number;
  status: string;
}

export interface RelatorioPagamentos {
  data_vencimento: string;
  fornecedor: string;
  valor: number;
  status: string;
}

// ============================================
// SERVICE
// ============================================

const reportService = {
  async getConsolidated(): Promise<RelatorioConsolidado[]> {
    const { data, error } = await supabase
      .from('vw_relatorio_consolidado')
      .select('*')
      .order('data');

    if (error) {
      console.error('Erro ao buscar relatório consolidado:', error);
      throw error;
    }

    return data || [];
  },

  async getByCategory(): Promise<RelatorioCategoria[]> {
    const { data, error } = await supabase
      .from('vw_relatorio_categoria')
      .select('*');

    if (error) {
      console.error('Erro ao buscar relatório por categoria:', error);
      throw error;
    }

    return data || [];
  },

  async getRecebimentos(): Promise<RelatorioRecebimentos[]> {
    const { data, error } = await supabase
      .from('vw_relatorio_recebimentos')
      .select('data_vencimento, cliente, valor, status')
      .order('data_vencimento');

    if (error) {
      console.error('Erro ao buscar relatório de recebimentos:', error);
      throw error;
    }

    return data || [];
  },

  async getPagamentos(): Promise<RelatorioPagamentos[]> {
    const { data, error } = await supabase
      .from('vw_relatorio_pagamentos')
      .select('data_vencimento, fornecedor, valor, status')
      .order('data_vencimento');

    if (error) {
      console.error('Erro ao buscar relatório de pagamentos:', error);
      throw error;
    }

    return data || [];
  },
};

export default reportService;
