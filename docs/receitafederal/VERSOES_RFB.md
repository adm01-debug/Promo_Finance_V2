# Versões testadas dos repositórios RFB

Última verificação manual: 21/11/2026, via `git ls-remote --tags --sort=-v:refname` contra cada repositório público.

| Repositório                                       | Tag testada/em uso | Observação                                                               |
| ------------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `ReceitaFederal/calculadora-rtc-regime-regular`   | `1.7.2`            | Base da auditoria ADR-003 (21/11/2026). Tag anterior conhecida: `1.6.1`. |
| `ReceitaFederal/calculadora-rtc-simples-nacional` | `1.0.2`            | Ainda não integrado a nenhuma Edge Function deste repositório.           |
| `ReceitaFederal/calculadora-rtc-gerador-danfse`   | `1.0.0`            | Ainda não integrado a nenhuma Edge Function deste repositório.           |

Atualizado automaticamente (seção abaixo) por `.github/workflows/rfb-upstream-watch.yml`, que compara a tag mais recente de cada repositório com a tag listada aqui e abre uma issue quando houver divergência ou quando o `CHANGELOG.md` upstream mudar desde a última verificação.

<!-- rfb-upstream-watch: não editar abaixo desta linha manualmente -->
