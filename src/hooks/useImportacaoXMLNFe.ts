// HOOK: IMPORTAÇÃO XML NF-e
// Upload em lote de XMLs para lançar créditos

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CHAVE_QUERY_NOTAS } from '@/hooks/useNotasFiscaisLocais';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { ALIQUOTAS_TRANSICAO } from '@/types/reforma-tributaria';
import { mustSucceed } from '@/lib/supabase-write';
import { buscarReferenciasFiscais } from '@/lib/tributario/catalogos/cclasstrib';
import { validarItensFiscais, type DivergenciaFiscal } from '@/lib/tributario/validador-ncm-cst';
import {
  parseItemIbscbs,
  parseItemIs,
  parseIbscbsTotais,
  type NFeIbscbsGrupo,
  type NFeIsGrupo,
  type NFeIbscbsTotais,
} from '@/lib/nfe/parse-ibscbs';

/** Fuso civil brasileiro usado para ler a data declarada na NF-e. */
export const FUSO_PADRAO_BR = 'America/Sao_Paulo';

/**
 * Primeiro ano com crédito apropriável de IBS/CBS (LC 214/2025, art. 128 do
 * ADCT): 2026 é ano de teste, com destaque apenas informativo.
 */
export const ANO_INICIO_APROPRIACAO = 2027;

export interface NFeParsed {
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: Date;
  /**
   * Data civil declarada no próprio `dhEmi` (`YYYY-MM-DD`), sem conversão de
   * fuso. `dataEmissao` é o instante; esta é a data que o emitente escreveu e é
   * a que decide a vigência dos catálogos: uma nota de Manaus (`-04:00`) às
   * 23:30 pertence ao dia declarado, não ao dia seguinte em Brasília.
   */
  dataEmissaoDeclarada?: string;
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
  /** Grupo IBS/CBS/IS por item (etapa 41): presente quando o XML traz o grupo. */
  ibscbs?: NFeIbscbsTotais;
  status: 'pendente' | 'importado' | 'erro';
  mensagemErro?: string;
  /**
   * Divergências entre o que a nota declarou e os catálogos oficiais
   * (etapa 46). É alerta: a nota é importada mesmo assim.
   */
  alertasFiscais?: DivergenciaFiscal[];
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
  /** Grupo IBS/CBS do item (etapa 41). */
  ibscbs?: NFeIbscbsGrupo;
  /** Grupo IS do item (etapa 41). */
  is?: NFeIsGrupo;
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
  /** Parcela dos créditos que veio do grupo IBS/CBS destacado na nota. */
  creditosDoXml: {
    cbs: number;
    ibs: number;
    total: number;
  };
  /** NF-e sem grupo IBS/CBS que caíram na estimativa por alíquota. */
  notasEstimadas: number;
  /** NF-e monofásicas (destaque em `gMono`), sem crédito regular. */
  notasMonofasicas: number;
  /** NF-e com pelo menos uma divergência contra os catálogos (etapa 46). */
  notasComAlertaFiscal: number;
  nfesProcessadas: NFeParsed[];
}

/**
 * Ano civil de emissão da NF-e.
 *
 * `dhEmi` traz o fuso do emitente (`-03:00` em quase todo o país). `new
 * Date(...)` vira um instante e `getFullYear()` responde no fuso do navegador:
 * uma nota emitida às 22h de 31/12 em Brasília é 01/01 em UTC, e o crédito
 * caía no exercício seguinte. Lendo o fuso do próprio documento, o ano é o da
 * data civil que o emitente declarou.
 */
export const anoEmissao = (data: Date): number =>
  Number(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_PADRAO_BR,
      year: 'numeric',
    }).format(data)
  );

/** Mês civil (1-12) de emissão da NF-e, no fuso da nota. Ver `anoEmissao`. */
const mesEmissao = (data: Date): number =>
  Number(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_PADRAO_BR,
      month: 'numeric',
    }).format(data)
  );

/**
 * Data civil de emissão em `YYYY-MM-DD`, no fuso da nota.
 *
 * `toISOLocal` usa o fuso do navegador; aqui a data tem de ser a mesma que
 * originou `competencia_origem`, senão uma nota de 31/03 às 22:30 grava
 * `data_origem` em abril e `competencia_origem` em março.
 */
export const dataEmissaoISO = (data: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_PADRAO_BR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);

/**
 * Data civil usada para escolher a vigência do catálogo: a declarada no XML,
 * com fallback para a conversão de fuso. Só a conferência fiscal usa este
 * valor; `data_origem` e `competencia_origem` seguem a data em Brasília.
 */
const dataVigenciaNota = (nota: { dataEmissao: Date; dataEmissaoDeclarada?: string }): string =>
  nota.dataEmissaoDeclarada ?? dataEmissaoISO(nota.dataEmissao);

/**
 * Data civil da nota em `DD/MM/AAAA` para os relatórios: o dia declarado no XML
 * quando existe — o mesmo que escolhe a vigência dos catálogos —, senão o dia
 * em Brasília. Sem isso o PDF atribui o alerta a outro dia que a conferência.
 */
export const dataNotaBr = (nota: { dataEmissao: Date; dataEmissaoDeclarada?: string }): string =>
  dataVigenciaNota(nota).split('-').reverse().join('/');

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
      const dhEmi = ide?.querySelector('dhEmi')?.textContent || '';
      const dataEmissao = new Date(dhEmi);
      // Data inválida vira Invalid Date e só estoura na tela, dentro de
      // format(), derrubando a prévia do lote inteiro. Falhar aqui marca a nota
      // como erro e preserva as demais.
      if (Number.isNaN(dataEmissao.getTime())) {
        throw new Error('Data de emissão (dhEmi) ausente ou inválida');
      }
      // Lido do texto, antes de qualquer conversão: `dhEmi` carrega o offset do
      // emitente, e o dia civil declarado não é necessariamente o dia civil de
      // Brasília. É esta a data usada na vigência dos catálogos.
      const dataEmissaoDeclarada = /^\d{4}-\d{2}-\d{2}/.test(dhEmi)
        ? dhEmi.slice(0, 10)
        : undefined;
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
      const itens: NFeItem[] = Array.from(itensXML).map((item) => {
        const ibscbs = parseItemIbscbs(item);
        const is = parseItemIs(item);
        const nfeItem: NFeItem = {
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
        };
        if (ibscbs) nfeItem.ibscbs = ibscbs;
        if (is) nfeItem.is = is;
        return nfeItem;
      });

      const ibscbsTotais = infNFe ? parseIbscbsTotais(infNFe) : undefined;

      const cfop = itens[0]?.cfop || '';
      const naturezaOperacao = ide?.querySelector('natOp')?.textContent || '';

      return {
        chaveAcesso,
        numero,
        serie,
        dataEmissao,
        dataEmissaoDeclarada,
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
        ibscbs: ibscbsTotais,
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

      let sucesso = 0;
      let erros = 0;
      let totalCBS = 0;
      let totalIBS = 0;
      let cbssDoXml = 0;
      let ibsDoXml = 0;
      let notasEstimadas = 0;
      let notasMonofasicas = 0;
      let notasComAlertaFiscal = 0;
      const processadas = [...nfesParsed];

      // Etapa 46: uma leitura de catálogo por data civil de emissão presente no
      // lote, e só dos códigos daquela data. Os catálogos são versionados por
      // inicio_vigencia/fim_vigencia: consultar uma vez com a data do relógio
      // validaria nota de 2025 contra a tabela de 2027.
      //
      // Antes o recorte era 31/12 do exercício. Com o catálogo de NCM vazio isso
      // era inofensivo, mas a carga da etapa 80 grava `fim_vigencia` no meio do
      // ano: um NCM vigente em março e encerrado em setembro recebia REG-012 ao
      // ser importado, porque não constava no recorte de dezembro. Agrupar pela
      // data da nota custa 3 consultas por data distinta do lote (não por nota)
      // e acerta a vigência de cada documento.
      const referenciasPorData = new Map<
        string,
        Awaited<ReturnType<typeof buscarReferenciasFiscais>>
      >();
      for (const n of processadas) {
        if (n.status === 'erro') continue;
        const dataRef = dataVigenciaNota(n);
        if (referenciasPorData.has(dataRef)) continue;
        const doDia = processadas.filter(
          (o) => o.status !== 'erro' && dataVigenciaNota(o) === dataRef
        );
        referenciasPorData.set(
          dataRef,
          await buscarReferenciasFiscais(
            doDia.flatMap((o) => o.itens.map((i) => i.ibscbs?.cClassTrib ?? '')),
            doDia.flatMap((o) => o.itens.map((i) => i.ncm)),
            dataRef
          )
        );
      }

      for (let i = 0; i < processadas.length; i++) {
        const nfe = processadas[i];
        if (nfe.status === 'erro') {
          erros++;
          continue;
        }

        try {
          // Etapa 43: o crédito vem do que a nota destacou (`total/IBSCBSTot`),
          // não de uma estimativa pelo ano corrente. `new Date().getFullYear()`
          // usava o ano do relógio: reimportar em janeiro uma nota de dezembro
          // creditava pela alíquota do ano novo, e o valor nunca batia com o
          // documento fiscal. A alíquota de fallback é a do **ano de emissão**
          // da nota (`anoFatoGerador`), não a do relógio.
          //
          // `parseIbscbsTotais` sempre devolve um objeto (com campos
          // `undefined` quando o grupo não existe), então a presença do grupo é
          // o valor numérico, não a existência do objeto.
          const anoFatoGerador = anoEmissao(nfe.dataEmissao);
          const aliquotasNota =
            ALIQUOTAS_TRANSICAO.find((a) => a.ano === anoFatoGerador) || ALIQUOTAS_TRANSICAO[0];

          const vCBS = nfe.ibscbs?.vCBS;
          const vIBS = nfe.ibscbs?.vIBS;
          const temGrupo = vCBS !== undefined || vIBS !== undefined;
          // Nota monofásica destaca IBS/CBS em `gMono`, não em `gIBS`/`gCBS`.
          // O valor existe, mas está fora do regime regular: não é crédito
          // apropriável e estimar por cima inventaria crédito.
          const temMono =
            nfe.ibscbs?.vTotIBSMono !== undefined || nfe.ibscbs?.vTotCBSMono !== undefined;
          const cbsCalculado =
            vCBS ?? (temGrupo || temMono ? 0 : nfe.valorProdutos * (aliquotasNota.cbs / 100));
          const ibsCalculado =
            vIBS ?? (temGrupo || temMono ? 0 : nfe.valorProdutos * (aliquotasNota.ibs / 100));

          const competencia = `${anoFatoGerador}-${String(mesEmissao(nfe.dataEmissao)).padStart(2, '0')}`;

          // Nota e créditos numa transação só. Antes eram duas requisições, e
          // o PostgREST abre uma transação por requisição: se o insert dos
          // créditos falhasse, a nota já estava gravada e `chave_acesso` é
          // UNIQUE — a reimportação batia em 23505 e a nota ficava sem crédito
          // para sempre. Havia um delete compensatório para isso, que por sua
          // vez também podia falhar. Com a função, falhar no crédito desfaz a
          // nota pelo próprio ROLLBACK: não existe estado intermediário a
          // compensar, nem mensagem de "remova manualmente".
          //
          // A função valida cada chave do payload contra
          // `information_schema.columns` e levanta
          // `colunas_inexistentes_em_notas_fiscais` — deriva de schema falha
          // alto em vez de descartar o campo em silêncio.
          const creditos: Array<{
            tipo_tributo: string;
            valor_credito: number;
            saldo_disponivel: number;
            data_origem: string;
            competencia_origem: string;
            status: string;
            origem: 'xml_destacado' | 'estimado';
            efeito_tributario: boolean;
            ano_fato_gerador: number;
          }> = [];

          // Etapa 44: 2026 é ano de teste — o valor é destacado, mas o crédito
          // é apenas informativo (`efeito_tributario=false`). Só a partir de
          // 2027 o crédito com XML destacado é apropriável. Estimado nunca é
          // apropriável em ano nenhum: a etapa 44/88 exige
          // `efeito_tributario=true` **E** `origem='xml_destacado'`.
          const efeitoTributario = temGrupo && anoFatoGerador >= ANO_INICIO_APROPRIACAO;

          // `saldo_disponivel` do informativo é 0: o CHECK de `status` só aceita
          // os valores de sempre (`disponivel`, `utilizado`, ...), então o
          // discriminador é `efeito_tributario`, não um status novo. Zerar o
          // saldo impede que um consumidor antigo gaste crédito informativo.
          const saldoCBS = efeitoTributario ? cbsCalculado : 0;
          const saldoIBS = efeitoTributario ? ibsCalculado : 0;

          // `data_origem` é DATE. `toISOString()` convertia para UTC: uma nota
          // emitida à noite no fim do mês virava o dia 1º do mês seguinte,
          // divergindo do `competencia_origem` logo acima, que usa os getters
          // locais.
          const creditoBase = {
            data_origem: dataEmissaoISO(nfe.dataEmissao),
            competencia_origem: competencia,
            status: 'disponivel',
            origem: (temGrupo ? 'xml_destacado' : 'estimado') as 'xml_destacado' | 'estimado',
            efeito_tributario: efeitoTributario,
            ano_fato_gerador: anoFatoGerador,
          };

          if (cbsCalculado > 0) {
            creditos.push({
              ...creditoBase,
              tipo_tributo: 'CBS',
              valor_credito: cbsCalculado,
              saldo_disponivel: saldoCBS,
            });
          }

          if (ibsCalculado > 0) {
            creditos.push({
              ...creditoBase,
              tipo_tributo: 'IBS',
              valor_credito: ibsCalculado,
              saldo_disponivel: saldoIBS,
            });
          }

          // Etapa 45: os itens sobem na mesma chamada — e portanto na mesma
          // transação da nota e dos créditos. Antes, a nota importada por XML
          // ficava sem itens: não havia como conferir os totais IBS/CBS
          // (rejeição 1091) nem apurar crédito por item nessa via.
          //
          // `v_ibs` não vai daqui de propósito: a RPC o deriva de
          // `v_ibs_uf + v_ibs_mun` para a constraint
          // `notas_fiscais_itens_v_ibs_soma_ck`. O `ad_rem_is` recebe o
          // `pISEspec` do IS: é alíquota por unidade (R$), não percentual, então
          // vai como veio do XML, sem divisão por 100.
          const itens = nfe.itens.map((item, idx) => ({
            n_item: idx + 1,
            c_prod: item.codigo,
            x_prod: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            q_com: item.quantidade,
            v_un_com: item.valorUnitario,
            v_prod: item.valorTotal,
            // Os `p*` chegam do parser já em fração decimal (0-1), que é o que
            // a coluna guarda.
            cst_ibscbs: item.ibscbs?.cst,
            cclasstrib: item.ibscbs?.cClassTrib,
            v_bc_ibscbs: item.ibscbs?.vBC,
            p_ibs_uf: item.ibscbs?.pIBSUF,
            v_ibs_uf: item.ibscbs?.vIBSUF,
            p_ibs_mun: item.ibscbs?.pIBSMun,
            v_ibs_mun: item.ibscbs?.vIBSMun,
            p_cbs: item.ibscbs?.pCBS,
            v_cbs: item.ibscbs?.vCBS,
            // Cada tributo tem o seu próprio `gRed` no leiaute; só o do IBS UF
            // tem coluna correspondente na tabela de itens.
            p_red_aliq: item.ibscbs?.gRedUF?.pRedAliq,
            p_aliq_efet: item.ibscbs?.gRedUF?.pAliqEfet,
            cst_is: item.is?.cstIs,
            cclasstrib_is: item.is?.cClassTribIs,
            v_bc_is: item.is?.vBCIs,
            p_is: item.is?.pIs,
            ad_rem_is: item.is?.pIsEspec,
            v_is: item.is?.vIs,
          }));

          await mustSucceed(
            supabase.rpc('registrar_nfe_com_creditos', {
              p_empresa_id: empresaId,
              p_nota: {
                numero: nfe.numero,
                serie: nfe.serie || '1',
                cliente_nome: nfe.nomeEmitente,
                cliente_cnpj: nfe.cnpjEmitente,
                data_emissao: dataEmissaoISO(nfe.dataEmissao),
                valor_total: nfe.valorTotal,
                valor_produtos: nfe.valorProdutos,
                valor_icms: nfe.valorICMS,
                chave_acesso: nfe.chaveAcesso,
                natureza_operacao: nfe.naturezaOperacao || 'Compra para comercialização',
                status: 'autorizada',
                created_by: userData.user.id,
              },
              p_creditos: creditos,
              p_itens: itens,
            }),
            `registrar a nota ${nfe.numero} e seus créditos de CBS/IBS`
          );

          // Os totais só sobem depois do crédito confirmado. Antes, o
          // incremento acontecia mesmo com o insert falhando em silêncio: o
          // resumo da importação anunciava crédito que não existia no banco.
          totalCBS += cbsCalculado;
          totalIBS += ibsCalculado;
          if (temGrupo) {
            cbssDoXml += cbsCalculado;
            ibsDoXml += ibsCalculado;
          } else if (temMono) {
            notasMonofasicas++;
          } else {
            notasEstimadas++;
          }

          // Etapa 46: a divergência é anexada à nota e contada no resumo, mas
          // não interrompe a importação. Recusar a nota por catálogo
          // desatualizado faria o contribuinte perder o crédito.
          const validacao = validarItensFiscais(
            nfe.itens.map((i) => ({
              ncm: i.ncm,
              cstIbscbs: i.ibscbs?.cst,
              cClassTrib: i.ibscbs?.cClassTrib,
            })),
            referenciasPorData.get(dataVigenciaNota(nfe)) ??
              (await buscarReferenciasFiscais([], [], dataVigenciaNota(nfe)))
          );

          processadas[i] = {
            ...nfe,
            status: 'importado',
            ...(validacao.divergencias.length > 0
              ? { alertasFiscais: validacao.divergencias }
              : {}),
          };
          if (validacao.divergencias.length > 0) notasComAlertaFiscal++;
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
        creditosDoXml: {
          cbs: cbssDoXml,
          ibs: ibsDoXml,
          total: cbssDoXml + ibsDoXml,
        },
        notasEstimadas,
        notasMonofasicas,
        notasComAlertaFiscal,
        nfesProcessadas: processadas,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'], refetchType: 'all' });
      // A aba Notas Fiscais lê `notas_fiscais` pela chave própria e costuma
      // estar desmontada aqui — `refetchType: 'all'` recarrega mesmo assim,
      // porque o cliente não refaz a consulta ao remontar a tela.
      queryClient.invalidateQueries({ queryKey: CHAVE_QUERY_NOTAS, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['creditos-tributarios'], refetchType: 'all' });
      // Etapa 43: o resumo precisa dizer quanto veio do XML. Antes mostrava um
      // total único, e o usuário não tinha como saber que parte era estimativa
      // — justamente o que a etapa manda avisar.
      let mensagem = `${result.sucesso} NF-e importadas. Créditos: R$ ${result.creditosGerados.total.toFixed(2)}`;
      if (result.creditosDoXml.total > 0) {
        mensagem += ` (R$ ${result.creditosDoXml.total.toFixed(2)} destacados no XML)`;
      }
      if (result.notasEstimadas > 0) {
        mensagem += `. Atenção: ${result.notasEstimadas} NF-e sem grupo IBS/CBS tiveram crédito estimado`;
      }
      if (result.notasMonofasicas > 0) {
        mensagem += `. ${result.notasMonofasicas} NF-e monofásica(s) sem crédito regular`;
      }
      toast.success(mensagem);
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
