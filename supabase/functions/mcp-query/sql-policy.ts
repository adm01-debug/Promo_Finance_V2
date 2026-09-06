import {
  analisarSqlMcp,
  validarEscritaEscopada,
} from "../_shared/sql-write-guard.ts";

export interface AvaliacaoSqlMcp {
  finalSql: string;
  motivoBloqueio: string | null;
  somenteLeitura: boolean;
}

export function aplicarLimitePadrao(sql: string, limiteSeguro: number): string {
  const analise = analisarSqlMcp(sql);
  if (!analise.somenteLeitura) return sql;
  const semPontoEVirgula = sql.replace(/;\s*$/, "");
  return `SELECT * FROM (${semPontoEVirgula}) AS __mcp_limited LIMIT ${limiteSeguro}`;
}

export function avaliarSqlMcp(
  sql: string,
  allowAllRows: boolean,
  limiteSeguro?: number,
): AvaliacaoSqlMcp {
  const analise = analisarSqlMcp(sql);
  if (analise.motivoBloqueio) {
    return {
      finalSql: sql,
      motivoBloqueio: analise.motivoBloqueio,
      somenteLeitura: false,
    };
  }

  if (!allowAllRows && analise.escrita) {
    const motivo = validarEscritaEscopada(sql);
    if (motivo) {
      return {
        finalSql: sql,
        motivoBloqueio: motivo,
        somenteLeitura: false,
      };
    }
  }

  const finalSql = analise.somenteLeitura && typeof limiteSeguro === "number"
    ? aplicarLimitePadrao(sql, limiteSeguro)
    : sql;

  return {
    finalSql,
    motivoBloqueio: null,
    somenteLeitura: analise.somenteLeitura,
  };
}
