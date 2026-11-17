// Consolidação mecânica dos resultados da auditoria; não muda o produto.
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const input=process.argv[2]??'/tmp/promo-auditoria-financeira-20260910';
const output='docs/auditoria-financeira-20260910';
fs.mkdirSync(output,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(input,f),'utf8'));
const inventory=read('inventario.json'), nav=read('navegacao.json'), scenarios=read('cenarios.json');
const coverageDefault=JSON.parse(fs.readFileSync('coverage/coverage-summary.json','utf8'));
const coverageGlobal=read('cobertura-global/coverage-summary.json');
const byGroup={};
for(const group of ['pages','hooks','components','lib']){
  const entries=Object.entries(coverageGlobal).filter(([f])=>f.includes(`/src/${group}/`));
  byGroup[group]=entries.reduce((a,[,v])=>({files:a.files+1,lines:a.lines+v.lines.total,covered:a.covered+v.lines.covered}),{files:0,lines:0,covered:0});
}
const scope={base:inventory.summary.commit,inventario:inventory.summary,cenarios:{total:scenarios.total,aprovados:scenarios.aprovados,reprovados:scenarios.reprovados},cobertura:{padrao:{files:Object.keys(coverageDefault).length-1,total:coverageDefault.total},global:{files:Object.keys(coverageGlobal).length-1,total:coverageGlobal.total,byGroup}},interface:{anon:nav.unauth.length,redirecionadas:nav.unauth.filter(r=>r.redirected).length,sinteticas:nav.authenticated.length,naoRedirecionadas:nav.authenticated.filter(r=>r.url&&r.url!=='/auth').length,comErro:nav.authenticated.filter(r=>r.error||r.errors?.length||r.boundary).length,dialogosTentados:nav.dialogs.length,dialogosAbertos:nav.dialogs.filter(r=>r.opened).length},ci:read('ci.json')};
fs.writeFileSync(path.join(output,'resumo.json'),JSON.stringify(scope,null,2)+'\n');
fs.writeFileSync(path.join(output,'inventario.json.gz'),gzipSync(JSON.stringify(inventory)));
fs.writeFileSync(path.join(output,'cenarios.json'),JSON.stringify(scenarios,null,2)+'\n');
fs.writeFileSync(path.join(output,'navegacao.json.gz'),gzipSync(JSON.stringify(nav)));
// Preservar somente linhas de resultado, não payloads/saídas arbitrárias dos testes.
const provas={};
for(const name of ['types.log','lint.log','build.log','build-configurado.log','vitest.log','cobertura-global.log','deno.log','gates-offline.log']){
  const raw=fs.readFileSync(path.join(input,name),'utf8');
  const clean=raw.replace(/\x1b\[[0-9;]*m/g,'');
  provas[name]={sha256LogCompleto:createHash('sha256').update(raw).digest('hex'),linhasResultado:clean.split('\n').filter(line=>/Test Files|^\s*Tests\s+\d|^\s*Duration\s|^ERROR: Coverage|^ok \| \d+ passed|^ℹ (tests|pass|fail|skipped|duration_ms)|problems \(|built in|^\$ (tsc|eslint|vite)|^error: script|\[vite:|Missing required environment|VITE_.*required/.test(line))};
}
fs.writeFileSync(path.join(output,'VERIFICACOES.json'),JSON.stringify(provas,null,2)+'\n');
const cell=x=>String(x??'—').replace(/\x1b\[[0-9;]*m/g,'').replace(/\|/g,'/').replace(/[\r\n\u001b]/g,' ').slice(0,180);
let md='# Matriz individual de rotas e evidência de interface\n\n';
md+=`Base: \`${inventory.summary.commit}\`. Rede externa interceptada. Sessão e dados sintéticos. Resultados não certificam backend/RLS nem execução de todas as ações.\n\n`;
md+='O inventário completo está em `inventario.json.gz`: contém cada controle e função com arquivo e linha, além das chamadas de backend. Pode ser lido com `gzip -dc` e regenerado por `scripts/auditoria-financeira/inventario.mjs`.\n\n';
md+='## Rotas\n\n| Rota | Arquivo:linha | Guard explícito | Sem sessão | Sessão sintética / conteúdo observado | Controles de botão no DOM | Erros/limites |\n|---|---|---|---|---|---:|---|\n';
for(const r of inventory.routes){
  const a=nav.unauth.find(x=>x.path===r.path),b=nav.authenticated.find(x=>x.path===r.path);
  md+=`| ${cell(r.path)} | ${cell(r.file)}:${r.line} | ${r.protected?'sim':'não'} | ${a?(a.redirected?'redirecionou':'revisar'):'não exercitada individualmente'} | ${b?cell(b.headings?.join('; ')||b.url||b.error):'não exercitada'} | ${b?.buttons?.length??'—'} | ${cell(b?.error||b?.errors?.join('; ')||(b?.boundary?'boundary visível':'Sem exceção capturada não comprova função completa'))} |\n`;
}
md+='\n## Diálogos e cliques dirigidos\n\n| Rota | Controle | Resultado | Limitação |\n|---|---|---|---|\n';
for(const d of nav.dialogs)md+=`| ${cell(d.path)} | ${cell(d.button)} | ${d.opened?'diálogo aberto':'não comprovado'} | ${cell(d.error||'Somente abertura; gravação/efeito financeiro não certificados')} |\n`;
md+='\n## Login desktop e mobile\n\n';
for(const p of nav.public)md+=`- ${p.viewport.width}×${p.viewport.height}: botão acionável em trial=${p.loginButtonClickable}; overflow horizontal=${p.overflow}. Nenhuma credencial real submetida.\n`;
md+='\n## Consulta SEFAZ sintética\n\n';
md+=nav.sefaz?`Toast de consulta concluída observado: ${nav.sefaz.successToast}. Chamadas observadas para Edge Functions SEFAZ/NF-e durante o clique: ${nav.sefaz.requestsToSefazEdge}. A inspeção do handler confirma timer/alteração local e protocolo simulado. Captura em \`nfe-simulada.png\`.\n`:'Clique não comprovado nesta execução; usar a evidência estática e completar a simulação.\n';
md+='\n## Limites das fixtures\n\nAs respostas de dados gerais são coleções vazias e integrações retornam erro controlado. Isso exercita parte dos estados vazios/indisponíveis. Não certifica paginação populada, alçadas de produção, concorrência, persistência, envio externo ou liquidação. Resultado de diálogo ausente pode ser nome de controle divergente, bloqueio por perfil ou fixture insuficiente; exige reprodução dirigida antes de classificar bug.\n';
fs.writeFileSync(path.join(output,'INTERFACE_E_INVENTARIO.md'),md);
if(nav.sefaz && fs.existsSync(path.join(input,'nfe-simulada.png')))fs.copyFileSync(path.join(input,'nfe-simulada.png'),path.join(output,'nfe-simulada.png'));
const files=fs.readdirSync(output).filter(f=>f!=='SHA256SUMS');
fs.writeFileSync(path.join(output,'SHA256SUMS'),files.sort().map(f=>`${createHash('sha256').update(fs.readFileSync(path.join(output,f))).digest('hex')}  ${f}`).join('\n')+'\n');
const plan=fs.readFileSync('docs/PLANO_AUDITORIA_FINANCEIRA_100_ETAPAS_2026-09-10.md','utf8');
const numbers=[...plan.matchAll(/^- \[ \] \*\*(\d{3}) — /gm)].map(x=>Number(x[1]));
if(numbers.length!==100||numbers.some((n,i)=>n!==i+1))throw new Error('Plano não contém exatamente as etapas 001–100 na ordem.');
console.log(JSON.stringify(scope,null,2));
console.log('Plano validado: exatamente 100 etapas, únicas e sequenciais.');
