import unittest

import run


class TestePerfis(unittest.TestCase):
    def setUp(self):
        self.base = {
            "version": "0.9.48",
            "profiles": {
                "teste": {"maxFiles": 2, "maxBytes": 100, "timeoutSeconds": 1,
                           "includePrefixes": ["src/lib/"]}
            },
        }

    def test_seleciona_somente_prefixo_versionado_e_filtra_testes(self):
        config = run.profile_config(self.base, "teste")
        tracked = {"src/lib/a.ts", "src/lib/a.test.ts", "src/lib/__tests__/b.ts",
                   "src/pages/c.ts", "supabase/functions/index.ts"}
        self.assertEqual(run.selected_names(tracked, config), ["src/lib/a.ts"])
        self.assertFalse(run.is_allowed_path("src/lib/a.test.ts"))
        self.assertFalse(run.is_allowed_path("src/lib/__tests__/b.ts"))

    def test_perfil_com_prefixo_so_de_testes_e_recusado(self):
        # Sem fonte permitida o perfil falha; testes não viram corpus útil por acidente.
        config = run.profile_config(self.base, "teste")
        with self.assertRaises(ValueError):
            run.selected_names({"src/lib/a.test.ts"}, config)

    def test_combina_arquivos_explicitos_e_prefixos_sem_duplicar(self):
        self.base["profiles"]["teste"]["files"] = ["src/pages/c.ts"]
        config = run.profile_config(self.base, "teste")
        tracked = {"src/lib/a.ts", "src/pages/c.ts"}
        self.assertEqual(run.selected_names(tracked, config), ["src/lib/a.ts", "src/pages/c.ts"])

    def test_perfil_inexistente_ou_inseguro(self):
        for name in ["nao-existe", "../teste", "Teste", "a" * 49]:
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    run.profile_config(self.base, name)

    def test_prefixo_inseguro(self):
        self.base["profiles"]["teste"]["includePrefixes"] = ["../src/"]
        config = run.profile_config(self.base, "teste")
        with self.assertRaises(ValueError):
            run.selected_names({"src/lib/a.ts"}, config)

    def test_limite_dos_perfis(self):
        config = run.profile_config(self.base, "teste")
        with self.assertRaises(ValueError):
            run.selected_names({"src/lib/a.ts", "src/lib/b.ts", "src/lib/c.ts"}, config)


if __name__ == "__main__":
    unittest.main()
