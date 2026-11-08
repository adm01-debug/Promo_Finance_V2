#!/usr/bin/env python3
"""
Cenários de borda explícitos para benchmark.py.
Simulação de 7+ cenários antes de cada plano de fix.
"""
import sys, os, types, subprocess, unittest, unittest.mock

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import benchmark


class TestRgHitsScenarios(unittest.TestCase):
    """
    Cenários simulados ANTES do fix de shutil.which em benchmark.rg_hits():
      C1  rg não instalado → FileNotFoundError com 'ripgrep' na mensagem
      C2  rg exit 0, múltiplos arquivos → retorna lista alfabeticamente ordenada
      C3  rg exit 1 (sem match) → retorna lista vazia (não é erro)
      C4  rg exit 2 (falha real) → propaga CalledProcessError
      C5  rg exit 0, output vazio → lista vazia
      C6  nomes com espaços preservados no resultado
      C7  lista de arquivos vazia → executa rg sem crash
    """

    def _rv(self, code, out="", err=""):
        return types.SimpleNamespace(returncode=code, stdout=out, stderr=err,
                                     args=["rg", "-l", "-F", "--", "term"])

    # C1
    def test_c1_rg_not_installed_message_mentions_ripgrep(self):
        with unittest.mock.patch.object(benchmark.subprocess, "run",
                                        side_effect=FileNotFoundError()):
            with self.assertRaises(FileNotFoundError) as ctx:
                benchmark.rg_hits(".", "term", ["."])
        self.assertIn("ripgrep", str(ctx.exception))

    # C2
    def test_c2_exit0_returns_sorted_list(self):
        rv = self._rv(0, "b.ts\na.ts\n")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            result = benchmark.rg_hits(".", "term", ["a.ts", "b.ts"])
        self.assertEqual(result, ["a.ts", "b.ts"])

    # C3
    def test_c3_exit1_returns_empty_list(self):
        rv = self._rv(1, "")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            result = benchmark.rg_hits(".", "term", ["x.ts"])
        self.assertEqual(result, [])

    # C4
    def test_c4_exit2_raises_called_process_error(self):
        rv = self._rv(2, "", "fatal error")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            with self.assertRaises(subprocess.CalledProcessError):
                benchmark.rg_hits(".", "term", ["x.ts"])

    # C5
    def test_c5_exit0_empty_stdout_returns_empty(self):
        rv = self._rv(0, "")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            result = benchmark.rg_hits(".", "term", ["x.ts"])
        self.assertEqual(result, [])

    # C6
    def test_c6_filenames_with_spaces_preserved(self):
        rv = self._rv(0, "src/my file.ts\n")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            result = benchmark.rg_hits(".", "term", ["src/my file.ts"])
        self.assertEqual(result, ["src/my file.ts"])

    # C7
    def test_c7_empty_file_list_calls_rg_without_crash(self):
        rv = self._rv(1, "")
        with unittest.mock.patch.object(benchmark.subprocess, "run",
                                        return_value=rv) as mock_run:
            result = benchmark.rg_hits(".", "term", [])
        self.assertEqual(result, [])
        mock_run.assert_called_once()

    # C8: exit code 127 (command not found em alguns shells) → erro limpo
    def test_c8_exit127_raises_error(self):
        rv = self._rv(127, "", "command not found")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            with self.assertRaises(subprocess.CalledProcessError):
                benchmark.rg_hits(".", "term", ["x.ts"])

    # C9: stdout com linha vazia no final → não inclui string vazia na lista
    def test_c9_no_empty_strings_in_result(self):
        rv = self._rv(0, "a.ts\n\nb.ts\n\n")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            result = benchmark.rg_hits(".", "term", ["a.ts", "b.ts"])
        self.assertNotIn("", result)
        self.assertEqual(result, ["a.ts", "b.ts"])

    # C10: múltiplos termos de busca duplicados no output → deduplicação via sorted
    def test_c10_duplicate_lines_handled_by_sorted(self):
        rv = self._rv(0, "a.ts\na.ts\nb.ts\n")
        with unittest.mock.patch.object(benchmark.subprocess, "run", return_value=rv):
            result = benchmark.rg_hits(".", "term", ["a.ts", "b.ts"])
        # sorted() mantém duplicatas; comportamento esperado é incluir ambas
        self.assertIn("a.ts", result)


class TestRgHitsCommandArgs(unittest.TestCase):
    """C11-C14: valida os argumentos exatos passados ao rg"""

    def _rv(self, code=1, out=""):
        return types.SimpleNamespace(returncode=code, stdout=out, stderr="",
                                     args=["rg", "-l", "-F", "--", "term"])

    # C11: --fixed-string flag está presente (não regex injection)
    def test_c11_uses_fixed_string_flag(self):
        with unittest.mock.patch.object(benchmark.subprocess, "run",
                                        return_value=self._rv()) as mock:
            benchmark.rg_hits("/root", "search.term", ["f.ts"])
        args = mock.call_args[0][0]
        self.assertIn("-F", args)

    # C12: -l (somente filenames) está presente
    def test_c12_uses_list_only_flag(self):
        with unittest.mock.patch.object(benchmark.subprocess, "run",
                                        return_value=self._rv()) as mock:
            benchmark.rg_hits("/root", "term", ["f.ts"])
        args = mock.call_args[0][0]
        self.assertIn("-l", args)

    # C13: cwd é passado corretamente
    def test_c13_cwd_passed_correctly(self):
        with unittest.mock.patch.object(benchmark.subprocess, "run",
                                        return_value=self._rv()) as mock:
            benchmark.rg_hits("/my/project", "term", ["f.ts"])
        self.assertEqual(mock.call_args[1]["cwd"], "/my/project")

    # C14: arquivo passado como argumento posicional (não stdin)
    def test_c14_file_in_positional_args(self):
        with unittest.mock.patch.object(benchmark.subprocess, "run",
                                        return_value=self._rv()) as mock:
            benchmark.rg_hits(".", "term", ["target.ts"])
        args = mock.call_args[0][0]
        self.assertIn("target.ts", args)


if __name__ == "__main__":
    unittest.main(verbosity=2)
