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

    def test_reconhece_toda_a_familia_de_guards_compartilhados(self):
        casos = {
            "exigirUsuario(req)": ["usuario"],
            "exigirUsuarioComEmpresa(req, id)": ["empresa", "usuario"],
            "exigirInternaOuUsuario(req)": ["interna", "usuario"],
            "exigirInternaOuUsuarioComPapel(req, ['admin'])": ["interna", "papel", "usuario"],
            "exigirPapel(req, ['admin'])": ["papel"],
            "exigirAlgumPapel(req, papeis)": ["papel"],
            "exigirAdminOuVinculo(req, empresaId)": ["empresa", "papel"],
            "exigirVinculoEmpresa(usuario, empresaId)": ["empresa"],
            "exigirChamadaInterna(req)": ["interna"],
            "authenticateWebhook(req, 'asaas')": ["webhook"],
            "segredosIguais(recebido, esperado)": ["segredo"],
            "supabase.auth.getUser(token)": ["usuario"],
        }
        for chamada, esperado in casos.items():
            with self.subTest(chamada=chamada):
                item = edge.inspect_edge("supabase/functions/f/index.ts", f"Deno.serve(async req => {{ await {chamada}; }});")
                self.assertEqual(item["guard_signals"], esperado)

    def test_guard_apenas_importado_ou_comentado_nao_e_sinal(self):
        text = """import { exigirUsuario } from '../_shared/auth-guard.ts';
// const auth = await exigirUsuario(req);
/*
 * Authorization: Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}
 * Deno.serve(handler)
 */
export const handler = () => new Response('ok');
"""
        item = edge.inspect_edge("supabase/functions/f/index.ts", text)
        self.assertEqual(item["guard_signals"], [])
        self.assertFalse(item["uses_service_role"])
        self.assertFalse(item["entrypoint"])
        self.assertEqual(item["shared_imports"], ["../_shared/auth-guard.ts"])

    def test_pasta_compartilhada_e_arquivos_aninhados_nao_sao_funcoes(self):
        tracked = ["supabase/functions/b/index.ts", "supabase/functions/a/index.ts",
                   "supabase/functions/_shared/index.ts", "supabase/functions/a/lib/index.ts",
                   "supabase/functions/index.ts", "supabase/functions/a/handler.ts", "src/index.ts", ""]
        with patch.object(edge, "command", return_value="\0".join(tracked)):
            self.assertEqual(edge.edge_files(Path(".")),
                             ["supabase/functions/a/index.ts", "supabase/functions/b/index.ts"])

    def test_sem_funcoes_rastreadas_falha_fechado(self):
        with patch.object(edge, "command", return_value="src/a.ts\0"), \
                self.assertRaisesRegex(ValueError, "Nenhuma Edge Function"):
            edge.inventory(Path("."))


@unittest.skipIf(edge.tomllib is None, "tomllib exige Python 3.11+")
class TesteVerifyJwt(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("aberta", "fechada", "sem-declaracao", "aberta-com-guard"):
            path = self.root / "supabase/functions" / name / "index.ts"
            path.parent.mkdir(parents=True)
            path.write_text("Deno.serve(req => exigirUsuario(req))" if name == "aberta-com-guard"
                            else "Deno.serve(() => new Response('ok'))")
        self.config = self.root / "supabase/config.toml"
        self.config.write_text("""project_id = "x"

# verify_jwt=false: webhook público
[functions.aberta]
verify_jwt = false

[functions.fechada]
verify_jwt = true

[functions.aberta-com-guard]
verify_jwt = false  # guard interno

[functions.orfa-sem-pasta]
verify_jwt = false
""")
        tracked = "".join(f"supabase/functions/{name}/index.ts\0"
                          for name in ("aberta", "fechada", "sem-declaracao", "aberta-com-guard"))
        patch.object(edge, "command", return_value=tracked).start()
        self.addCleanup(patch.stopall)

    def verify_jwt(self):
        return {item["name"]: item["verify_jwt"] for item in edge.inventory(self.root)["functions"]}

    def test_le_verify_jwt_por_funcao_e_distingue_nao_declarado(self):
        self.assertEqual(self.verify_jwt(), {
            "aberta": False, "aberta-com-guard": False, "fechada": True, "sem-declaracao": None,
        })

    def test_config_ausente_deixa_tudo_nao_declarado(self):
        self.config.unlink()
        self.assertEqual(set(self.verify_jwt().values()), {None})

    def test_valor_nao_booleano_nao_e_tratado_como_declaracao(self):
        self.config.write_text('[functions.aberta]\nverify_jwt = "false"\n[functions.fechada]\nimport_map = "x"\n')
        self.assertEqual(set(self.verify_jwt().values()), {None})

    def test_config_malformado_falha_com_mensagem_acionavel(self):
        for content in ("[functions.aberta\nverify_jwt = false\n", "functions = 1\n"):
            with self.subTest(content=content):
                self.config.write_text(content)
                with self.assertRaisesRegex(ValueError, "config.toml inválido"):
                    edge.inventory(self.root)

    def test_resumo_separa_funcao_aberta_sem_sinal_de_guard(self):
        output = self.root / "saida"
        inventory = edge.inventory
        with patch.object(sys, "argv", ["edge_inventory.py", "--output-root", str(output)]), \
                patch.object(edge, "inventory", lambda: inventory(self.root)), patch("builtins.print"):
            edge.main()
            edge.main()
        results = sorted(output.glob("execucao-*/edge-functions.json"))
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].read_bytes(), results[1].read_bytes())
        summary = json.loads(results[0].read_text())["summary"]
        self.assertEqual(summary, {
            "functions": 4, "entrypoints_detected": 4, "with_guard_signal": 1, "with_service_role": 0,
            "with_external_import": 0, "verify_jwt_disabled": 2, "verify_jwt_undeclared": 1,
            "verify_jwt_disabled_without_guard_signal": 1,
        })
        evidence = json.loads(next(output.glob("execucao-*/evidencia.json")).read_text())
        self.assertEqual(evidence["status"], "validado_com_limitacoes")
        self.assertEqual(evidence["summary"], summary)

    def test_saida_simbolica_recusada(self):
        real = self.root / "real"
        real.mkdir()
        (self.root / "saida").symlink_to(real, target_is_directory=True)
        with patch.object(sys, "argv", ["edge_inventory.py", "--output-root", str(self.root / "saida")]), \
                patch.object(sys, "stderr"), self.assertRaises(SystemExit) as error:
            edge.main()
        self.assertEqual(error.exception.code, 1)
        self.assertEqual(list(real.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
