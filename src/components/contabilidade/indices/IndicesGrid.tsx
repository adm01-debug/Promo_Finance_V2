import { useMemo } from 'react';
import { CATEGORIA_LABEL, type CategoriaIndice, type Indicador } from '@/lib/contabil/indices';
import { IndicadorCard } from './IndicadorCard';

interface Props {
  indices: Indicador[];
  anteriores: Indicador[] | null;
  busca: string;
}

const ORDEM: CategoriaIndice[] = [
  'liquidez',
  'endividamento',
  'rentabilidade',
  'atividade',
  'estrutura',
];

export function IndicesGrid({ indices, anteriores, busca }: Props) {
  const termo = busca.trim().toLowerCase();

  const porCategoria = useMemo(() => {
    const filtrados = termo
      ? indices.filter(
          (i) =>
            i.rotulo.toLowerCase().includes(termo) ||
            i.chave.toLowerCase().includes(termo) ||
            CATEGORIA_LABEL[i.categoria].toLowerCase().includes(termo),
        )
      : indices;
    return ORDEM.map((c) => ({ categoria: c, itens: filtrados.filter((i) => i.categoria === c) })).filter(
      (g) => g.itens.length > 0,
    );
  }, [indices, termo]);

  const anteriorPor = useMemo(
    () => new Map((anteriores ?? []).map((i) => [i.chave, i])),
    [anteriores],
  );

  if (porCategoria.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum indicador corresponde à busca.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {porCategoria.map((grupo) => (
        <section key={grupo.categoria} aria-label={CATEGORIA_LABEL[grupo.categoria]} className="space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {CATEGORIA_LABEL[grupo.categoria]}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {grupo.itens.map((i) => (
              <IndicadorCard key={i.chave} indicador={i} anterior={anteriorPor.get(i.chave)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
