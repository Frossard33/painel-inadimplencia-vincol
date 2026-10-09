import type { ColunaPrevisao } from "../dados/calculos";
import { R, Rc } from "../dados/formato";

/** Colunas da previsão de entrada: valor esperado escrito em cima, valor nominal no fundo. */
export function Colunas({ itens }: { itens: ColunaPrevisao[] }) {
  const max = Math.max(...itens.map((i) => i.nominal), 1);
  return (
    <div className="colunas" role="list">
      {itens.map((i) => (
        <div key={i.id} className={"col" + (i.vencidos ? " vencidos" : "")} role="listitem" title={i.dica + ": esperado " + R(i.esperado) + " de " + R(i.nominal)}>
          <span className="c-val">{i.esperado ? Rc(i.esperado) : "—"}</span>
          <span className="c-trilho" aria-hidden="true">
            <span className="c-nominal" style={{ height: (i.nominal / max) * 100 + "%" }} />
            <span className="c-esperado" style={{ height: (i.esperado / max) * 100 + "%" }} />
          </span>
          <span className="c-rot">{i.rotulo}</span>
          <span className="so-leitor">
            {i.dica}: esperado {R(i.esperado)} de {R(i.nominal)}
          </span>
        </div>
      ))}
    </div>
  );
}
