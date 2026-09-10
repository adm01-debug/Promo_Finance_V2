// Smoke de interface com backend inteiramente sintético; não certifica RLS/persistência.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const out=process.argv[2]??'/tmp/promo-auditoria-financeira-20260910';
const base='http://127.0.0.1:18089';
const inventory=JSON.parse(fs.readFileSync(`${out}/inventario.json`,'utf8'));
const routes=inventory.routes.filter(r=>r.file==='src/App.tsx'&&r.protected);
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'auditoria@example.invalid',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const company={id:'22222222-2222-4222-8222-222222222222',razao_social:'Empresa sintética de auditoria',nome_fantasia:'Empresa sintética',cnpj:'00000000000000',ativo:true};
const session={access_token:`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')}.assinatura-ficticia`,refresh_token:'fixture-local-nao-utilizavel',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const report={ambiente:'Somente localhost; rede externa interceptada; auth/dados sintéticos',unauth:[],authenticated:[],dialogs:[],public:[],sefaz:null};
const browser=await chromium.launch({headless:true});
async function contextFor(authenticated,viewport={width:1440,height:1000}) {
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===base)return route.continue();
    if(url.hostname!=='audit.supabase.co')return route.abort();
    const single=(req.headers().accept??'').includes('vnd.pgrst.object');
    let data=[];
    if(url.pathname.startsWith('/auth/v1/user'))data=user;
    else if(url.pathname.includes('/rest/v1/profiles'))data=[{id:user.id,email:user.email,full_name:'Auditoria sintética'}];
    else if(url.pathname.includes('/rest/v1/user_roles'))data=[{role:'admin',is_active:true}];
    else if(url.pathname.includes('/rest/v1/user_empresas'))data=[{id:'vinculo-fixture',user_id:user.id,empresa_id:company.id,role:'admin',ativo:true,is_default:true,provisioned_via:'manual',empresa:company}];
    else if(url.pathname.includes('/rest/v1/user_onboarding_progress'))data=[{user_id:user.id,is_completed:true,steps_completed:[],last_step:'done'}];
    else if(url.pathname==='/rest/v1/empresas')data=[company];
    else if(url.pathname.startsWith('/functions/v1/'))return route.fulfill({status:503,json:{error:'Integração indisponível na simulação de auditoria'}});
    else if(!['GET','HEAD','OPTIONS'].includes(req.method()))return route.fulfill({status:403,json:{message:'Escrita interceptada pela auditoria'}});
    if(single&&Array.isArray(data))data=data[0]??null;
    return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','content-range':'0-0/0'},body:JSON.stringify(data)});
  });
  await context.routeWebSocket('**',socket=>socket.close());
  if(authenticated)await context.addInitScript(({session,company})=>{
    localStorage.setItem('sb-aaaaaaaaaaaaaaaaaaaa-auth-token',JSON.stringify(session));
    localStorage.setItem('pf:current-empresa-id',company.id);
  },{session,company});
  return context;
}
async function visit(page,path) {
  const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
  try {
    await page.goto(base+path.replace(/:id|:token/g,'11111111-1111-4111-8111-111111111111').replace(':tab','dashboard'),{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.querySelector('h1,h2,#login-email')||document.body.innerText.includes('Algo deu errado'),{},{timeout:7000}).catch(()=>{});
    const body=await page.locator('body').innerText();
    const buttons=await page.getByRole('button').evaluateAll(nodes=>nodes.map(n=>({label:(n.getAttribute('aria-label')||n.textContent||'').trim().slice(0,100),disabled:n.disabled??false})));
    return {path,url:new URL(page.url()).pathname,headings:await page.locator('h1,h2').allTextContents(),bodySize:body.length,buttons,errors,boundary:/Algo deu errado|Ocorreu um erro inesperado/i.test(body)};
  } catch(e) {return {path,error:String(e),errors};} finally {page.off('pageerror',listener);}
}
try {
  if(process.argv.includes('--somente-autenticado') || process.argv.includes('--somente-interacoes')) {
    const previous=JSON.parse(fs.readFileSync(`${out}/navegacao.json`,'utf8'));
    report.unauth=previous.unauth;report.public=previous.public;
    if(process.argv.includes('--somente-interacoes'))report.authenticated=previous.authenticated;
  } else {
  const anon=await contextFor(false);const p=await anon.newPage();
  for(const r of routes){const v=await visit(p,r.path);report.unauth.push({...v,redirected:v.url==='/auth'});}
  for(const viewport of [{width:1440,height:1000},{width:375,height:812}]){
    await p.setViewportSize(viewport);const state=await visit(p,'/auth');
    await p.locator('#login-email').fill('auditoria@example.invalid');
    await p.locator('#login-password').fill('Senha123');
    await p.getByRole('button',{name:/Acessar Plataforma/i}).click({trial:true});
    const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    report.public.push({viewport,state,loginButtonClickable:true,overflow});
  }
  await anon.close();
  }
  const auth=await contextFor(true);const page=await auth.newPage();
  if(!process.argv.includes('--somente-interacoes'))for(const r of routes){const result=await visit(page,r.path);report.authenticated.push(result);if(result.url==='/auth')throw new Error('Fixture de autenticação inválida; navegação protegida não validada.');if(report.authenticated.length%20===0)console.log(`Rotas sintéticas: ${report.authenticated.length}/${routes.length}`);}
  for(const [path,name] of [['/contas-pagar','Novo Registro'],['/contas-receber','Novo Registro'],['/boletos','Novo Boleto'],['/notas-fiscais','Emitir NF-e'],['/tesouraria','Transferência'],['/pix-hub','Receber'],['/usuarios','Convidar'],['/admin/api','Nova Chave API']]){
    await visit(page,path);
    try{
      const btn=page.getByRole('button',{name:new RegExp(name,'i')}).last();await btn.click({timeout:7000});
      await page.getByRole('dialog').first().waitFor({state:'visible',timeout:3000});
      report.dialogs.push({path,button:name,opened:true,labels:await page.getByRole('dialog').first().locator('label').allTextContents()});
      await page.keyboard.press('Escape');
    }catch(e){report.dialogs.push({path,button:name,opened:false,error:String(e).slice(0,250),classification:'Revisar locator/fixture e contrato da UI'});}
  }
  await visit(page,'/notas-fiscais');
  let requests=0;const listener=req=>{if(req.url().includes('/functions/v1/')&&/sefaz|nfe/.test(req.url()))requests++;};page.on('request',listener);
  const consult=page.getByRole('button',{name:/Consultar SEFAZ/i});
  if(await consult.count()){
    await page.evaluate(()=>{Math.random=()=>0.9;});
    await consult.first().click();
    await page.getByText('Consulta SEFAZ finalizada!',{exact:true}).waitFor({timeout:6000});
    report.sefaz={successToast:true,requestsToSefazEdge:requests,bodyExcerpt:(await page.locator('body').innerText()).slice(-2500)};
  }
  page.off('request',listener);
  await page.screenshot({path:`${out}/nfe-simulada.png`,fullPage:true});
  await auth.close();
} finally {
  fs.writeFileSync(`${out}/navegacao.json`,JSON.stringify(report,null,2)+'\n');
  await browser.close();
  console.log(JSON.stringify({anon:report.unauth.length,anonRedirected:report.unauth.filter(r=>r.redirected).length,authenticated:report.authenticated.length,errors:report.authenticated.filter(r=>r.error||r.errors?.length||r.boundary).map(r=>({path:r.path,errors:r.errors,error:r.error,boundary:r.boundary})),dialogs:report.dialogs,sefaz:report.sefaz?{success:report.sefaz.successToast,requests:report.sefaz.requestsToSefazEdge}:null},null,2));
}
