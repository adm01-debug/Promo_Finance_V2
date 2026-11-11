#!/usr/bin/env python3
"""Cenários de scripts/check-external-secret-isolation.sh (sem rede, sem banco).

O guard roda numa cópia mínima do repositório em diretório temporário, com a
chave externa referenciada dentro e fora de `supabase/functions/external-data`
em variações de nome, aspas, extensão, pasta e caminho com espaço.

Rodar: python3 scripts/test_check_external_secret_isolation.py
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

AQUI = Path(__file__).resolve().parent
SCRIPT = "check-external-secret-isolation.sh"
# Montados por partes para este arquivo nunca conter o nome literal do secret.
PREFIXO = "EXTERNAL_SUPABASE_"
NOME_REAL = PREFIXO + "SERVICE_KEY"
NOME_LEGADO = PREFIXO + "SERVICE_ROLE_KEY"
PERMITIDA = "supabase/functions/external-data"


class GuardSecretExterno(unittest.TestCase):
    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory(prefix="guard com espaço ")
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name)
        (self.repo / "scripts").mkdir()
        self.script = self.repo / "scripts" / SCRIPT
        shutil.copy(AQUI / SCRIPT, self.script)
        (self.repo / "src").mkdir()
        (self.repo / "supabase" / "functions").mkdir(parents=True)

    def escrever(self, relativo: str, conteudo: str) -> None:
        destino = self.repo / relativo
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(conteudo.encode("utf-8"))

    def guard(self, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(["bash", str(self.script)], cwd=cwd or self.repo, capture_output=True,
                              text=True, timeout=60, check=False)

    def test_sem_referencia_aprova(self) -> None:
        self.escrever("src/app.ts", "export const x = 1;\n")
        proc = self.guard()
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("Nenhuma referência", proc.stdout)

    def test_referencia_apenas_na_funcao_permitida_aprova(self) -> None:
        self.escrever(f"{PERMITIDA}/index.ts", f"const k = Deno.env.get('{NOME_REAL}');\n")
        self.escrever(f"{PERMITIDA}/sub pasta/cliente.ts", f'const k = Deno.env.get("{NOME_LEGADO}");\n')
        proc = self.guard()
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("Referências permitidas", proc.stdout)
        self.assertIn(f"restrita a {PERMITIDA}", proc.stdout)

    def test_reprova_referencia_fora_da_funcao_permitida(self) -> None:
        # O primeiro caso é a regressão principal: o secret que a função lê de fato
        # (sem `_ROLE_`) não era procurado e podia ser lido de qualquer lugar.
        casos = {
            "nome real em outra função": ("supabase/functions/outra/index.ts", f"Deno.env.get('{NOME_REAL}')"),
            "nome legado em outra função": ("supabase/functions/outra/index.ts", f"Deno.env.get('{NOME_LEGADO}')"),
            "aspas duplas": ("supabase/functions/outra/index.ts", f'Deno.env.get("{NOME_REAL}")'),
            "template string": ("supabase/functions/outra/index.ts", f"Deno.env.get(`{NOME_REAL}`)"),
            "acesso por colchete": ("supabase/functions/outra/index.ts", f"Deno.env.toObject()['{NOME_REAL}']"),
            "sufixo montado em runtime": ("supabase/functions/outra/index.ts",
                                          "Deno.env.get(`" + PREFIXO + "SERVICE${sufixo}`)"),
            "pasta _shared": ("supabase/functions/_shared/cliente.ts", f"Deno.env.get('{NOME_REAL}')"),
            "teste deno": ("supabase/functions/_shared/cliente_test.ts", f"Deno.env.set('{NOME_REAL}', 'x')"),
            "função com nome parecido": ("supabase/functions/external-data-v2/index.ts", f"'{NOME_REAL}'"),
            "frontend": ("src/lib/cliente.ts", f"import.meta.env.VITE_{NOME_REAL}"),
            "frontend tsx": ("src/pages/Tela.tsx", f"process.env.{NOME_REAL}"),
            "frontend js": ("src/legado.js", f"process.env.{NOME_REAL}"),
            "módulo mjs": ("supabase/functions/outra/util.mjs", f"process.env.{NOME_REAL}"),
            "módulo cjs": ("src/util.cjs", f"process.env.{NOME_REAL}"),
            "migration sql": ("supabase/migrations/20270101000000_x.sql",
                              f"SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = '{NOME_REAL}';"),
            "config da raiz (bundle)": ("vite.config.ts", f"define: {{ K: process.env.{NOME_REAL} }}"),
            "caminho com espaço": ("src/pasta com espaço/a b.ts", f"'{NOME_REAL}'"),
            "crlf": ("src/crlf.ts", f"const a = 1;\r\nconst k = '{NOME_REAL}';\r\n"),
            "em comentário": ("src/doc.ts", f"// usar {NOME_REAL} aqui\n"),
        }
        for nome, (caminho, conteudo) in casos.items():
            with self.subTest(nome):
                self.escrever(caminho, conteudo + "\n")
                self.escrever(f"{PERMITIDA}/index.ts", f"Deno.env.get('{NOME_REAL}')\n")
                proc = self.guard()
                (self.repo / caminho).unlink()
                self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
                self.assertIn("::error::", proc.stdout)
                self.assertIn(f"    {caminho}", proc.stdout)
                self.assertNotIn(f"    {PERMITIDA}/index.ts\n\n", proc.stdout.split("::error::")[1])

    def test_nao_reprova_o_que_esta_fora_do_escopo(self) -> None:
        casos = {
            "outra variável do mesmo projeto": ("src/a.ts", f"'{PREFIXO}URL'"),
            "documentação dentro de supabase": ("supabase/functions/outra/README.md", NOME_REAL),
            "node_modules": ("src/node_modules/pkg/index.js", NOME_REAL),
            "dist": ("src/dist/bundle.js", NOME_REAL),
            "o próprio guard e seus testes": ("scripts/outro.ts", NOME_REAL),
            "docs": ("docs/RUNBOOK.md", NOME_REAL),
        }
        for nome, (caminho, conteudo) in casos.items():
            with self.subTest(nome):
                self.escrever(caminho, conteudo + "\n")
                proc = self.guard()
                self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_resultado_independe_do_diretorio_corrente(self) -> None:
        # Regressão: de fora da raiz o grep não achava as pastas e o guard aprovava.
        self.escrever("supabase/functions/outra/index.ts", f"Deno.env.get('{NOME_REAL}')\n")
        for cwd in (self.repo, self.repo / "scripts", Path("/")):
            with self.subTest(cwd=str(cwd)):
                self.assertEqual(self.guard(cwd).returncode, 1)

    def test_pasta_obrigatoria_ausente_nao_vira_ok(self) -> None:
        for pasta in ("src", "supabase"):
            with self.subTest(pasta):
                shutil.rmtree(self.repo / pasta)
                proc = self.guard()
                (self.repo / pasta).mkdir()
                self.assertEqual(proc.returncode, 2, proc.stdout)
                self.assertIn("não pode ser avaliado", proc.stderr)
                self.assertNotIn("✅", proc.stdout)

    @unittest.skipIf(hasattr(os, "geteuid") and os.geteuid() == 0, "root ignora permissão de leitura")
    def test_erro_de_leitura_nao_vira_ok(self) -> None:
        self.escrever("src/secreto.ts", f"'{NOME_REAL}'\n")
        (self.repo / "src" / "secreto.ts").chmod(0)
        proc = self.guard()
        (self.repo / "src" / "secreto.ts").chmod(0o644)
        self.assertEqual(proc.returncode, 2, proc.stdout)

    def test_repositorio_real_aprova(self) -> None:
        proc = subprocess.run(["bash", str(AQUI / SCRIPT)], cwd="/", capture_output=True, text=True,
                              timeout=120, check=False)
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertNotIn("::error::", proc.stdout)


if __name__ == "__main__":
    unittest.main()
