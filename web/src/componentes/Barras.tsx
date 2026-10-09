import { Rc } from "../dados/formato";

export interface Barra {
  id: string;
  rotulo: string;
  valor: number;
  detalhe?: string;
  cor?: string;
  /** Valor de fundo (barra clara), ex.: total em aberto atrás do que deve entrar. */
  total?: number;
}

interface Props {
  itens: Barra[];
  ativo?: string;
  onEscolher?: (id: string) => void;
  formato?: (n: number) => string;
  vazio?: string;
}

/** Barras horizontais minimalistas: rótulo, barra e o valor escrito. Clicar filtra o painel. */
export function Barras({ itens, ativo, onEscolher, formato = Rc, vazio = "Nada a mostrar com estes filtros." }: Props) {
  if (!itens.length) return <p className="vazio">{vazio}</p>;
  const max = Math.max(...itens.map((i) => Math.max(i.valor, i.total ?? 0)), 1);
  return (
    <ul className="barras" role="list">
      {itens.map((i) => {
        const on = ativo === i.id;
        const conteudo = (
          <>
            <span className="b-rot" title={i.rotulo}>
              {i.rotulo}
              {i.detalhe && <small>{i.detalhe}</small>}
            </span>
            <span className="b-trilho" aria-hidden="true">
              {i.total != null && <span className="b-total" style={{ width: (i.total / max) * 100 + "%" }} />}
              <span className="b-barra" style={{ width: (i.valor / max) * 100 + "%", background: i.cor }} />
            </span>
            <span className="b-val">{formato(i.valor)}</span>
          </>
        );
        return (
          <li key={i.id} className={on ? "on" : ""}>
            {onEscolher ? (
              <button type="button" className="b-linha" aria-pressed={on} onClick={() => onEscolher(i.id)}>
                {conteudo}
              </button>
            ) : (
              <div className="b-linha">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
