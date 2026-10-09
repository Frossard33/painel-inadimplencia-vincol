import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Cor, Titulo } from "../dados/tipos";
import { R, dataBR, diasTxt, N } from "../dados/formato";

const CORES: { id: Cor; nome: string; dica: string }[] = [
  { id: "verde", nome: "Em dia", dica: "Sempre paga" },
  { id: "amarelo", nome: "Em atraso", dica: "Paga, mas com atraso" },
  { id: "vermelho", nome: "Inadimplente", dica: "Nunca paga" },
  { id: "nenhum", nome: "Sem classificação", dica: "Remover a cor" },
];

interface Props {
  titulos: Titulo[];
  cor: Cor;
  onCor: (c: Cor) => void;
  onFechar: () => void;
}

/** Ficha do cliente: total devido, títulos não pagos e classificação. */
export function FichaCliente({ titulos, cor, onCor, onFechar }: Props) {
  const fechar = useRef<HTMLButtonElement>(null);
  const voltar = useRef<Element | null>(document.activeElement);
  useEffect(() => {
    fechar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    const alvo = voltar.current;
    return () => {
      document.removeEventListener("keydown", esc);
      if (alvo instanceof HTMLElement) alvo.focus();
    };
  }, [onFechar]);

  if (!titulos.length) return null;
  const abertos = titulos.filter((t) => !t.pago).sort((a, b) => b.dias - a.dias);
  const devido = abertos.reduce((a, t) => a + t.aberto, 0);
  const maior = abertos.length ? abertos[0].dias : 0;
  const tipos = [...new Set(abertos.map((t) => t.tipo))];
  const c = titulos[0];

  return (
    <>
      <div className="veu on ficha-veu" onClick={onFechar} aria-hidden="true" />
      <section className="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-nome">
        <header className="f-topo">
          <div>
            <h2 id="ficha-nome">{c.cliente}</h2>
            <p>
              Cód. {c.cod}
              {tipos.length > 0 && " · " + tipos.join(", ")}
            </p>
          </div>
          <button ref={fechar} type="button" className="f-fechar" onClick={onFechar} aria-label="Fechar ficha do cliente">
            <X size={20} />
          </button>
        </header>

        <div className="f-nums">
          <div>
            <span>Total devido</span>
            <b>{R(devido)}</b>
          </div>
          <div>
            <span>Títulos não pagos</span>
            <b>{N(abertos.length)}</b>
          </div>
          <div>
            <span>Mais vencido</span>
            <b>{abertos.length ? diasTxt(maior) : "—"}</b>
          </div>
        </div>

        <h3 className="f-sub">Classificação</h3>
        <div className="f-cores" role="radiogroup" aria-label="Classificação do cliente">
          {CORES.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={cor === o.id} className={"f-cor cor-" + o.id + (cor === o.id ? " on" : "")} onClick={() => onCor(o.id)}>
              <b>{o.nome}</b>
              <small>{o.dica}</small>
            </button>
          ))}
        </div>
        <p className="f-nota">A classificação fica salva neste navegador.</p>

        <h3 className="f-sub">Títulos não pagos</h3>
        {abertos.length ? (
          <ul className="f-lista">
            {abertos.map((t, i) => (
              <li key={t.tipo + t.titulo + t.parcela + i}>
                <span>
                  <b>{t.tipo}</b>
                  <small>
                    Título {t.titulo}
                    {t.parcela && " · parc. " + t.parcela} · vence {dataBR(t.vencimento)}
                  </small>
                </span>
                <span className="f-dir">
                  <b>{R(t.aberto)}</b>
                  <small className={t.dias > 90 ? "risco" : ""}>{diasTxt(t.dias)}</small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vazio">Nenhum título em aberto.</p>
        )}
      </section>
    </>
  );
}
