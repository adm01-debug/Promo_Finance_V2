import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Contrato dos jobs tributários agendados por pg_cron.
 *
 * As duas edges abaixo só existiam no código: nenhum `cron.schedule` as
 * chamava, então `alertas_tributarios` nunca era alimentada e
 * `relatorios_tributarios_agendados` nunca era consumida — as telas admin
 * exibiam "sem execução" para sempre. Este teste trava os três acoplamentos que
 * fazem o job funcionar de fato:
 *
 *  1. existe migration com `cron.schedule('<job>'` chamando a URL da função;
 *  2. a função está com `verify_jwt = false` em supabase/config.toml (o pg_cron
 *     não envia JWT e o gateway rejeitaria antes do handler);
 *  3. o header `x-cron-secret` usa a MESMA chave que o handler passa para
 *     `exigirChamadaInterna` — chave divergente = 401 em 100% das execuções
 *     (foi o bug histórico do `internal_jobs`).
 */

const RAIZ = process.cwd();
const MIGRATIONS = join(RAIZ, 'supabase', 'migrations');
const FUNCTIONS = join(RAIZ, 'supabase', 'functions');
const CONFIG = join(RAIZ, 'supabase', 'config.toml');

interface JobCron {
  job: string;
  funcao: string;
  chaveSegredo: string;
}

const JOBS: readonly JobCron[] = [
  {
    // Mesmo jobname exibido por src/components/admin/CronJobsStatus.tsx.
    job: 'gerar-alertas-tributarios-diario',
    funcao: 'gerar-alertas-tributarios',
    chaveSegredo: 'gerar_alertas_tributarios',
  },
  {
    job: 'enviar-relatorios-tributarios',
    funcao: 'enviar-relatorios-tributarios-agendados',
    chaveSegredo: 'relatorios_tributarios_cron',
  },
];

function blocoDoJob(sql: string, jobname: string): string {
  const inicio = sql.indexOf(`cron.schedule(\n  '${jobname}'`);
  if (inicio === -1) throw new Error(`cron.schedule do job ${jobname} nao encontrado`);
  const fim = sql.indexOf('\n  $$\n);', inicio);
  return sql.slice(inicio, fim === -1 ? undefined : fim);
}

function migrationsSql(): string {
  return readdirSync(MIGRATIONS)
    .filter((arquivo) => arquivo.endsWith('.sql'))
    .map((arquivo) => readFileSync(join(MIGRATIONS, arquivo), 'utf8'))
    .join('\n');
}

function verifyJwtDaFuncao(nome: string): boolean | null {
  if (!existsSync(CONFIG)) return null;
  const config = readFileSync(CONFIG, 'utf8');
  const escapado = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const achado = config.match(
    new RegExp(String.raw`\[functions\.${escapado}\][^\[]{0,400}?verify_jwt\s*=\s*(true|false)`)
  );
  return achado ? achado[1] === 'true' : null;
}

describe('crons tributários — contrato entre pg_cron, config.toml e edge function', () => {
  const sql = migrationsSql();

  it.each(JOBS.map((job) => [job.job, job] as const))(
    'o job %s existe em migration, chamando a edge com x-cron-secret',
    (_nome, job) => {
      // Recorte por bloco: asserts sobre o SQL inteiro (todas as migrations
      // concatenadas) passavam mesmo com os segredos trocados entre os jobs,
      // porque os dois `cron.schedule` vivem no mesmo arquivo.
      const bloco = blocoDoJob(sql, job.job);
      expect(bloco).toContain(`functions/v1/${job.funcao}`);
      expect(bloco).toContain(`'x-cron-secret'`);
      expect(bloco).toContain(`chave = '${job.chaveSegredo}'`);
      for (const outro of JOBS.filter((j) => j.job !== job.job)) {
        expect(bloco).not.toContain(`chave = '${outro.chaveSegredo}'`);
      }
      // Sem o segredo semeado o job nasce condenado a 401.
      expect(sql).toContain(`'${job.chaveSegredo}',`);
    }
  );

  it.each(JOBS.map((job) => [job.funcao, job] as const))(
    'a função %s tem verify_jwt = false para o pg_cron chegar no handler',
    (_nome, job) => {
      expect(verifyJwtDaFuncao(job.funcao)).toBe(false);
    }
  );

  it.each(JOBS.map((job) => [job.funcao, job] as const))(
    'a função %s exige o segredo interno com a mesma chave do job',
    (_nome, job) => {
      const src = readFileSync(join(FUNCTIONS, job.funcao, 'index.ts'), 'utf8');
      expect(src).toContain(`exigirChamadaInterna(req, '${job.chaveSegredo}')`);
    }
  );

  it('o job de alertas usa o jobname que o painel admin consulta', () => {
    const painel = readFileSync(
      join(RAIZ, 'src', 'components', 'admin', 'CronJobsStatus.tsx'),
      'utf8'
    );
    const declarado = painel.match(/const TRIBUTARIO_JOB = '([^']+)'/);
    expect(declarado?.[1]).toBe(JOBS[0].job);
  });
});
