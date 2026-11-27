/**
 * A escolha da apuracao do IRPJ/CSLL fica em estado local do modulo. Quando o
 * filtro do painel troca de empresa (ou de ano) o id guardado pode nao existir na
 * lista exibida: manter o id antigo faz o calculo gravar na apuracao da empresa
 * anterior usando o saldo de prejuizos da empresa atual (achado do Devin na PR
 * #582).
 */
export function formCalculoDaEmpresa<T extends { apuracaoId: string }>(
  formCalculo: T,
  apuracoesDoPeriodo: { id: string }[]
): T {
  return apuracoesDoPeriodo.some((ap) => ap.id === formCalculo.apuracaoId)
    ? formCalculo
    : { ...formCalculo, apuracaoId: '' };
}
