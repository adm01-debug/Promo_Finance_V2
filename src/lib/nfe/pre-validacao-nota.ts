/**
 * Insumos que o formulário de NF-e (NovaNFeForm) passa à pré-validação IBS/CBS e que
 * não são lidos de campo da tela: o CRT do emitente e os totais do grupo.
 *
 * Ficam aqui, e não no componente, porque são funções puras compartilhadas entre
 * o componente e os testes (regra react-refresh/only-export-components).
 */

/**
 * CRT (código de regime tributário) do emitente: 1 = Simples Nacional,
 * 3 = regime normal (Lucro Presumido, Lucro Real e Lucro Arbitrado). Regime
 * desconhecido devolve `undefined` — sem CRT a pré-validação não afirma nada sobre a
 * obrigatoriedade do grupo, em vez de bloquear por suposição.
 */
export const crtDoRegime = (regime?: string | null): number | undefined => {
  if (regime === 'simples_nacional') return 1;
  if (regime === 'lucro_presumido' || regime === 'lucro_real' || regime === 'arbitrado') return 3;
  return undefined;
};

/** Campos do grupo IBS/CBS que o formulário guarda por item (sufixo `IbsCbs`). */
interface ItemComGrupo {
  cstIbsCbs?: string;
  vIBSUF?: number;
  vIBSMun?: number;
  vIBS?: number;
  vCBS?: number;
}

/**
 * Totais do grupo IBS/CBS da nota (grupo total/IBSCBSTot do leiaute) somados a
 * partir dos itens já enquadrados. A tela não tem campo próprio de totais: a soma
 * dos itens é o valor que a nota carrega, então passá-la à pré-validação evita o
 * aviso de total ausente para um campo que aqui não existe.
 *
 * Sem item com CST não há grupo a totalizar e a função devolve `undefined`, para a
 * pré-validação não comparar total zero com nota sem grupo.
 */
export const totaisDaNota = (
  itens: readonly ItemComGrupo[]
): { vIBS: number; vCBS: number } | undefined => {
  const comGrupo = itens.filter((item) => item.cstIbsCbs);
  if (comGrupo.length === 0) return undefined;
  const emCentavos = (valor?: number) => Math.round((valor ?? 0) * 100);
  const somar = (valores: number[]) => valores.reduce((acc, valor) => acc + valor, 0) / 100;
  return {
    vIBS: somar(
      comGrupo.map((item) => emCentavos(item.vIBS ?? (item.vIBSUF ?? 0) + (item.vIBSMun ?? 0)))
    ),
    vCBS: somar(comGrupo.map((item) => emCentavos(item.vCBS))),
  };
};
