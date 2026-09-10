// Sonda de auditoria isolada. Reprova invariantes; não corrige o domínio nem acessa rede.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parseBoleto } from '../../src/lib/barcode-parser';
import { converterContasPagarParaLancamentos, converterContasReceberParaLancamentos } from '../../src/lib/transaction-matcher/converters';
import { parseCurrency, valueToCents, calculateInstallments, sumCurrency } from '../../src/lib/currency';
import { parseCSV } from '../../src/lib/ofx-parser/csv';
import { parseData, parseOFXDate } from '../../src/lib/ofx-parser/utils';
import { gerarProjecaoCenario, calcularMetricasCenarios, detectarAlertasRuptura } from '../../src/lib/cashflow-scenarios';
import { computeBalanceteTotais } from '../../src/lib/contabil/balancete-utils';

const results: Array<{id:string;cenario:string;esperado:string;obtido:unknown;passou:boolean}> = [];
function check(id:string,cenario:string,esperado:string,run:()=>unknown,accept:(v:any)=>boolean) {
  try { const obtido=run(); results.push({id,cenario,esperado,obtido,passou:accept(obtido)}); }
  catch(error) { results.push({id,cenario,esperado,obtido:String(error),passou:false}); }
}
function rejects(fn:()=>unknown) { try { fn(); return false; } catch { return true; } }
const csv=(v:string,date='10/09/2026')=>parseCSV(`data;descricao;valor\n${date};Teste sintético;${v}`,'sintetico.csv');
check('S01','CSV brasileiro com milhar','1234.56',()=>csv('1.234,56').extrato?.transacoes[0].valor,v=>v===1234.56);
check('S02','CSV débito brasileiro','-1234.56',()=>csv('-1.234,56').extrato?.transacoes[0].valor,v=>v===-1234.56);
check('S03','CSV valor não numérico','Rejeitar ou não retornar sucesso',()=>csv('abc'),v=>!v.sucesso);
check('S04','Data 31/02/2026','Rejeitar data inexistente',()=>rejects(()=>parseData('31/02/2026')),v=>v===true);
check('S05','Data OFX 20260231','Rejeitar data inexistente',()=>rejects(()=>parseOFXDate('20260231')),v=>v===true);
check('S06','Moeda com sufixo inválido','Não aceitar 12abc como valor 12',()=>parseCurrency('12abc'),v=>Number.isNaN(v));
check('S07','Conversão decimal positiva','1.005 com meia unidade afastada de zero resulta em 101 centavos',()=>valueToCents(1.005),v=>v===101);
check('S08','Conversão decimal negativa','-1.005 com regra simétrica resulta em -101 centavos',()=>valueToCents(-1.005),v=>v===-101);
check('S09','Parcelamento com juros NaN','Rejeitar taxa não finita',()=>rejects(()=>calculateInstallments(100,3,NaN)),v=>v===true);
check('S10','Parcelamento com juros infinitos','Rejeitar taxa infinita',()=>rejects(()=>calculateInstallments(100,3,Infinity)),v=>v===true);
check('S11','Parcelamento 100/3','Conservar 10000 centavos, parcela final 33.34 e saldo final zero',()=>calculateInstallments(100,3),v=>Math.round(v.installmentDetails.reduce((s:any,r:any)=>s+r.value,0)*100)===10000&&v.installmentDetails[2].value===33.34&&v.installmentDetails[2].balance===0);
check('S12','Soma 0.10+0.20','0.30',()=>sumCurrency([0.1,0.2]),v=>v===0.3);
check('S13','Projeção realista repetida','Mesmos dados e configuração devem permitir reprodução',()=>{
  const old=Math.random;const base=[{data:'2026-09-10',receitas:1000,despesas:100,saldo:0}];
  try {Math.random=()=>0;const a=gerarProjecaoCenario(base,'realista',0);Math.random=()=>0.9;const b=gerarProjecaoCenario(base,'realista',0);return {primeiro:a[0].saldo,segundo:b[0].saldo};} finally {Math.random=old;}
},v=>v.primeiro===v.segundo);
check('S14','Métrica de projeção vazia','Saldo mínimo finito ou estado indisponível explícito',()=>calcularMetricasCenarios({otimista:[],realista:[],pessimista:[]}),v=>Object.values(v).every((m:any)=>Number.isFinite(m.saldoMinimo)));
check('S15','Alerta de risco médio','Saldo 75000 deve produzir risco_medio quando limite é 100000',()=>detectarAlertasRuptura({otimista:[],pessimista:[],realista:[{data:'2026-09-10',receitas:0,despesas:0,saldo:75000,cenario:'realista'}]},0,50000,100000),v=>v.some((a:any)=>a.tipo==='risco_medio'));
const row={conta_id:'sintetica',codigo:'1',nome:'Teste',tipo:'ativo',natureza:'devedora',nivel:1,aceita_lancamento:true,saldo_anterior:0,debitos:100,creditos:100,saldo_final:0};
check('S16','Balancete balanceado','Débitos=créditos',()=>computeBalanceteTotais([row]),v=>v.balanceado&&v.debitos===100);
check('S17','Balancete com débito inválido','Não certificar escrituração inválida como balanceada',()=>computeBalanceteTotais([{...row,debitos:NaN,creditos:0}]),v=>!v.balanceado);
check('S18','Balancete sintético+analítico','Não duplicar débitos',()=>computeBalanceteTotais([row,{...row,aceita_lancamento:false}]),v=>v.debitos===100&&v.contas===1);
check('S19','CSV simples com vírgula','123.45',()=>csv('123,45').extrato?.transacoes[0].valor,v=>v===123.45);
check('S20','Ano bissexto válido','Aceitar 29/02/2024',()=>parseData('29/02/2024').getDate(),v=>v===29);
check('S21','Parcelamento inválido','Rejeitar zero parcelas',()=>rejects(()=>calculateInstallments(100,0)),v=>v===true);
check('S22','CSV de data inexistente','Não aceitar lançamento em data inexistente',()=>csv('100','31/02/2026'),v=>!v.sucesso);
// Extrair somente helpers puros privados evita inicializar hooks/cliente Supabase.
const boletoSource=readFileSync(new URL('../../src/hooks/useBoletos.ts',import.meta.url),'utf8');
const boletoAst=ts.createSourceFile('useBoletos.ts',boletoSource,ts.ScriptTarget.Latest,true);
const helpers=boletoAst.statements.filter(n=>ts.isFunctionDeclaration(n)&&['generateLinhaDigitavel','generateCodigoBarras'].includes(n.name?.text??'')).map(n=>n.getText(boletoAst)).join('\n');
const helpersJs=ts.transpileModule(helpers,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
check('S23','Código de barras gerado aceito pelo parser do próprio sistema','Código válido',()=>{
  const code=vm.runInNewContext(`${helpersJs}\ngenerateCodigoBarras(123.45)`);
  const parsed=parseBoleto(code);return {digits:code.length,valid:parsed.valido,errors:parsed.erros};
},v=>v.valid);
check('S24','Linha digitável gerada aceita pelo parser do próprio sistema','Linha válida',()=>{
  const code=vm.runInNewContext(`${helpersJs}\ngenerateLinhaDigitavel(123.45,"2026-10-10")`);
  const parsed=parseBoleto(code);return {digits:code.replace(/\D/g,'').length,valid:parsed.valido,errors:parsed.erros};
},v=>v.valid);
check('S25','Conversor de conciliação de pagamento parcial','Residual 600 de título 1000 com 400 pagos',()=>converterContasPagarParaLancamentos([{id:'p',descricao:'teste',valor:1000,valor_pago:400,data_vencimento:'2026-09-10',fornecedor_nome:'Sintético',status:'parcial'} as any])[0].valor,v=>v===600);
check('S26','Conversor de conciliação de recebimento parcial','Residual 600 de título 1000 com 400 recebidos',()=>converterContasReceberParaLancamentos([{id:'r',descricao:'teste',valor:1000,valor_recebido:400,data_vencimento:'2026-09-10',cliente_nome:'Sintético',status:'parcial'} as any])[0].valor,v=>v===600);
const out=process.argv[2]??'/tmp/promo-auditoria-financeira-20260910';mkdirSync(out,{recursive:true});
const report={total:results.length,aprovados:results.filter(r=>r.passou).length,reprovados:results.filter(r=>!r.passou).length,results};
writeFileSync(`${out}/cenarios.json`,JSON.stringify(report,(_,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2)+'\n');
console.log(JSON.stringify(report,(_,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2));
process.exitCode=report.reprovados?1:0;
