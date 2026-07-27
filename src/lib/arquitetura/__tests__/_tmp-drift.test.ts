import { describe, it } from 'vitest';
import { analisarDrift } from '../analisador-imports';
describe('drift', () => { it('report', () => {
  const r = analisarDrift(process.cwd());
  const agg = new Map<string, {n:number; ex:string}>();
  for (const a of r.naoDeclaradas) { const k=`${a.de}->${a.para}`; const c=agg.get(k); if(c) c.n++; else agg.set(k,{n:1,ex:`${a.arquivo} :: ${a.especificador}`}); }
  console.log('NAO DECLARADAS:'); for (const [k,v] of [...agg].sort()) console.log(' ', k, 'x'+v.n, v.ex);
  console.log('INVERSOES:', r.inversoesDeCamada.length);
  for (const a of r.inversoesDeCamada.slice(0,20)) console.log('  ', a.de,'->',a.para, a.arquivo, a.especificador);
  console.log('DECLARADAS SEM USO:', r.declaradasSemUso.map(d=>`${d.de}->${d.para}`).join(', '));
}); });
