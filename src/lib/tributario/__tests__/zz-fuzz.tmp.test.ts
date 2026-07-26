import { describe, it } from 'vitest';
import { simularSimples, simularPresumido, simularReal, type ParametrosSimulacao } from '@/lib/tributario/shared-logic';

function rnd(seed:number){let s=seed;return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296;};}

describe('fuzz', () => {
  it('varre 2000 cenarios', () => {
    const r = rnd(42); const problemas: string[] = [];
    for (let i=0;i<2000;i++){
      const fat = Math.round(r()*9_000_000);
      const p: ParametrosSimulacao = {
        faturamentoAnual: fat,
        margemLucro: Math.round(r()*120)-10,
        percentualServicos: Math.round(r()*110),
        percentualIndustria: Math.round(r()*60),
        percentualRevenda: Math.round(r()*60),
        folhaAnual: Math.round(r()*fat*0.6),
        comprasComCredito: Math.round(r()*fat*0.7),
        despesasOperacionais: Math.round(r()*fat*0.5),
        aliquotaICMS: r()*0.3, aliquotaISS: r()*0.06,
        aliquotaRAT: r()*0.03, aliquotaTerceiros: r()*0.06,
        issRetidoFonte: Math.round(r()*50000),
        sublimiteEstadual: r()>0.8 ? 1_800_000 : 3_600_000,
      };
      for (const [nome, fn] of [['simples',simularSimples],['presumido',simularPresumido],['real',simularReal]] as const){
        let res;
        try { res = (fn as (x:ParametrosSimulacao)=>ReturnType<typeof simularPresumido>)(p); }
        catch(e){ problemas.push(`${nome} throw #${i}: ${(e as Error).message}`); continue; }
        const nums = {irpj:res.irpj,csll:res.csll,pis:res.pis,cofins:res.cofins,cpp:res.cpp,icms:res.icms,iss:res.iss,total:res.totalTributos,carga:res.cargaEfetiva};
        for (const [k,v] of Object.entries(nums)){
          if (!Number.isFinite(v)) problemas.push(`${nome} ${k} nao-finito #${i} (fat=${fat}, margem=${p.margemLucro})`);
          else if (v < -0.001) problemas.push(`${nome} ${k} negativo=${v.toFixed(2)} #${i} (fat=${fat}, margem=${p.margemLucro}, serv=${p.percentualServicos})`);
        }
        if (res.elegivel && res.cargaEfetiva > 1.2) problemas.push(`${nome} carga absurda ${(res.cargaEfetiva).toFixed(2)} #${i} fat=${fat}`);
      }
    }
    const uniq = [...new Set(problemas.map(x=>x.replace(/#\d+/,'#')))];
    console.log('TOTAL problemas:', problemas.length, 'unicos:', uniq.length);
    console.log(uniq.slice(0,30).join('\n'));
  });
});
