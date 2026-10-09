import { useEffect, useRef } from "react";
import { LayoutDashboard, ListChecks, Printer, ReceiptText, X } from "lucide-react";
import { SISTEMAS } from "../dados/sistemas";
import type { SistemaId } from "../dados/tipos";
import type { Pagina } from "../estado";
import { dataBR } from "../dados/formato";

interface Props {
  pagina: Pagina;
  sis: SistemaId;
  disponiveis: SistemaId[];
  posicao: string;
  aberto: boolean;
  onFechar: () => void;
  onPagina: (p: Pagina) => void;
  onSistema: (s: SistemaId) => void;
}

const ITENS: { id: Pagina; nome: string; Icone: typeof LayoutDashboard }[] = [
  { id: "geral", nome: "Visão geral", Icone: LayoutDashboard },
  { id: "titulos", nome: "Títulos", Icone: ReceiptText },
  { id: "classificar", nome: "Classificar clientes", Icone: ListChecks },
];

/** Menu lateral fixo no computador; no celular abre por cima pelo botão ☰. */
export function Menu({ pagina, sis, disponiveis, posicao, aberto, onFechar, onPagina, onSistema }: Props) {
  const fechar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!aberto) return;
    fechar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto, onFechar]);

  return (
    <>
      <div className={"veu" + (aberto ? " on" : "")} onClick={onFechar} aria-hidden="true" />
      <aside className={"menu" + (aberto ? " aberto" : "")} aria-label="Menu principal">
        <div className="m-topo">
          <img src="logo.png" alt="Vincol, desde 1979" className="m-logo" />
          <button ref={fechar} type="button" className="m-fechar" onClick={onFechar} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <p className="m-titulo">Painel de Inadimplência</p>

        <div className="m-rot">Sistema</div>
        <div className="m-sis" role="group" aria-label="Sistema de origem dos dados">
          {disponiveis.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={sis === id}
              className={sis === id ? "on" : ""}
              style={sis === id ? { background: SISTEMAS[id].cor } : undefined}
              onClick={() => onSistema(id)}
            >
              {SISTEMAS[id].nome}
            </button>
          ))}
        </div>

        <nav className="m-nav" aria-label="Seções">
          {ITENS.map(({ id, nome, Icone }) => (
            <button key={id} type="button" className={pagina === id ? "on" : ""} aria-current={pagina === id ? "page" : undefined} onClick={() => onPagina(id)}>
              <Icone size={18} strokeWidth={1.75} aria-hidden="true" />
              {nome}
            </button>
          ))}
        </nav>

        <div className="m-rodape">
          <span>
            Posição em <strong>{dataBR(posicao)}</strong>
          </span>
          <button type="button" className="m-imprimir" onClick={() => window.print()}>
            <Printer size={16} strokeWidth={1.75} aria-hidden="true" /> Imprimir
          </button>
        </div>
      </aside>
    </>
  );
}
