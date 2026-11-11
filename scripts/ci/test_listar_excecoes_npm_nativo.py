#!/usr/bin/env python3
"""
Cenários de scripts/ci/listar-excecoes-npm-nativo.py em árvore temporária.

O script lê `supabase/functions` relativo ao diretório atual; cada cenário monta a
árvore num diretório temporário e roda o script com `cwd` apontando para ela.

Uso: python3 scripts/ci/test_listar_excecoes_npm_nativo.py
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "listar-excecoes-npm-nativo.py"
F = "supabase/functions"


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="npm nativo-"))
        self.addCleanup(shutil.rmtree, self.tmp, True)

    def escrever(self, caminho, conteudo):
        alvo = self.tmp / caminho
        alvo.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(conteudo, bytes):
            alvo.write_bytes(conteudo)
        else:
            alvo.write_text(conteudo, encoding="utf-8")

    def rodar(self, cwd=None):
        env = {"PATH": os.environ["PATH"], "PYTHONDONTWRITEBYTECODE": "1", "LC_ALL": "C"}
        return subprocess.run(
            [sys.executable, str(SCRIPT)], capture_output=True, text=True, cwd=cwd or self.tmp, env=env, timeout=60, check=False
        )

    def lista(self):
        r = self.rodar()
        self.assertEqual(r.returncode, 0, r.stderr)
        return r.stdout.splitlines()


class Cenarios(Base):
    def test_sem_diretorio_sai_1_com_mensagem(self):
        r = self.rodar()
        self.assertEqual(r.returncode, 1)
        self.assertEqual(r.stdout, "")
        self.assertIn("diretório supabase/functions não encontrado", r.stderr)

    def test_nada_contaminado_saida_vazia(self):
        self.escrever(f"{F}/a/index.ts", "import { x } from '../_shared/x.ts';\n")
        self.escrever(f"{F}/_shared/x.ts", "export const x = 1;\n")
        self.assertEqual(self.lista(), [])

    def test_import_direto_estatico_dinamico_e_por_variavel(self):
        self.escrever(f"{F}/estatico/index.ts", "import forge from 'npm:node-forge@1.3.1';\n")
        self.escrever(f"{F}/dinamico/index.ts", "const m = await import('npm:node-forge@1.3.1');\n")
        # o caso que motivou o script (_shared/sefaz/pfx.ts): especificador numa variável
        self.escrever(f"{F}/variavel/index.ts", "const spec = 'npm:node-forge@1.3.1';\nawait import(spec);\n")
        self.escrever(f"{F}/limpo/index.ts", "import { z } from 'npm:zod';\n")
        self.assertEqual(self.lista(), [f"{F}/dinamico/index.ts", f"{F}/estatico/index.ts", f"{F}/variavel/index.ts"])

    def test_fecho_transitivo_em_varios_niveis(self):
        self.escrever(f"{F}/_shared/sefaz/pfx.ts", "const s = 'npm:node-forge';\n")
        self.escrever(f"{F}/_shared/sefaz/assinar.ts", "import { p } from './pfx.ts';\n")
        self.escrever(f"{F}/_shared/sefaz/index.ts", "export * from './assinar.ts';\n")
        self.escrever(f"{F}/sefaz/index.ts", 'import { a } from "../_shared/sefaz/index.ts";\n')
        self.escrever(f"{F}/sefaz/__tests__/x_test.ts", "import '../index.ts';\n")
        self.escrever(f"{F}/outra/index.ts", "import { z } from '../_shared/limpo.ts';\n")
        self.escrever(f"{F}/_shared/limpo.ts", "export const z = 1;\n")
        self.assertEqual(
            self.lista(),
            [
                f"{F}/_shared/sefaz/assinar.ts",
                f"{F}/_shared/sefaz/index.ts",
                f"{F}/_shared/sefaz/pfx.ts",
                f"{F}/sefaz/__tests__/x_test.ts",
                f"{F}/sefaz/index.ts",
            ],
        )

    def test_import_dinamico_relativo_e_multilinha(self):
        self.escrever(f"{F}/_shared/n.ts", "// usa node-forge\n")
        self.escrever(f"{F}/a/index.ts", "const m = await import(\n  '../_shared/n.ts'\n);\n")
        self.escrever(f"{F}/b/index.ts", "import {\n  x,\n  y,\n} from\n  '../_shared/n.ts';\n")
        self.assertEqual(self.lista(), [f"{F}/_shared/n.ts", f"{F}/a/index.ts", f"{F}/b/index.ts"])

    def test_resolucao_sem_extensao_por_index_e_tsx(self):
        self.escrever(f"{F}/_shared/crypto/index.ts", "import 'npm:node-forge';\n")
        self.escrever(f"{F}/_shared/ui.tsx", "import '../_shared/crypto';\n")
        self.escrever(f"{F}/a/index.ts", "import '../_shared/crypto';\n")
        self.escrever(f"{F}/b/index.ts", "import '../_shared/crypto/index';\n")
        self.escrever(f"{F}/c/index.ts", "import '../_shared/ui.tsx';\n")
        # Regressão: .tsx não era varrido, então a contaminação parava em ui.tsx e c/ ficava de fora.
        self.assertEqual(
            self.lista(),
            [f"{F}/_shared/crypto/index.ts", f"{F}/_shared/ui.tsx", f"{F}/a/index.ts", f"{F}/b/index.ts", f"{F}/c/index.ts"],
        )

    def test_ciclo_de_imports_termina(self):
        self.escrever(f"{F}/a/a.ts", "import './b.ts';\n")
        self.escrever(f"{F}/a/b.ts", "import './c.ts';\n")
        self.escrever(f"{F}/a/c.ts", "import './a.ts';\nimport 'npm:node-forge';\n")
        self.escrever(f"{F}/z/z1.ts", "import './z2.ts';\n")
        self.escrever(f"{F}/z/z2.ts", "import './z1.ts';\n")
        self.assertEqual(self.lista(), [f"{F}/a/a.ts", f"{F}/a/b.ts", f"{F}/a/c.ts"])

    def test_import_nao_relativo_inexistente_ou_fora_da_raiz_nao_contamina(self):
        self.escrever("fora/nativo.ts", "import 'npm:node-forge';\n")
        self.escrever(f"{F}/a/index.ts", "import '../../../fora/nativo.ts';\n")
        self.escrever(f"{F}/b/index.ts", "import './nao-existe.ts';\nimport 'jsr:@std/x';\nimport 'https://esm.sh/y';\n")
        self.assertEqual(self.lista(), [])

    def test_arquivos_que_nao_sao_ts_sao_ignorados(self):
        self.escrever(f"{F}/a/leia.md", "node-forge\n")
        self.escrever(f"{F}/a/deno.json", '{"imports": {"forge": "npm:node-forge"}}\n')
        self.escrever(f"{F}/a/index.js", "import 'npm:node-forge';\n")
        self.assertEqual(self.lista(), [])

    def test_byte_invalido_nao_derruba_o_script(self):
        # Regressão: UnicodeDecodeError abortava com traceback e a lista saía vazia.
        self.escrever(f"{F}/a/latin1.ts", b"// coment\xe1rio em latin-1\nimport forge from 'npm:node-forge';\n")
        self.escrever(f"{F}/b/index.ts", "import '../a/latin1.ts';\n")
        r = self.rodar()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(r.stdout.splitlines(), [f"{F}/a/latin1.ts", f"{F}/b/index.ts"])
        self.assertNotIn("Traceback", r.stderr)

    def test_caminho_com_espaco_e_acento_e_saida_deterministica(self):
        self.escrever(f"{F}/função com espaço/index.ts", "import 'npm:node-forge';\n")
        self.escrever(f"{F}/a/index.ts", "import '../função com espaço/index.ts';\n")
        primeira = self.lista()
        self.assertEqual(primeira, [f"{F}/a/index.ts", f"{F}/função com espaço/index.ts"])
        self.assertEqual(self.lista(), primeira)

    def test_arquivo_vazio_e_diretorio_vazio(self):
        self.escrever(f"{F}/a/index.ts", "")
        (self.tmp / F / "vazia").mkdir(parents=True)
        self.assertEqual(self.lista(), [])


class RepoReal(unittest.TestCase):
    """Contra o repositório de verdade: só invariantes, nada preso ao conteúdo de hoje."""

    def test_toda_linha_e_um_ts_existente_e_justificado(self):
        r = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True, cwd=REPO_ROOT, timeout=120, check=False)
        self.assertEqual(r.returncode, 0, r.stderr)
        linhas = r.stdout.splitlines()
        self.assertEqual(linhas, sorted(set(linhas)), "saída ordenada e sem repetição")
        listados = set(linhas)
        for linha in linhas:
            caminho = REPO_ROOT / linha
            self.assertTrue(caminho.is_file(), linha)
            self.assertTrue(linha.startswith("supabase/functions/") and linha.endswith((".ts", ".tsx")), linha)
            texto = caminho.read_text(encoding="utf-8", errors="replace")
            importa_listado = any(Path(outro).stem in texto for outro in listados - {linha})
            self.assertTrue("node-forge" in texto or importa_listado, f"{linha} listado sem motivo aparente")


if __name__ == "__main__":
    unittest.main(verbosity=1)
