import unittest

import typescript_imports as imports


class TesteImportsTypeScript(unittest.TestCase):
    def test_extrai_alias_relativo_reexport_tipo_lazy_e_efeito(self):
        text = """import type { Tipo } from '@/types/tipo';
import { valor } from './valor';
import './efeito';
export { item } from './barrel';
const Pagina = lazy(() => import('@/pages/Pagina'));
"""
        found = imports.extract_imports("src/modulo/index.ts", text)
        self.assertEqual([item["kind"] for item in found], [
            "type_import", "static_import", "side_effect_import", "reexport", "lazy_import"
        ])
        resolved = imports.resolve_imports(found, {
            "src/types/tipo.ts", "src/modulo/valor.ts", "src/modulo/efeito.ts",
            "src/modulo/barrel/index.ts", "src/pages/Pagina.tsx",
        })
        self.assertTrue(all(item["resolution"] == "RESOLVED" for item in resolved))

    def test_diferencia_externo_e_arquivo_local_ausente(self):
        found = imports.extract_imports("src/a.ts", "import x from 'pacote';\nimport y from './ausente';")
        resolved = imports.resolve_imports(found, {"src/a.ts"})
        self.assertEqual([(item["resolution"], item["target"]) for item in resolved], [
            ("EXTERNAL", None), ("MISSING", None)
        ])

    def test_nao_inventa_resolucao_por_nome(self):
        found = imports.extract_imports("src/a.ts", "import x from './cliente';")
        resolved = imports.resolve_imports(found, {"src/outro/cliente.ts"})
        self.assertEqual(resolved[0]["resolution"], "MISSING")

    def test_normaliza_import_relativo_do_diretorio_pai(self):
        found = imports.extract_imports("src/modulo/a.ts", "import x from '../x';")
        resolved = imports.resolve_imports(found, {"src/x.ts"})
        self.assertEqual(resolved[0]["target"], "src/x.ts")

    def test_imports_estatico_e_de_tipo_em_multiplas_linhas(self):
        text = """import type {
  Tipo,
} from './tipo';
import {
  valor,
} from './valor';
"""
        found = imports.extract_imports("src/a.ts", text)
        self.assertEqual([(item["kind"], item["specifier"]) for item in found], [
            ("type_import", "./tipo"), ("static_import", "./valor")
        ])

    def test_caminho_normalizado_sem_partes_nao_interrompe_inventario(self):
        self.assertEqual(imports.candidate_paths("src/a.ts", ".."), [])

    def test_reexport_de_namespace_e_de_tipo(self):
        text = """export * as utils from './utils';
export type * from './tipos';
export type { A } from './a';
export * from './tudo';
"""
        found = imports.extract_imports("src/index.ts", text)
        self.assertEqual([(item["kind"], item["specifier"], item["line"]) for item in found], [
            ("reexport", "./utils", 1), ("reexport", "./tipos", 2), ("reexport", "./a", 3), ("reexport", "./tudo", 4),
        ])

    def test_comentario_de_linha_inteira_nao_vira_import(self):
        text = """/**
 * Uso:
 *   import { proprio } from '@/lib/proprio';
 */
// (import type é apagado na compilação): permanece em
// outro módulo por causa do drift-guard.
import type { Tipo } from './tipo';
  // import antigo from './antigo';
/* import bloco from './bloco'; */ import mesmo from './mesma-linha';
const Pagina = lazy(() => import('./Pagina'));
"""
        found = imports.extract_imports("src/lib/proprio.ts", text)
        self.assertEqual([(item["kind"], item["specifier"], item["line"]) for item in found], [
            ("type_import", "./tipo", 7), ("static_import", "./mesma-linha", 9), ("lazy_import", "./Pagina", 10),
        ])

    def test_mascara_preserva_posicoes_e_nao_toca_em_codigo(self):
        text = "const url = 'http://x'; // nota\n  // só comentário\n/* a\n b */ const y = 2;\n/* sem fim\nconst z = 3;\n"
        masked = imports.mask_comments(text)
        self.assertEqual(len(masked), len(text))
        self.assertEqual(masked.count("\n"), text.count("\n"))
        self.assertEqual(masked.splitlines(), [
            "const url = 'http://x'; // nota", " " * 18, " " * 4, " " * 5 + " const y = 2;",
            "/* sem fim", "const z = 3;",
        ])

    def test_sem_ponto_e_virgula_cada_import_fica_na_sua_linha(self):
        text = "import a from './a'\nimport b from './b'\nimport './c'\nexport { d } from './d'\n"
        found = imports.extract_imports("src/a.ts", text)
        self.assertEqual([(item["kind"], item["specifier"], item["line"]) for item in found], [
            ("static_import", "./a", 1), ("static_import", "./b", 2),
            ("side_effect_import", "./c", 3), ("reexport", "./d", 4),
        ])

    def test_import_dinamico_nao_literal_e_require_ficam_fora(self):
        text = "const a = await import(caminho);\nconst b = await import(`./${nome}`);\nconst c = require('./c');\nconst d = import.meta.env.X;\n"
        self.assertEqual(imports.extract_imports("src/a.ts", text), [])

    def test_resolucao_nao_escapa_do_repositorio_e_aceita_extensao_explicita(self):
        self.assertEqual(imports.candidate_paths("src/a.ts", "../../etc/passwd"), [])
        self.assertEqual(imports.candidate_paths("src/a.ts", "@/../fora"), [])
        self.assertEqual(imports.candidate_paths("supabase/functions/f/index.ts", "../_shared/auth-guard.ts"),
                         ["supabase/functions/_shared/auth-guard.ts"])
        found = imports.resolve_imports(
            imports.extract_imports("src/main.tsx", "import './index.css';\nimport App from './App';\nimport { x } from '.';"),
            {"src/index.css", "src/App.tsx", "src/App/index.ts", "src/index.ts"})
        self.assertEqual([item["target"] for item in found], ["src/index.css", "src/App.tsx", "src/index.ts"])

    def test_extracao_e_deterministica_e_ordenada_por_linha(self):
        text = "export { b } from './b';\nimport a from './a';\nconst P = lazy(() => import('./P'));\nimport './efeito';\n"
        first = imports.extract_imports("src/a.ts", text)
        self.assertEqual(first, imports.extract_imports("src/a.ts", text))
        self.assertEqual([item["line"] for item in first], [1, 2, 3, 4])


if __name__ == "__main__":
    unittest.main()
