import { simularReal } from '../src/lib/tributario/shared-logic';
let inv=0, max=0;
for (let i=0;i<600;i++){
  const fat = 500000 + Math.random()*50_000_000;
  const margem = Math.random()*25;
  const p:any = { faturamentoAnual: fat, margemLucro: margem, percentualServicos: Math.random()*100, comprasComCredito: fat*Math.random()*0.5, despesasOperacionais: fat*Math.random()*0.3, folhaAnual: fat*Math.random()*0.2 };
  const r = simularReal(p);
  // prejuízo acumulado hipotético = 40% do lucro
  const lucro = fat*margem/100;
  const prej = lucro*0.8;
  const comp = Math.min(prej, lucro*0.3);
  const lucroAj = lucro - comp;
  const irpjAj = lucroAj*0.15 + (lucroAj>240000?(lucroAj-240000)*0.10:0);
  const csllAj = lucroAj*0.09;
  const delta = (r.irpj + r.csll - irpjAj - csllAj)/fat*100;
  if (delta>0.01) inv++;
  max = Math.max(max, delta);
}
console.log('cenarios com carga superestimada por ignorar prejuízo:', inv, '/600; distorção máx p.p.:', max.toFixed(2));
