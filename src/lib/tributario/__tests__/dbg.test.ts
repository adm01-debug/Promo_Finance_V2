import { it } from 'vitest';
import { simularPresumido, simularReal } from '@/lib/tributario/shared-logic';
it('dbg', () => {
  const cnaes = ['0111301','1011201','4120400','4711302','4930202','6422100','8513900','8411600','9999999','xx'];
  for (let i=0;i<500;i++){
    const folha = Math.round(Math.random()*3_000_000);
    const p:any = {faturamentoAnual:1_000_000+i*10_000, folhaAnual:folha, custosAnuais:1_500_000, despesasAnuais:500_000, percentualServicos:0.5, percentualIndustria:0, percentualRevenda:0.5, cnaePrincipal:cnaes[i%10], aliquotaRAT:[0,0.01,0.02,0.03,0.06][i%5]};
    for (const [n,r] of [['pres',simularPresumido(p)],['real',simularReal(p)]] as any){
      if(!Number.isFinite(r.totalTributos)){ console.log(n, JSON.stringify({p,r}).slice(0,800)); return; }
    }
  }
  console.log('no repro');
});
