// Reprodução diagnóstica offline: detectar estes comportamentos NÃO aprova produção.
// Executa o código-fonte com dependências estritamente simuladas e sem rede/banco.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const raiz = path.resolve(process.argv[2] || process.cwd());
const requireProjeto = createRequire(path.join(raiz, 'package.json'));
const ts = requireProjeto('typescript');

function carregar(arquivo, dependencias) {
  const fonte = fs.readFileSync(path.join(raiz, arquivo), 'utf8');
  const codigo = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(codigo, {
    exports,
    require: (nome) => {
      if (!(nome in dependencias)) throw new Error(`Dependência não autorizada: ${nome}`);
      return dependencias[nome];
    },
  }, { filename: arquivo, timeout: 3000 });
  return exports;
}

async function boleto() {
  const avisos = [];
  const acessos = [];
  const consulta = {
    select: () => consulta,
    eq: () => consulta,
    maybeSingle: async () => ({ data: { valor: 100, cliente_nome: 'Cliente fictício', data_vencimento: '2026-10-01' }, error: null }),
  };
  const mod = carregar('src/hooks/expert-actions/financial-actions.ts', {
    '@/integrations/supabase/client': { supabase: { from: nome => { acessos.push(nome); return consulta; } } },
    '@/lib/formatters': { formatCurrency: valor => String(valor), todayISOLocal: () => '2026-09-12' },
    sonner: { toast: { success: texto => avisos.push(texto) } },
    '@tanstack/react-query': {},
  });
  const resposta = await mod.gerarBoleto('conta-ficticia');
  assert.equal(resposta.success, true);
  assert.match(resposta.message, /BOLETO GERADO/);
  assert.deepEqual(acessos, ['contas_receber']);
  assert.equal(avisos.length, 1);
  console.log('DEFEITO REPRODUZIDO: boleto anuncia sucesso usando apenas leitura de conta, sem provedor.');
}

async function perDcomp(falhaCredito) {
  const escritas = [];
  const avisos = [];
  const supabase = { from: tabela => {
    const consulta = {
      update: payload => { escritas.push({ tabela, payload }); return consulta; },
      eq: () => consulta,
      select: () => consulta,
      single: async () => ({ data: { id: 'pedido-ficticio', tipo: 'dcomp', creditos_ids: ['credito-ficticio'], numero_recibo: 'recibo-ficticio' }, error: null }),
      in: async () => ({ data: null, error: falhaCredito ? { message: 'Falha de crédito injetada' } : null }),
    };
    return consulta;
  } };
  const mod = carregar('src/hooks/usePerDcomp.ts', {
    '@/integrations/supabase/client': { supabase },
    '@tanstack/react-query': {
      useQuery: () => ({ data: [], isLoading: false }),
      useMutation: opcoes => opcoes,
      useQueryClient: () => ({ invalidateQueries: () => {} }),
    },
    sonner: { toast: { success: texto => avisos.push(texto), error: () => {} } },
    'date-fns': { format: () => '20260912' },
  });
  const mutacao = mod.usePerDcomp('empresa-ficticia').transmitirPedido;
  const resultado = await mutacao.mutationFn('pedido-ficticio');
  mutacao.onSuccess(resultado);
  assert.equal(escritas[0].tabela, 'per_dcomp');
  assert.equal(escritas[0].payload.status, 'transmitido');
  assert.equal(escritas[1].tabela, 'creditos_tributarios');
  assert.equal(escritas[1].payload.status, 'compensado');
  assert.match(avisos[0], /transmitido com sucesso/);
  console.log(falhaCredito
    ? 'DEFEITO REPRODUZIDO: erro na escrita de crédito não impede sucesso da transmissão simulada.'
    : 'DEFEITO REPRODUZIDO: PER/DCOMP grava transmitido e compensado sem transmissão externa.');
}

(async () => {
  await boleto();
  await perDcomp(false);
  await perDcomp(true);
  console.log('3 reproduções diagnósticas confirmadas; zero chamadas externas. NÃO É GATE DE ACEITE.');
})().catch(erro => { console.error(erro.message); process.exitCode = 1; });
