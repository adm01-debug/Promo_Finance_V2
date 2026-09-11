import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import edge_inventory as edge


class TesteInventarioEdge(unittest.TestCase):
    def test_detecta_entrypoint_imports_guards_e_service_role(self):
        text = """import { exigirUsuario } from '../_shared/auth-guard.ts';
import pacote from 'npm:pacote@1';
Deno.serve(async req => { exigirUsuario(req); return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); });
"""
        item = edge.inspect_edge("supabase/functions/minha-funcao/index.ts", text)
        self.assertTrue(item["entrypoint"])
        self.assertEqual(item["guard_signals"], ["usuario"])
        self.assertTrue(item["uses_service_role"])
        self.assertEqual(item["external_imports"], ["npm:pacote@1"])
        self.assertEqual(item["shared_imports"], ["../_shared/auth-guard.ts"])

    def test_nao_confunde_sinal_com_prova_de_seguranca(self):
        item = edge.inspect_edge("supabase/functions/f/index.ts", "Deno.serve(() => new Response('ok'))")
        self.assertEqual(item["confidence"], "SINAL_ESTATICO")
        self.assertEqual(item["guard_signals"], [])

    def test_denominador_vem_do_checkout_rastreado(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "supabase/functions/f/index.ts"
            path.parent.mkdir(parents=True)
            path.write_text("Deno.serve(() => new Response('ok'))")
            tracked = "supabase/functions/f/index.ts\0supabase/functions/f/test.ts\0"
            with patch.object(edge, "command", return_value=tracked):
                result = edge.inventory(root)
            self.assertEqual([item["name"] for item in result["functions"]], ["f"])

    def test_falha_ao_obter_commit_preserva_manifesto_atomico(self):
        with tempfile.TemporaryDirectory() as directory, \
                patch.object(sys, "argv", ["edge_inventory.py", "--output-root", directory]), \
                patch.object(edge, "command", side_effect=subprocess.CalledProcessError(1, ["git"])):
            with self.assertRaises(subprocess.CalledProcessError):
                edge.main()
            evidence = list(Path(directory).glob("execucao-*/evidencia.json"))
            self.assertEqual(len(evidence), 1)
            self.assertEqual(json.loads(evidence[0].read_text())["status"], "falhou")
            self.assertFalse(list(Path(directory).glob("execucao-*/.evidencia.json.tmp")))


if __name__ == "__main__":
    unittest.main()
