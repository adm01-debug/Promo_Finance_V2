import json
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).parent


class TesteLockGraphify(unittest.TestCase):
    def test_todas_as_dependencias_tem_hash_e_versao_exata(self):
        text = (ROOT / "requirements-linux-py311.lock").read_text()
        stanzas = re.split(r"\n(?=[A-Za-z0-9_.-]+==)", text)
        packages = [stanza for stanza in stanzas if re.match(r"[A-Za-z0-9_.-]+==", stanza)]
        self.assertEqual(len(packages), 31)
        for stanza in packages:
            self.assertRegex(stanza.splitlines()[0], r"^[A-Za-z0-9_.-]+==[^ \\]+")
            self.assertIn("--hash=sha256:", stanza)

    def test_versao_direta_confere_com_configuracao(self):
        config = json.loads((ROOT / "config.json").read_text())
        requirement = (ROOT / "requirements.in").read_text()
        lock = (ROOT / "requirements-linux-py311.lock").read_text()
        # O extra [sql] é obrigatório: sem tree-sitter-sql os .sql são
        # varridos mas extraem zero nós e a cobertura SQL some do grafo.
        self.assertRegex(requirement, rf"(?m)^graphifyy\[(?:[A-Za-z0-9_-]+,)*sql(?:,[A-Za-z0-9_-]+)*\]=={re.escape(config['version'])}$")
        self.assertRegex(lock, rf"(?m)^graphifyy=={re.escape(config['version'])}(?:\s|$)")
        self.assertRegex(lock, r"(?m)^tree-sitter-sql==[^ \\]+")


if __name__ == "__main__":
    unittest.main()
