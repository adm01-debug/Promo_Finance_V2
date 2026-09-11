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


if __name__ == "__main__":
    unittest.main()
