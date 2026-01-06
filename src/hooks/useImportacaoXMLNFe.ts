// ============================================
// HOOK: IMPORTAÇÃO XML NF-e
// Upload em lote de XMLs para lançar créditos
// ============================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ALIQUOTAS_TRANSICAO } from '@/types/reforma-tributaria';

export interface NFeParsed {
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: Date;
  cnpjEmitente: string;
  nomeEmitente: string;
  cnpjDestinatario: string;
  valorTotal: number;
  valorProdutos: number;
  valorServicos: number;
  baseCalculoICMS: number;
  valorICMS: number;
  baseCalculoIPI?: number;
  valorIPI?: number;
  valorPIS?: number;
  valorCOFINS?: number;
  cfop: string;
  naturezaOperacao: string;
  itens: NFeItem[];
  status: 'pendente' | 'importado' | 'erro';
  mensagemErro?: string;
}

export interface NFeItem {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorICMS?: number;
  valorIPI?: number;
  valorPIS?: number;
  valorCOFINS?: number;
}

export interface ResultadoImportacao {
  total: number;
  sucesso: number;
  erros: number;
  creditosGerados: {
    cbs: number;
    ibs: number;
    total: number;
  };
  nfesProcessadas: NFeParsed[];
}

export function useImportacaoXMLNFe(empresaId: string) {
  const queryClient = useQueryClient();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [nfesParsed, setNfesParsed] = useState<NFeParsed[]>([]);
  const [isProcessando, setIsProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  // Parser de XML NF-e
  const parseXML = (xmlContent: string): NFeParsed | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'text/xml');

      const nfe = doc.querySelector('NFe, nfeProc');
      if (!nfe) {
        throw new Error('XML não é uma NF-e válida');
      }

      const infNFe = doc.querySelector('infNFe');
      const ide = doc.querySelector('ide');
      const emit = doc.querySelector('emit');
      const dest = doc.querySelector('dest');
      const total = doc.querySelector('total ICMSTot');

      const chaveAcesso = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';
      const numero = ide?.querySelector('nNF')?.textContent || '';
      const serie = ide?.querySelector('serie')?.textContent || '';
      const dataEmissao = new Date(ide?.querySelector('dhEmi')?.textContent || '');
      const cnpjEmitente = emit?.querySelector('CNPJ')?.textContent || '';
      const nomeEmitente = emit?.querySelector('xNome')?.textContent || '';
      const cnpjDestinatario = dest?.querySelector('CNPJ')?.textContent || '';

      const valorTotal = parseFloat(total?.querySelector('vNF')?.textContent || '0');
      const valorProdutos = parseFloat(total?.querySelector('vProd')?.textContent || '0');
      const baseCalculoICMS = parseFloat(total?.querySelector('vBC')?.textContent || '0');
      const valorICMS = parseFloat(total?.querySelector('vICMS')?.textContent || '0');
      const valorPIS = parseFloat(total?.querySelector('vPIS')?.textContent || '0');
      const valorCOFINS = parseFloat(total?.querySelector('vCOFINS')?.textContent || '0');

      const itensXML = doc.querySelectorAll('det');
      const itens: NFeItem[] = Array.from(itensXML).map(item => ({
        codigo: item.querySelector('prod cProd')?.textContent || '',
        descricao: item.querySelector('prod xProd')?.textContent || '',
        ncm: item.querySelector('prod NCM')?.textContent || '',
        cfop: item.querySelector('prod CFOP')?.textContent || '',
        quantidade: parseFloat(item.querySelector('prod qCom')?.textContent || '0'),
        valorUnitario: parseFloat(item.querySelector('prod vUnCom')?.textContent || '0'),
        valorTotal: parseFloat(item.querySelector('prod vProd')?.textContent || '0'),
        valorICMS: parseFloat(item.querySelector('imposto ICMS vICMS')?.textContent || '0'),
        valorPIS: parseFloat(item.querySelector('imposto PIS vPIS')?.textContent || '0'),
        valorCOFINS: parseFloat(item.querySelector('imposto COFINS vCOFINS')?.textContent || '0'),
      }));

      const cfop = itens[0]?.cfop || '';
      const naturezaOperacao = ide?.querySelector('natOp')?.textContent || '';

      return {
        chaveAcesso,
        numero,
        serie,
        dataEmissao,
        cnpjEmitente,
        nomeEmitente,
        cnpjDestinatario,
        valorTotal,
        valorProdutos,
        valorServicos: 0,
        baseCalculoICMS,
        valorICMS,
        valorPIS,
        valorCOFINS,
        cfop,
        naturezaOperacao,
        itens,
        status: 'pendente',
      };
    } catch (error) {
      console.error('Erro ao parsear XML:', error);
      return null;
    }
  };

  // Processar arquivos selecionados
  const processarArquivos = async (files: FileList | File[]) => {
    setIsProcessando(true);
    setProgresso(0);
    const fileArray = Array.from(files);
    setArquivos(fileArray);
    
    const nfes: NFeParsed[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const content = await file.text();
        const nfe = parseXML(content);
        
        if (nfe) {
          nfes.push(nfe);
        } else {
          nfes.push({
            chaveAcesso: '',
            numero: file.name,
            serie: '',
            dataEmissao: new Date(),
            cnpjEmitente: '',
            nomeEmitente: '',
            cnpjDestinatario: '',
            valorTotal: 0,
            valorProdutos: 0,
            valorServicos: 0,
            baseCalculoICMS: 0,
            valorICMS: 0,
            cfop: '',
            naturezaOperacao: '',
            itens: [],
            status: 'erro',
            mensagemErro: 'Erro ao processar arquivo XML',
          });
        }
      } catch {
        nfes.push({
          chaveAcesso: '',
          numero: file.name,
          serie: '',
          dataEmissao: new Date(),
          cnpjEmitente: '',
          nomeEmitente: '',
          cnpjDestinatario: '',
          valorTotal: 0,
          valorProdutos: 0,
          valorServicos: 0,
          baseCalculoICMS: 0,
          valorICMS: 0,
          cfop: '',
          naturezaOperacao: '',
          itens: [],
          status: 'erro',
          mensagemErro: 'Arquivo inválido',
        });
      }
      
      setProgresso(((i + 1) / fileArray.length) * 100);
    }
    
    setNfesParsed(nfes);
    setIsProcessando(false);
    
    const sucessos = nfes.filter(n => n.status === 'pendente').length;
    toast.success(`${sucessos} de ${nfes.length} XMLs processados com sucesso`);
  };

  // Importar NF-es para o banco
  const importarNFes = useMutation({
    mutationFn: async (): Promise<ResultadoImportacao> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const ano = new Date().getFullYear();
      const aliquotas = ALIQUOTAS_TRANSICAO.find(a => a.ano === ano) || ALIQUOTAS_TRANSICAO[0];
      
      let sucesso = 0;
      let erros = 0;
      let totalCBS = 0;
      let totalIBS = 0;
      const processadas = [...nfesParsed];

      for (let i = 0; i < processadas.length; i++) {
        const nfe = processadas[i];
        if (nfe.status === 'erro') {
          erros++;
          continue;
        }

        try {
          const cbsCalculado = nfe.valorProdutos * (aliquotas.cbs / 100);
          const ibsCalculado = nfe.valorProdutos * (aliquotas.ibs / 100);

          const { data: nfInserted, error: nfError } = await supabase
            .from('notas_fiscais')
            .insert([{
              empresa_id: empresaId,
              numero: nfe.numero,
              serie: nfe.serie,
              cliente_nome: nfe.nomeEmitente,
              cliente_cnpj: nfe.cnpjEmitente,
              data_emissao: nfe.dataEmissao.toISOString().split('T')[0],
              valor_total: nfe.valorTotal,
              valor_produtos: nfe.valorProdutos,
              base_calculo_icms: nfe.baseCalculoICMS,
              valor_icms: nfe.valorICMS,
              chave_acesso: nfe.chaveAcesso,
              status: 'autorizada',
              created_by: userData.user.id,
            }])
            .select()
            .single();

          if (nfError) throw nfError;

          const competencia = `${nfe.dataEmissao.getFullYear()}-${String(nfe.dataEmissao.getMonth() + 1).padStart(2, '0')}`;

          if (cbsCalculado > 0) {
            await supabase.from('creditos_tributarios').insert({
              empresa_id: empresaId,
              tipo_tributo: 'CBS',
              tipo_credito: 'normal',
              valor_base: nfe.valorProdutos,
              valor_credito: cbsCalculado,
              saldo_disponivel: cbsCalculado,
              aliquota: aliquotas.cbs,
              data_origem: nfe.dataEmissao.toISOString(),
              competencia_origem: competencia,
              nota_fiscal_id: nfInserted.id,
              documento_tipo: 'NFE',
              documento_numero: nfe.numero,
              documento_chave: nfe.chaveAcesso,
              fornecedor_cnpj: nfe.cnpjEmitente,
              fornecedor_nome: nfe.nomeEmitente,
              status: 'disponivel',
              created_by: userData.user.id,
            });
            totalCBS += cbsCalculado;
          }

          if (ibsCalculado > 0) {
            await supabase.from('creditos_tributarios').insert({
              empresa_id: empresaId,
              tipo_tributo: 'IBS',
              tipo_credito: 'normal',
              valor_base: nfe.valorProdutos,
              valor_credito: ibsCalculado,
              saldo_disponivel: ibsCalculado,
              aliquota: aliquotas.ibs,
              data_origem: nfe.dataEmissao.toISOString(),
              competencia_origem: competencia,
              nota_fiscal_id: nfInserted.id,
              documento_tipo: 'NFE',
              documento_numero: nfe.numero,
              documento_chave: nfe.chaveAcesso,
              fornecedor_cnpj: nfe.cnpjEmitente,
              fornecedor_nome: nfe.nomeEmitente,
              status: 'disponivel',
              created_by: userData.user.id,
            });
            totalIBS += ibsCalculado;
          }

          processadas[i] = { ...nfe, status: 'importado' };
          sucesso++;
        } catch (error) {
          processadas[i] = { ...nfe, status: 'erro', mensagemErro: (error as Error).message };
          erros++;
        }
      }

      setNfesParsed(processadas);

      return {
        total: processadas.length,
        sucesso,
        erros,
        creditosGerados: {
          cbs: totalCBS,
          ibs: totalIBS,
          total: totalCBS + totalIBS,
        },
        nfesProcessadas: processadas,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      queryClient.invalidateQueries({ queryKey: ['creditos-tributarios'] });
      toast.success(
        `${result.sucesso} NF-e importadas. Créditos: R$ ${result.creditosGerados.total.toFixed(2)}`
      );
    },
    onError: (error: Error) => {
      toast.error('Erro na importação: ' + error.message);
    }
  });

  const limparArquivos = () => {
    setArquivos([]);
    setNfesParsed([]);
    setProgresso(0);
  };

  const removerNFe = (chaveAcesso: string) => {
    setNfesParsed(prev => prev.filter(n => n.chaveAcesso !== chaveAcesso));
  };

  return {
    arquivos,
    nfesParsed,
    isProcessando,
    progresso,
    processarArquivos,
    importarNFes,
    limparArquivos,
    removerNFe,
  };
}

export default useImportacaoXMLNFe;
