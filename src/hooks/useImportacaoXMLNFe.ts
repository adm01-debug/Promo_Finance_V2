// HOOK: IMPORTAÇÃO XML NF-e
// Upload em lote de XMLs para lançar créditos

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { ALIQUOTAS_TRANSICAO } from '@/types/reforma-tributaria';
import { toISOLocal } from '@/lib/formatters';
import { mustSucceed } from '@/lib/supabase-write';
import type { TablesInsert } from '@/integrations/supabase/types';

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
      const itens: NFeItem[] = Array.from(itensXML).map((item) => ({
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
    } catch (error: unknown) {
      logger.error('Erro ao parsear XML:', error);
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

    const sucessos = nfes.filter((n) => n.status === 'pendente').length;
    toast.success(`${sucessos} de ${nfes.length} XMLs processados com sucesso`);
  };

  // Importar NF-es para o banco
  const importarNFes = useMutation({
    mutationFn: async (): Promise<ResultadoImportacao> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const ano = new Date().getFullYear();
      const aliquotas = ALIQUOTAS_TRANSICAO.find((a) => a.ano === ano) || ALIQUOTAS_TRANSICAO[0];

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
            .insert([
              {
                empresa_id: empresaId,
                numero: nfe.numero,
                serie: nfe.serie || '1',
                cliente_nome: nfe.nomeEmitente,
                cliente_cnpj: nfe.cnpjEmitente,
                data_emissao: toISOLocal(nfe.dataEmissao),
                valor_total: nfe.valorTotal,
                valor_produtos: nfe.valorProdutos,
                valor_icms: nfe.valorICMS,
                chave_acesso: nfe.chaveAcesso,
                natureza_operacao: nfe.naturezaOperacao || 'Compra para comercialização',
                status: 'autorizada',
                created_by: userData.user.id,
              },
            ])
            .select()
            .single();

          if (nfError) throw nfError;

          const competencia = `${nfe.dataEmissao.getFullYear()}-${String(nfe.dataEmissao.getMonth() + 1).padStart(2, '0')}`;

          // Um único insert para os dois créditos. Em chamadas separadas, o
          // IBS podia falhar depois do CBS já gravado e a nota ficava marcada
          // como erro com metade do crédito no banco. O PostgREST executa o
          // array como um comando só: ou entram os dois, ou nenhum.
          //
          // TODO(2026-08-14): campos removidos — não existem em creditos_tributarios
          // (types.ts canônico): tipo_credito, valor_base, aliquota,
          // documento_tipo/numero/chave, fornecedor_cnpj/nome, created_by
          const creditos: TablesInsert<'creditos_tributarios'>[] = [];
          const creditoBase = {
            empresa_id: empresaId,
            // `data_origem` é DATE. `toISOString()` convertia para UTC: uma nota
            // emitida à noite no fim do mês virava o dia 1º do mês seguinte,
            // divergindo do `competencia_origem` logo abaixo, que é calculado
            // com os getters locais.
            data_origem: toISOLocal(nfe.dataEmissao),
            competencia_origem: competencia,
            nota_fiscal_id: nfInserted.id,
            status: 'disponivel',
          };

          if (cbsCalculado > 0) {
            creditos.push({
              ...creditoBase,
              tipo_tributo: 'CBS',
              valor_credito: cbsCalculado,
              saldo_disponivel: cbsCalculado,
            });
          }

          if (ibsCalculado > 0) {
            creditos.push({
              ...creditoBase,
              tipo_tributo: 'IBS',
              valor_credito: ibsCalculado,
              saldo_disponivel: ibsCalculado,
            });
          }

          if (creditos.length > 0) {
            try {
              await mustSucceed(
                supabase.from('creditos_tributarios').insert(creditos).select('id'),
                'registrar os créditos de CBS/IBS da nota',
                { exigirLinhas: creditos.length }
              );
            } catch (erroCredito) {
              // A nota já está gravada e `chave_acesso` é UNIQUE: sem desfazer,
              // a reimportação bate em 23505 e a nota fica sem crédito para
              // sempre, sem caminho de recuperação pela tela.
              try {
                await mustSucceed(
                  supabase.from('notas_fiscais').delete().eq('id', nfInserted.id).select('id'),
                  'desfazer a nota fiscal cujo crédito não foi gravado',
                  { exigirLinhas: true }
                );
              } catch {
                // Falhou o crédito E falhou o rollback: a mensagem precisa
                // dizer o que ficou no banco, senão o usuário reimporta e só
                // recebe "chave duplicada".
                throw new Error(
                  `Crédito não gravado e a nota ${nfe.numero} (chave ${nfe.chaveAcesso}) ` +
                    `permaneceu no banco. Remova-a antes de reimportar. Causa: ` +
                    `${(erroCredito as Error).message}`
                );
              }
              throw erroCredito;
            }
          }

          // Os totais só sobem depois do crédito confirmado. Antes, o
          // incremento acontecia mesmo com o insert falhando em silêncio: o
          // resumo da importação anunciava crédito que não existia no banco.
          totalCBS += cbsCalculado;
          totalIBS += ibsCalculado;

          processadas[i] = { ...nfe, status: 'importado' };
          sucesso++;
        } catch (error: unknown) {
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
    },
  });

  const limparArquivos = () => {
    setArquivos([]);
    setNfesParsed([]);
    setProgresso(0);
  };

  const removerNFe = (chaveAcesso: string) => {
    setNfesParsed((prev) => prev.filter((n) => n.chaveAcesso !== chaveAcesso));
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
