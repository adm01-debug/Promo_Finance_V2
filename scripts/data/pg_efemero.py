#!/usr/bin/env python3
"""
pg_efemero.py — Postgres descartável para os testes de cenário (stdlib).

Os scripts de scripts/data, scripts/integrity e scripts/healthcheck só mostram
seus defeitos contra um banco de verdade (COPY, TRUNCATE CASCADE, catálogo,
saída real do psql). Este módulo sobe um cluster local em diretório temporário,
escutando só em 127.0.0.1, e apaga tudo ao final. Nunca conecta em banco real.

Uso (dentro de um TestCase):
    pg = PgEfemero()            # levanta SkipTest se não houver Postgres local
    pg.criar_db("prod"); pg.psql("prod", "CREATE TABLE ...")
    pg.url("prod")              # connection string para os scripts
    pg.parar()

Env opcionais: PG_EFEMERO_PORTA (default: porta livre), PG_EFEMERO_DIR
(diretório-pai do cluster; default: tempdir do sistema).
"""
import glob
import os
import shutil
import socket
import subprocess
import tempfile
import unittest


def _bin(nome):
    achado = shutil.which(nome)
    if achado:
        return achado
    candidatos = glob.glob(f"/usr/lib/postgresql/*/bin/{nome}")
    candidatos.sort(key=lambda c: int(c.split("/")[4]) if c.split("/")[4].isdigit() else 0)
    return candidatos[-1] if candidatos else None


def _porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class PgEfemero:
    def __init__(self):
        initdb, self._pg_ctl = _bin("initdb"), _bin("pg_ctl")
        if not (initdb and self._pg_ctl and shutil.which("psql")):
            raise unittest.SkipTest("Postgres local (initdb/pg_ctl/psql) indisponível")
        # O postgres recusa rodar como root; em contêiner root usamos um user
        # namespace (sem tocar em permissões de diretório nem criar usuário).
        self._prefixo = []
        if os.geteuid() == 0:
            if not shutil.which("unshare"):
                raise unittest.SkipTest("root sem `unshare`: Postgres não inicia")
            self._prefixo = ["unshare", "-U", "--map-user=65534", "--map-group=65534"]
        self.porta = int(os.environ.get("PG_EFEMERO_PORTA") or _porta_livre())
        self.dir = tempfile.mkdtemp(prefix="pg-efemero-", dir=os.environ.get("PG_EFEMERO_DIR") or None)
        dados = os.path.join(self.dir, "data")
        opcoes = (f"-p {self.porta} -c listen_addresses=127.0.0.1 "
                  "-c unix_socket_directories= -c fsync=off")
        try:
            subprocess.run(
                self._prefixo + [initdb, "-D", dados, "-U", "postgres", "-A", "trust",
                                 "-E", "UTF8", "--locale=C"],
                check=True, capture_output=True, text=True, timeout=120)
            subprocess.run(
                self._prefixo + [self._pg_ctl, "-D", dados, "-l", os.path.join(self.dir, "pg.log"),
                                 "-w", "-t", "60", "-o", opcoes, "start"],
                check=True, capture_output=True, text=True, timeout=120)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError) as e:
            shutil.rmtree(self.dir, ignore_errors=True)
            detalhe = getattr(e, "stderr", "") or str(e)
            raise unittest.SkipTest(f"Postgres efêmero não subiu: {detalhe[:300]}")

    def url(self, db="postgres", extra=""):
        return f"postgresql://postgres@127.0.0.1:{self.porta}/{db}{extra}"

    def psql(self, db, sql, check=True):
        """Roda SQL e devolve o stdout (-At). Com check=True, erro vira exceção."""
        r = subprocess.run(
            ["psql", self.url(db), "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql],
            capture_output=True, text=True, timeout=60)
        if check and r.returncode != 0:
            raise AssertionError(f"psql falhou ({db}): {r.stderr}\nSQL: {sql[:400]}")
        return r.stdout.strip()

    def criar_db(self, nome):
        self.psql("postgres", f'DROP DATABASE IF EXISTS "{nome}"')
        self.psql("postgres", f'CREATE DATABASE "{nome}"')

    def parar(self):
        dados = os.path.join(self.dir, "data")
        subprocess.run(self._prefixo + [self._pg_ctl, "-D", dados, "-m", "immediate", "-w", "stop"],
                       capture_output=True, text=True, timeout=60)
        shutil.rmtree(self.dir, ignore_errors=True)
