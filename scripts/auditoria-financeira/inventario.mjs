// Inventário estático: ocorrência de controle não equivale a botão validado.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';

const out = process.argv[2] ?? '/tmp/promo-auditoria-financeira-20260910';
fs.mkdirSync(out, { recursive: true });
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
const sources = files.filter(f => /^src\/.*\.(ts|tsx)$/.test(f));
const tests = sources.filter(f => /\.(test|spec)\./.test(f));
const controls = [], functions = [], calls = [], routes = [], signals = [], imports = [];
const controlsNames = /^(button|Button|DropdownMenuItem|TabsTrigger|DialogTrigger|AlertDialogTrigger|SelectTrigger|Switch|Checkbox)$/;
for (const file of sources) {
  if (tests.includes(file) || file.endsWith('.d.ts') || file.includes('/supabase/types')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lineOf = n => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  function visit(n) {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) imports.push({file,line:lineOf(n),target:n.moduleSpecifier.text});
    if (ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
      const named = n.name?.getText(sf) ?? (ts.isVariableDeclaration(n.parent) ? n.parent.name.getText(sf) : 'anônima');
      functions.push({file,line:lineOf(n),name:named});
    }
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      const attrs = n.attributes.properties.filter(ts.isJsxAttribute);
      const attr = name => attrs.find(a=>a.name.getText(sf)===name)?.initializer?.getText(sf) ?? null;
      if (controlsNames.test(tag)) {
        const label = ts.isJsxElement(n.parent) ? n.parent.children.filter(ts.isJsxText).map(t=>t.text.trim()).filter(Boolean).join(' ') : '';
        controls.push({file,line:lineOf(n),tag,label,aria:attr('aria-label'),type:attr('type'),handler:attr('onClick')??attr('onSelect')??attr('onCheckedChange'),disabled:attr('disabled'),status:'inventariado; execução individual pendente'});
      }
      if (tag==='Route' && attr('path')) routes.push({file,line:lineOf(n),path:attr('path')?.replace(/^"|"$/g,''),element:attr('element'),protected:attr('element')?.includes('ProtectedRoute')??false});
    }
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ['from','rpc','invoke'].includes(n.expression.name.text)) {
      const arg=n.arguments[0];
      calls.push({file,line:lineOf(n),method:n.expression.name.text,target:arg && ts.isStringLiteral(arg)?arg.text:'<dinâmico>'});
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
  content.split('\n').forEach((line,i)=>{
    for(const [kind, re] of Object.entries({aleatoriedade:/Math\.random\(/,pendencia:/TODO|FIXME|HACK|em breve/,tipagem:/@ts-nocheck/,simulacao:/mock|simulad/i,limite:/\.limit\(/}))
      if(re.test(line)) signals.push({file,line:i+1,kind});
  });
}
const edgeDirectories=files.filter(f=>/^supabase\/functions\/[^/]+\/index\.ts$/.test(f)).map(f=>f.split('/')[2]);
const missingEdges=[...new Set(calls.filter(c=>c.method==='invoke'&&c.target!=='<dinâmico>'&&!edgeDirectories.includes(c.target)).map(c=>c.target))];
const e2e=files.filter(f=>/^e2e\/.*\.e2e\.ts$/.test(f));
const e2eConditional=e2e.flatMap(file=>fs.readFileSync(file,'utf8').split('\n').flatMap((line,i)=>/if\s*\(.*isVisible|expect\(.*\.count\(\)\)/.test(line)?[{file,line:i+1,text:line.trim()}]:[]));
const summary={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceFiles:sources.length,unitTestFiles:tests.length,routeDeclarations:routes.length,protectedRoutes:routes.filter(r=>r.protected).length,controls:controls.length,functionOccurrences:functions.length,backendCalls:calls.length,edgeDirectories:edgeDirectories.length,e2eFiles:e2e.length,migrations:files.filter(f=>/^supabase\/migrations\/.*\.sql$/.test(f)).length,missingEdges,signals:signals.reduce((a,s)=>(a[s.kind]=(a[s.kind]??0)+1,a),{}),conditionalE2ESignals:e2eConditional.length};
fs.writeFileSync(path.join(out,'inventario.json'),JSON.stringify({summary,routes,controls,functions,calls,signals,imports,e2eConditional},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
