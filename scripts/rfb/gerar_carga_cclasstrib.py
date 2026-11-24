#!/usr/bin/env python3
"""Gera a carga de `public.catalogo_cclasstrib` a partir da base oficial da RFB.

Fonte: repositorio oficial `ReceitaFederal/calculadora-rtc-regime-regular`
(licenca MIT). A base de dados do calculador nao e versionada como arquivo: ela
e construida pelas migracoes Flyway em `flyway/sql/`, que sao SQL puro e podem
ser reaplicadas localmente. Este script reaplica essas migracoes em um SQLite
temporario e emite os INSERTs no formato que `catalogo_cclasstrib` espera.

Uso:
    git clone --depth 1 https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git /tmp/rfbcalc
    python scripts/rfb/gerar_carga_cclasstrib.py --calc-repo /tmp/rfbcalc \
        --out supabase/migrations/20261124110000_carga_catalogo_cclasstrib_rfb.sql

Mapeamento (coluna oficial -> coluna nossa):
    CLTR_CD                    -> cclasstrib
    SITUACAO_TRIBUTARIA.SITR_CD -> cst            (via CLTR_SITR_ID)
    CLTR_DESCRICAO             -> descricao
    SITR_IND_GIBSCBS           -> exige_gibscbs   (1 = grupo IBS/CBS obrigatorio)
    SITR_IND_GDIF              -> ind_dir
    PERCENTUAL_REDUCAO.PERE_VALOR / 100
                               -> p_red_cbs (TBTO 2), p_red_ibs_uf (TBTO 3),
                                  p_red_ibs_mun (TBTO 4)
    CLTR_INICIO_VIGENCIA       -> inicio_vigencia
    CLTR_FIM_VIGENCIA          -> fim_vigencia
    VERSAO_BASE_DADO (ultima)  -> versao_it

PERE_VALOR vem em pontos percentuais (100.0 = 100%); a coluna nossa e fracao
decimal (0-1), mesmo padrao das etapas 33-34. Por isso a divisao por 100.
"""

import argparse
import glob
import os
import sqlite3
import tempfile
from datetime import datetime, timezone

MIGRATIONS_PATH = ("flyway", "sql")

SELECT = """
select
    ct.CLTR_CD                                      as cclasstrib,
    st.SITR_CD                                      as cst,
    ct.CLTR_DESCRICAO                               as descricao,
    ct.CLTR_INICIO_VIGENCIA                         as inicio_vigencia,
    ct.CLTR_FIM_VIGENCIA                            as fim_vigencia,
    coalesce(st.SITR_IND_GIBSCBS, 0)                as exige_gibscbs,
    st.SITR_IND_GDIF                                as ind_dir,
    (select p.PERE_VALOR from PERCENTUAL_REDUCAO p
      where p.PERE_CLTR_ID = ct.CLTR_ID and p.PERE_TBTO_ID = 2
      order by p.PERE_INICIO_VIGENCIA desc limit 1) as red_cbs,
    (select p.PERE_VALOR from PERCENTUAL_REDUCAO p
      where p.PERE_CLTR_ID = ct.CLTR_ID and p.PERE_TBTO_ID = 3
      order by p.PERE_INICIO_VIGENCIA desc limit 1) as red_ibs_uf,
    (select p.PERE_VALOR from PERCENTUAL_REDUCAO p
      where p.PERE_CLTR_ID = ct.CLTR_ID and p.PERE_TBTO_ID = 4
      order by p.PERE_INICIO_VIGENCIA desc limit 1) as red_ibs_mun
from CLASSIFICACAO_TRIBUTARIA ct
join SITUACAO_TRIBUTARIA st on st.SITR_ID = ct.CLTR_SITR_ID
order by ct.CLTR_CD, ct.CLTR_INICIO_VIGENCIA
"""


def montar_base(calc_repo: str, db_path: str) -> sqlite3.Connection:
    """Reaplica as migracoes Flyway oficiais em um SQLite novo.

    `PRAGMA foreign_keys=OFF` a cada script: as migracoes usam
    `defer_foreign_keys` e o replay fora do Flyway commita por script, o que
    faria a checagem diferida disparar no meio da sequencia.
    """
    con = sqlite3.connect(db_path)
    con.isolation_level = None
    cur = con.cursor()

    def run(path: str) -> None:
        with open(path, encoding="utf-8") as fh:
            sql = fh.read()
        try:
            cur.executescript("PRAGMA foreign_keys=OFF;\n" + sql + "\nPRAGMA foreign_keys=OFF;")
        except sqlite3.Error as exc:
            raise SystemExit(f"falhou ao aplicar {os.path.basename(path)}: {exc}")

    base = os.path.join(calc_repo, *MIGRATIONS_PATH)
    run(os.path.join(base, "criacao", "beforeMigrate.sql"))
    for nome in sorted(glob.glob(os.path.join(base, "criacao", "B*.sql"))):
        run(nome)
    for nome in sorted(glob.glob(os.path.join(base, "manutencao", "*.sql"))):
        run(nome)
    return con


def sql_text(valor) -> str:
    if valor is None:
        return "null"
    return "'" + str(valor).replace("'", "''") + "'"


def fracao(valor) -> str:
    if valor is None:
        return "0.0000"
    return f"{round(float(valor) / 100.0, 4):.4f}"


def gerar(con: sqlite3.Connection, commit: str) -> str:
    cur = con.cursor()
    versao = cur.execute(
        "select VRBD_VERSAO_BASE_DADO from VERSAO_BASE_DADO order by VRBD_ID desc limit 1"
    ).fetchone()[0]
    descricao_versao = cur.execute(
        "select VRBD_DESCRICAO from VERSAO_BASE_DADO order by VRBD_ID desc limit 1"
    ).fetchone()[0]
    linhas = cur.execute(SELECT).fetchall()

    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = []
    out.append("-- Carga inicial de `public.catalogo_cclasstrib` a partir da base oficial da RFB.")
    out.append("--")
    out.append("-- Gerado por scripts/rfb/gerar_carga_cclasstrib.py (nao editar a mao).")
    out.append("-- Fonte: ReceitaFederal/calculadora-rtc-regime-regular (MIT), base de dados")
    out.append("-- construida pelas migracoes Flyway do proprio repositorio oficial.")
    out.append(f"-- Commit de origem: {commit}")
    out.append(f"-- Versao da base: {versao} ({descricao_versao})")
    out.append(f"-- Gerado em: {hoje}")
    out.append("--")
    out.append("-- Sem esta carga o catalogo fica vazio e a validacao de cClassTrib")
    out.append("-- (etapa 46) nao tem referencia para comparar: `cclasstribCarregado`")
    out.append("-- falso suprime o alerta REG-013 por desenho. A divergencia e alerta,")
    out.append("-- nunca bloqueio da importacao.")
    out.append("--")
    out.append("-- PERE_VALOR vem em pontos percentuais (100.0 = 100%); p_red_* e fracao")
    out.append("-- decimal (0-1), mesmo padrao das etapas 33-34.")
    out.append("--")
    out.append("-- Idempotente: upsert por (cclasstrib, inicio_vigencia), a PK corrigida")
    out.append("-- em 20261122023500_corrige_pk_catalogo_cclasstrib_vigencia.sql.")
    out.append("")
    out.append("insert into public.catalogo_cclasstrib")
    out.append("  (cclasstrib, cst, descricao, p_red_cbs, p_red_ibs_uf, p_red_ibs_mun,")
    out.append("   exige_gibscbs, ind_dir, inicio_vigencia, fim_vigencia, versao_it)")
    out.append("values")
    linhas_sql = []
    for (cd, cst, desc, ini, fim, gibscbs, ind_dir, rcbs, ruf, rmun) in linhas:
        linhas_sql.append(
            "  ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})".format(
                sql_text(cd),
                sql_text(cst),
                sql_text(desc),
                fracao(rcbs),
                fracao(ruf),
                fracao(rmun),
                "true" if gibscbs else "false",
                "null" if ind_dir is None else int(ind_dir),
                sql_text(ini),
                sql_text(fim),
                sql_text(versao),
            )
        )
    out.append(",\n".join(linhas_sql))
    out.append("on conflict (cclasstrib, inicio_vigencia) do update set")
    out.append("  cst = excluded.cst,")
    out.append("  descricao = excluded.descricao,")
    out.append("  p_red_cbs = excluded.p_red_cbs,")
    out.append("  p_red_ibs_uf = excluded.p_red_ibs_uf,")
    out.append("  p_red_ibs_mun = excluded.p_red_ibs_mun,")
    out.append("  exige_gibscbs = excluded.exige_gibscbs,")
    out.append("  ind_dir = excluded.ind_dir,")
    out.append("  fim_vigencia = excluded.fim_vigencia,")
    out.append("  versao_it = excluded.versao_it;")
    out.append("")
    return "\n".join(out), len(linhas), versao


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--calc-repo", required=True, help="clone do calculadora-rtc-regime-regular")
    ap.add_argument("--out", required=True, help="caminho do .sql a gerar")
    ap.add_argument("--commit", default="desconhecido", help="commit de origem, para o cabecalho")
    args = ap.parse_args()

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        con = montar_base(args.calc_repo, os.path.join(tmp, "calc.db"))
        sql, total, versao = gerar(con, args.commit)
        con.close()
    with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(sql)
    print(f"{total} linhas, versao {versao} -> {args.out}")


if __name__ == "__main__":
    main()