"""Regressões offline do índice único (indice.py): fixtures em tmpdir, relógio congelado, sem rede."""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("indice.py")
SPEC = importlib.util.spec_from_file_location("context_rules_indice", SCRIPT)
indice = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(indice)

AGORA = datetime(2026, 1, 10, 12, 0, tzinfo=timezone.utc)
HEAD = "a" * 40
FONTES = ["--fonte", "banco real=docs/contexto/supabase", "--fonte", "código=docs/contexto/codigo",
          "--fonte", "regras de negócio=docs/contexto/regras"]


class Fixture(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="indice-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name) / "pub"
        self.root.mkdir()
        self.out = self.root / "docs/contexto/00-INDEX.md"

    def fonte(self, pasta, manifest=None, arquivos=("README.md",)):
        d = self.root / "docs/contexto" / pasta
        d.mkdir(parents=True, exist_ok=True)
        for name in arquivos:
            (d / name).parent.mkdir(parents=True, exist_ok=True)
            (d / name).write_text(f"# {name}\n", encoding="utf-8")
        if manifest is not None:
            (d / "manifest.json").write_text(manifest if isinstance(manifest, str) else json.dumps(manifest), encoding="utf-8")
        return d

    def tres_fontes(self):
        self.fonte("regras", {"gerado_em": "2026-01-10 11:50 UTC", "commit": HEAD, "entrada": "07-REGRAS-DE-NEGOCIO.md"},
                   ("07-REGRAS-DE-NEGOCIO.md", "10-ACESSO-E-SEGURANCA.md", "context.json", "manual/regras.md"))
        self.fonte("codigo", {"gerado_em": "2026-01-10T11:55:00.000Z", "commit": HEAD, "erros": []}, ("00-INDEX.md", "rotas.md"))
        self.fonte("supabase", {"gerado_em": "2026-01-10T11:30:00Z"}, ("README.md", "tabelas.md"))

    def rodar(self, *extra, agora=AGORA, fontes=None, head=HEAD, remote="dono/repo", git=None, out="docs/contexto/00-INDEX.md", repo=None):
        argv = [str(SCRIPT), "--repo", str(repo or self.root), "--out", out]
        if head is not None:
            argv += ["--head", head]
        if remote is not None:
            argv += ["--remote", remote]
        argv += list(FONTES if fontes is None else fontes) + list(extra)

        class Relogio(datetime):
            @classmethod
            def now(cls, tz=None):
                return agora.astimezone(tz) if tz is not None else agora.replace(tzinfo=None)

        stderr = io.StringIO()
        with mock.patch.object(sys, "argv", argv), mock.patch.object(indice, "datetime", Relogio), \
                mock.patch.object(indice, "git", side_effect=git or (lambda *a: "")), contextlib.redirect_stderr(stderr):
            try:
                code = indice.main()
            except SystemExit as error:
                code = error.code
        return code, stderr.getvalue()

    def texto(self):
        return self.out.read_text(encoding="utf-8")

    def fontes_na_tabela(self):
        return re.findall(r"^\|.*\| \*\*([^*|]+)\*\* \|", self.texto(), re.MULTILINE)

    def linha(self, nome):
        """Células da linha da tabela 'Onde está cada coisa' da fonte: (onde ler, estado)."""
        for line in self.texto().splitlines():
            if f"| **{nome}** |" in line:
                cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
                return cells[-2], cells[-1]
        self.fail(f"fonte {nome} não está no índice")


class IndiceFelizTests(Fixture):
    def test_tres_fontes_atuais(self):
        self.tres_fontes()
        code, stderr = self.rodar()
        self.assertEqual(code, 0)
        self.assertIn("(3 fontes: banco real=ok, código=ok, regras de negócio=ok)", stderr)
        text = self.texto()
        self.assertTrue(text.startswith("# CONTEXTO PARA AGENTES DE IA — ÍNDICE ÚNICO\n\n> Gerado automaticamente por indice.py · 2026-01-10 12:00 UTC · HEAD `aaaaaaaaaa` · Não edite à mão.\n"))
        self.assertTrue(text.endswith("</details>\n"))
        self.assertEqual(self.linha("regras de negócio"), ("`docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`", "ok · 10 min atrás"))
        self.assertEqual(self.linha("código"), ("`docs/contexto/codigo/00-INDEX.md`", "ok · 5 min atrás"))
        self.assertEqual(self.linha("banco real"), ("`docs/contexto/supabase/README.md`", "ok · 30 min atrás"))
        # a ordem de leitura é fixa: regras, banco, código — independe da ordem das --fonte
        self.assertEqual(self.fontes_na_tabela(), ["regras de negócio", "banco real", "código"])
        self.assertIn("1. **regras de negócio** — Qualquer mudança de comportamento", text)
        self.assertIn("3. **código** — Vou mexer em tela/rota/hook/edge", text)
        self.assertIn("<details><summary>Arquivos de <b>regras de negócio</b> (`docs/contexto/regras/`)</summary>", text)
        for expected in ("- `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`", "- `docs/contexto/regras/manual/regras.md`",
                         "- `docs/contexto/regras/manifest.json`", "- `docs/contexto/codigo/rotas.md`"):
            self.assertIn(expected, text)

    def test_lista_so_md_e_json_visiveis_e_corta_em_80(self):
        self.fonte("supabase", {"gerado_em": "2026-01-10T11:30:00Z"},
                   ["README.md", ".oculto.md", "schema.sql", "dados.txt"] + [f"t/tabela_{i:03d}.md" for i in range(90)])
        self.assertEqual(self.rodar(fontes=["--fonte", "banco real=docs/contexto/supabase"])[0], 0)
        text = self.texto()
        self.assertNotIn(".oculto.md", text)
        self.assertNotIn("schema.sql", text)
        self.assertNotIn("dados.txt", text)
        self.assertEqual(text.count("- `docs/contexto/supabase/"), 80)
        self.assertIn("- … +12\n", text)

    def test_fonte_desconhecida_entra_depois_das_tres_com_descricao_generica(self):
        self.tres_fontes()
        self.fonte("extras", {"gerado_em": "2026-01-10T11:59:00Z"})
        code, _ = self.rodar(fontes=["--fonte", "relatórios=docs/contexto/extras"] + FONTES)
        self.assertEqual(code, 0)
        text = self.texto()
        self.assertEqual(self.fontes_na_tabela(), ["regras de negócio", "banco real", "código", "relatórios"])
        self.assertIn("| Saída de `docs/contexto/extras` | **relatórios** | `docs/contexto/extras/README.md` | ok · 1 min atrás |", text)
        self.assertIn("4. **relatórios** — conforme a tarefa.", text)

    def test_titulo_customizado_com_acentos(self):
        self.tres_fontes()
        self.assertEqual(self.rodar("--titulo", "ÍNDICE — Promoção & Ação")[0], 0)
        self.assertTrue(self.out.read_bytes().decode("utf-8").startswith("# ÍNDICE — Promoção & Ação\n"))

    def test_execucao_real_por_subprocesso(self):
        self.tres_fontes()
        result = subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", "docs/contexto/00-INDEX.md", "--head", HEAD,
                                 "--remote", "dono/repo", *FONTES], capture_output=True, text=True, timeout=60,
                                env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}, check=False)
        self.assertEqual((result.returncode, result.stdout), (0, ""))
        self.assertIn("[indice] escrito", result.stderr)
        self.assertIn("**regras de negócio**", self.texto())
        ajuda = subprocess.run([sys.executable, str(SCRIPT), "--help"], capture_output=True, text=True, timeout=60, check=False)
        self.assertEqual(ajuda.returncode, 0)
        self.assertIn("scripts/regras_negocio/indice.py", ajuda.stdout)


class FonteAusenteTests(Fixture):
    def test_fonte_que_nao_rodou_e_fonte_em_outra_branch(self):
        self.fonte("regras", {"gerado_em": "2026-01-10 11:50 UTC", "commit": HEAD})
        (self.root / "docs/contexto/codigo").mkdir(parents=True)  # pasta vazia = produtor não rodou
        code, stderr = self.rodar(fontes=FONTES + ["--fonte", "histórico=inventario/ia@contexto-ia"])
        self.assertEqual(code, 0)
        self.assertIn("banco real=ainda não gerado, código=ainda não gerado, regras de negócio=ok, histórico=não disponível neste checkout", stderr)
        self.assertEqual(self.linha("banco real"), ("`docs/contexto/supabase/` (ainda não existe — o produtor não rodou)", "ainda não gerado"))
        self.assertEqual(self.linha("código")[1], "ainda não gerado")
        onde, estado = self.linha("histórico")
        self.assertEqual(estado, "não disponível neste checkout")
        self.assertEqual(onde, "branch `contexto-ia`: `git fetch origin contexto-ia && git show origin/contexto-ia:inventario/ia/<arquivo>`"
                               " · MCP `get_file(ref=contexto-ia)` · raw `https://raw.githubusercontent.com/dono/repo/contexto-ia/inventario/ia/<arquivo>`")
        self.assertNotIn("Arquivos de <b>banco real</b>", self.texto())

    def test_pasta_so_com_manual_nao_conta_como_gerada(self):
        # Regressão: o publicar copia regras/manual/ da main mesmo sem artefato; o índice dizia "ok".
        self.fonte("regras", None, ("manual/README.md", "manual/regras.md"))
        code, stderr = self.rodar(git=lambda *a: "2026-01-10T11:00:00+00:00" if "log" in a else "")
        self.assertEqual(code, 0)
        self.assertIn("regras de negócio=ainda não gerado", stderr)
        self.assertEqual(self.linha("regras de negócio"), ("`docs/contexto/regras/` (ainda não existe — o produtor não rodou)", "ainda não gerado"))

    def test_nenhuma_fonte_presente_ainda_gera_o_indice(self):
        code, stderr = self.rodar()
        self.assertEqual(code, 0)
        self.assertIn("banco real=ainda não gerado, código=ainda não gerado, regras de negócio=ainda não gerado", stderr)
        self.assertNotIn("<details>", self.texto())


class ManifestTests(Fixture):
    def test_manifest_ilegivel_ou_que_nao_e_objeto_vira_nao_verificavel(self):
        cases = [("{ isto não é json", "manifest.json ilegível"), ("[1, 2]", "manifest.json não contém um objeto JSON"),
                 ('"texto"', "manifest.json não contém um objeto JSON"), ("", "manifest.json ilegível")]
        for raw, aviso in cases:
            with self.subTest(raw=raw):
                self.fonte("supabase", raw)
                self.assertEqual(self.rodar()[0], 0)
                self.assertEqual(self.linha("banco real"), ("`docs/contexto/supabase/README.md`", f"não verificável · ⚠️ {aviso}"))

    def test_manifest_com_bytes_invalidos_ou_que_e_diretorio(self):
        d = self.fonte("supabase")
        (d / "manifest.json").write_bytes(b"\xff\xfe{}")
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "não verificável · ⚠️ manifest.json ilegível")
        (d / "manifest.json").unlink()
        (d / "manifest.json").mkdir()
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "não verificável · ⚠️ manifest.json ilegível")

    def test_entrada_malformada_nao_derruba_o_indice(self):
        # Regressão: "entrada": 123 (ou lista) fazia `d / cand` estourar TypeError e nenhum índice saía.
        d = self.fonte("codigo", arquivos=("README.md", "mapa.md", "sub/x.md"))
        (self.root / "docs/contexto/fora.md").write_text("fora\n", encoding="utf-8")
        for entrada, esperado in ((123, "README.md"), (["mapa.md"], "README.md"), ({"a": 1}, "README.md"), ("../fora.md", "README.md"),
                                  ("sub", "README.md"), ("nao-existe.md", "README.md"), ("mapa.md", "mapa.md"), ("sub/x.md", "sub/x.md")):
            with self.subTest(entrada=entrada):
                (d / "manifest.json").write_text(json.dumps({"gerado_em": "2026-01-10T11:55:00Z", "commit": HEAD, "entrada": entrada}), encoding="utf-8")
                self.assertEqual(self.rodar()[0], 0)
                self.assertEqual(self.linha("código"), (f"`docs/contexto/codigo/{esperado}`", "ok · 5 min atrás"))

    def test_entrada_cai_no_primeiro_md_quando_nao_ha_indice_nem_readme(self):
        self.fonte("codigo", {"gerado_em": "2026-01-10T11:55:00Z", "commit": HEAD}, ("zebra.md", "abelha.md"))
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("código")[0], "`docs/contexto/codigo/abelha.md`")

    def test_campos_de_tipo_errado_no_manifest(self):
        self.fonte("codigo", {"gerado_em": 5, "commit": 7, "erros": "falhou", "carried": 0})
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("código")[1], "parcial · ⚠️ 1 erro(s) de coleta no manifest (erros); sem data de geração (manifest sem `gerado_em`); "
                                                  "gerado no commit `7`, HEAD é `aaaaaaa`")

    def test_erros_de_coleta_e_reaproveitamento_viram_parcial(self):
        cases = [({"erros": ["a", "b"]}, "parcial · 5 min atrás · ⚠️ 2 erro(s) de coleta no manifest (erros)"),
                 ({"errors": {"x": 1}}, "parcial · 5 min atrás · ⚠️ 1 erro(s) de coleta no manifest (errors)"),
                 ({"erros_do_gerador": 3}, "parcial · 5 min atrás · ⚠️ 1 erro(s) de coleta no manifest (erros_do_gerador)"),
                 ({"carried": ["cron"]}, "parcial · 5 min atrás · ⚠️ seções reaproveitadas da coleta anterior"),
                 ({"erros": [], "carried": []}, "ok · 5 min atrás")]
        for extra, estado in cases:
            with self.subTest(extra=extra):
                self.fonte("supabase", {"gerado_em": "2026-01-10T11:55:00Z", **extra})
                self.assertEqual(self.rodar()[0], 0)
                self.assertEqual(self.linha("banco real")[1], estado)

    def test_errors_md_do_snapshot(self):
        d = self.fonte("supabase", {"gerado_em": "2026-01-10T11:55:00Z"})
        (d / "errors.md").write_text("# Erros\n\n| Seção | Erro |\n|---|---|\n", encoding="utf-8")
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "ok · 5 min atrás")
        (d / "errors.md").write_text("# Erros\n\n| Seção | Erro |\n|---|---|\n| cron | timeout |\n| lints | negado |\n", encoding="utf-8")
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "parcial · 5 min atrás · ⚠️ 2 seção(ões) com erro em errors.md")
        (d / "errors.md").write_bytes(b"\xff\xfe| a |")
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "não verificável · 5 min atrás · ⚠️ errors.md ilegível")


class IdadeECommitTests(Fixture):
    def test_formatos_de_data_aceitos(self):
        esperado = datetime(2026, 1, 10, 11, 50, tzinfo=timezone.utc)
        for raw in ("2026-01-10 11:50 UTC", "2026-01-10 11:50:00 UTC", "2026-01-10T11:50 UTC", "2026-01-10T11:50:00Z", "2026-01-10T11:50:00.000Z",
                    "2026-01-10T11:50:00+00:00", "2026-01-10T08:50:00-03:00", "2026-01-10T11:50:00.123456+00:00", "2026-01-10 11:50:00", "2026-01-10 11:50"):
            with self.subTest(raw=raw):
                self.assertEqual(indice.parse_dt(raw).replace(microsecond=0), esperado)
        for raw in (None, 5, "", "ontem", "2026-13-45 99:99 UTC", ["2026-01-10 11:50 UTC"]):
            with self.subTest(raw=raw):
                self.assertIsNone(indice.parse_dt(raw))

    def test_banco_real_fica_desatualizado_pela_idade(self):
        self.fonte("supabase", {"gerado_em": "2026-01-10T10:29:00Z", "commit": "b" * 40})
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "desatualizado · 91 min atrás · ⚠️ desatualizado há 1h31")  # commit do banco não é comparado
        self.assertEqual(self.rodar("--stale-min", "120")[0], 0)
        self.assertEqual(self.linha("banco real")[1], "ok · 91 min atrás")
        self.assertEqual(self.rodar(agora=AGORA + timedelta(hours=5))[0], 0)
        self.assertEqual(self.linha("banco real")[1], "desatualizado · 6h atrás · ⚠️ desatualizado há 6h31")

    def test_codigo_e_regras_no_mesmo_commit_continuam_atuais_apesar_da_idade(self):
        self.fonte("codigo", {"gerado_em": "2026-01-08T12:00:00Z", "commit": HEAD})
        self.fonte("regras", {"gerado_em": "2026-01-08 12:00 UTC", "commit": HEAD[:7]})
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("código")[1], "ok · 48h atrás")
        self.assertEqual(self.linha("regras de negócio")[1], "ok · 48h atrás")

    def test_commit_diferente_do_head_marca_desatualizado(self):
        self.fonte("codigo", {"gerado_em": "2026-01-10T11:55:00Z", "commit": "b" * 40})
        self.fonte("regras", {"gerado_em": "2026-01-10 11:55 UTC", "commit": HEAD[:6]})  # prefixo curto demais não prova nada
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("código")[1], "desatualizado · 5 min atrás · ⚠️ gerado no commit `bbbbbbb`, HEAD é `aaaaaaa`")
        self.assertEqual(self.linha("regras de negócio")[1], "desatualizado · 5 min atrás · ⚠️ gerado no commit `aaaaaa`, HEAD é `aaaaaaa`")

    def test_head_vazio_fora_de_git_nao_inventa_divergencia(self):
        self.fonte("codigo", {"gerado_em": "2026-01-10T11:55:00Z", "commit": "b" * 40})
        code, _ = self.rodar(head="")
        self.assertEqual(code, 0)
        self.assertIn("· HEAD `n/d` ·", self.texto())
        self.assertEqual(self.linha("código")[1], "ok · 5 min atrás")

    def test_head_omitido_usa_o_git_do_repo(self):
        self.fonte("codigo", {"gerado_em": "2026-01-10T11:55:00Z", "commit": "c" * 40})
        code, _ = self.rodar(head=None, git=lambda *a: "c" * 40 if a[1:] == ("rev-parse", "HEAD") else "")
        self.assertEqual(code, 0)
        self.assertIn("· HEAD `cccccccccc` ·", self.texto())
        self.assertEqual(self.linha("código")[1], "ok · 5 min atrás")

    def test_data_no_futuro_nao_e_aceita_como_idade(self):
        # Regressão: gerado_em em 2099 saía como "ok · -37944037 min atrás".
        self.fonte("supabase", {"gerado_em": "2099-01-01T00:00:00Z"})
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "não verificável · ⚠️ `gerado_em` no futuro — data não confiável")
        self.assertNotIn("-", self.linha("banco real")[1].split("⚠️")[0])
        self.fonte("supabase", {"gerado_em": "2026-01-10T12:03:00Z"})  # relógio do runner alguns minutos adiantado
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "ok · 0 min atrás")

    def test_fonte_sem_data_nao_passa_por_ok(self):
        # Regressão: manifest sem gerado_em nunca envelhecia e ficava "ok" para sempre.
        self.fonte("supabase", {"projeto": "x"})
        self.fonte("codigo", {"commit": HEAD})
        self.fonte("regras", {"commit": "b" * 40})
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "não verificável · ⚠️ sem data de geração (manifest sem `gerado_em`)")
        self.assertEqual(self.linha("código")[1], "ok")  # mesmo commit do HEAD: atual por definição
        self.assertEqual(self.linha("regras de negócio")[1],
                         "não verificável · ⚠️ sem data de geração (manifest sem `gerado_em`); gerado no commit `bbbbbbb`, HEAD é `aaaaaaa`")

    def test_sem_manifest_a_data_vem_do_changelog_e_depois_do_git(self):
        d = self.fonte("supabase", None, ("README.md",))
        (d / "CHANGELOG.md").write_text("# Changelog\n\n## 2026-01-10 11:40 UTC\n- x\n\n## 2026-01-09 08:00 UTC\n- y\n", encoding="utf-8")
        chamadas = []
        code, _ = self.rodar(git=lambda *a: chamadas.append(a) or "")
        self.assertEqual(code, 0)
        self.assertEqual(self.linha("banco real")[1], "ok · 20 min atrás")
        self.assertEqual(chamadas, [])
        (d / "CHANGELOG.md").write_text("# Changelog\n\nsem datas\n", encoding="utf-8")
        self.out.unlink()  # só a idade muda; sem apagar, o índice anterior seria mantido
        code, _ = self.rodar(git=lambda *a: "2026-01-10T08:45:00-03:00" if a[1:4] == ("log", "-1", "--format=%cI") else "")
        self.assertEqual(code, 0)
        self.assertEqual(self.linha("banco real")[1], "ok · 15 min atrás")


class EscritaTests(Fixture):
    def test_so_idade_mudou_nao_reescreve_mas_mudanca_de_estado_reescreve(self):
        self.tres_fontes()
        self.assertEqual(self.rodar()[0], 0)
        first = self.out.read_bytes()
        code, stderr = self.rodar(agora=AGORA + timedelta(minutes=20))
        self.assertEqual(code, 0)
        self.assertIn("sem mudança estrutural — não reescrito", stderr)
        self.assertEqual(self.out.read_bytes(), first)
        code, stderr = self.rodar(agora=AGORA + timedelta(minutes=90))  # banco real passa do limite de 90 min
        self.assertEqual(code, 0)
        self.assertIn("banco real=desatualizado", stderr)
        self.assertNotEqual(self.out.read_bytes(), first)
        code, stderr = self.rodar(agora=AGORA + timedelta(minutes=95), head="b" * 40)  # HEAD novo também é estrutural
        self.assertIn("código=desatualizado", stderr)
        self.assertIn("· HEAD `bbbbbbbbbb` ·", self.texto())

    def test_indice_anterior_com_bytes_invalidos_e_substituido(self):
        # Regressão: UnicodeDecodeError ao comparar com o índice antigo impedia qualquer nova publicação.
        self.tres_fontes()
        self.out.parent.mkdir(parents=True, exist_ok=True)
        self.out.write_bytes(b"\xff\xfe\x00lixo")
        self.assertEqual(self.rodar()[0], 0)
        self.assertTrue(self.texto().startswith("# CONTEXTO PARA AGENTES DE IA"))

    def test_cria_a_pasta_de_saida(self):
        self.tres_fontes()
        code, _ = self.rodar(out="novo/nivel/INDEX.md")
        self.assertEqual(code, 0)
        self.assertTrue((self.root / "novo/nivel/INDEX.md").is_file())


class RemoteTests(Fixture):
    def onde(self, url):
        self.fonte("regras", {"gerado_em": "2026-01-10 11:50 UTC", "commit": HEAD})
        code, _ = self.rodar(remote=None, fontes=FONTES + ["--fonte", "histórico=inventario/ia@contexto-ia"],
                             git=lambda *a: url if a[1:] == ("config", "--get", "remote.origin.url") else "")
        self.assertEqual(code, 0)
        return self.linha("histórico")[0]

    def test_remote_do_github_vira_owner_repo_sem_credencial(self):
        for url in ("https://github.com/dono/repo.git", "git@github.com:dono/repo.git", "https://x-access-token:ghs_SEGREDO123@github.com/dono/repo.git",
                    "https://github.com/dono/repo"):
            with self.subTest(url=url):
                onde = self.onde(url)
                self.assertIn("raw `https://raw.githubusercontent.com/dono/repo/contexto-ia/inventario/ia/<arquivo>`", onde)
                self.assertNotIn("SEGREDO", self.texto())

    def test_remote_de_outro_host_ou_vazio_nao_vira_link_nem_vaza_credencial(self):
        # Regressão: URL fora do github.com entrava inteira (com usuário:senha) no link raw publicado.
        for url in ("https://usuario:s3nh4@gitlab.example.com/dono/repo.git", "", "ssh://git@host.interno:2222/repo.git"):
            with self.subTest(url=url):
                onde = self.onde(url)
                self.assertEqual(onde, "branch `contexto-ia`: `git fetch origin contexto-ia && git show origin/contexto-ia:inventario/ia/<arquivo>`")
                self.assertNotIn("s3nh4", self.texto())
                self.assertNotIn("raw.githubusercontent.com", self.texto())

    def test_remote_invalido_na_flag_tambem_e_descartado(self):
        self.fonte("regras", {"gerado_em": "2026-01-10 11:50 UTC", "commit": HEAD})
        code, _ = self.rodar(remote="https://u:p@host/x/y.git", fontes=FONTES + ["--fonte", "histórico=inventario/ia@contexto-ia"])
        self.assertEqual(code, 0)
        self.assertNotIn("u:p@", self.texto())


class ArgumentosTests(Fixture):
    def test_argumentos_invalidos_saem_com_2_sem_escrever(self):
        self.tres_fontes()
        (self.root / "pasta.md").mkdir()
        cases = [
            ({"fontes": []}, "informe ao menos uma --fonte"),
            ({"fontes": ["--fonte", "sem-igual"]}, "fonte inválida: sem-igual"),
            ({"fontes": ["--fonte", "=docs/contexto/regras"]}, "fonte inválida"),
            ({"fontes": ["--fonte", "x="]}, "fonte inválida"),
            ({"fontes": ["--fonte", "x=."]}, "fonte inválida"),
            ({"fontes": ["--fonte", "x=/"]}, "fonte inválida"),
            ({"fontes": ["--fonte", "x=../fora"]}, "fonte inválida"),
            ({"fontes": ["--fonte", "x=docs/../../fora"]}, "fonte inválida"),
            ({"fontes": ["--fonte", "x=docs", "--fonte", "x=docs/contexto"]}, "fonte inválida"),
            ({"repo": self.root / "nao-existe"}, "--repo não é um diretório"),
            ({"out": "pasta.md"}, "--out é um diretório"),
            ({"extra": ("--stale-min", "abc")}, "invalid int value"),
            ({"extra": ("--flag-que-nao-existe",)}, "unrecognized arguments"),
        ]
        before = sorted(p.relative_to(self.root).as_posix() for p in self.root.rglob("*"))
        for kwargs, message in cases:
            with self.subTest(kwargs=kwargs):
                extra = kwargs.pop("extra", ())
                code, stderr = self.rodar(*extra, **kwargs)
                self.assertEqual(code, 2, stderr)
                self.assertIn(message, stderr)
        self.assertEqual(sorted(p.relative_to(self.root).as_posix() for p in self.root.rglob("*")), before)
        self.assertFalse(self.out.exists())
        self.assertFalse((self.root / "nao-existe").exists())

    def test_caminho_com_barras_e_espacos_nas_bordas_e_normalizado(self):
        self.tres_fontes()
        code, _ = self.rodar(fontes=["--fonte", " regras de negócio = /docs/contexto/regras/ "])
        self.assertEqual(code, 0)
        self.assertEqual(self.linha("regras de negócio")[0], "`docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`")

    def test_repo_com_espaco_e_acento_no_caminho(self):
        self.root = self.root.parent / "pub com espaço e ação"
        self.root.mkdir()
        self.out = self.root / "docs/contexto/00-INDEX.md"
        self.tres_fontes()
        self.assertEqual(self.rodar()[0], 0)
        self.assertEqual(self.linha("banco real")[1], "ok · 30 min atrás")


if __name__ == "__main__":
    unittest.main()
