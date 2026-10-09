import { useEffect, useRef } from "react";
import { LayoutDashboard, ListChecks, PanelLeftClose, PanelLeftOpen, Printer, ReceiptText, X } from "lucide-react";
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
  recolhido: boolean;
  onRecolher: () => void;
  onFechar: () => void;
  onPagina: (p: Pagina) => void;
  onSistema: (s: SistemaId) => void;
}

const ITENS: { id: Pagina; nome: string; Icone: typeof LayoutDashboard }[] = [
  { id: "geral", nome: "Visão geral", Icone: LayoutDashboard },
  { id: "titulos", nome: "Títulos", Icone: ReceiptText },
  { id: "classificar", nome: "Classificar clientes", Icone: ListChecks },
];

/** Menu lateral fixo no computador (pode ser recolhido só para ícones); no celular abre por cima pelo botão ☰. */
export function Menu({ pagina, sis, disponiveis, posicao, aberto, recolhido, onRecolher, onFechar, onPagina, onSistema }: Props) {
  const fechar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!aberto) return;
    fechar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto, onFechar]);

  // Recolhido, os textos somem e o nome aparece como dica ao passar o mouse
  const dica = (txt: string) => (recolhido ? txt : undefined);

  return (
    <>
      <div className={"veu" + (aberto ? " on" : "")} onClick={onFechar} aria-hidden="true" />
      <aside className={"menu" + (aberto ? " aberto" : "") + (recolhido ? " recolhido" : "")} aria-label="Menu principal">
        <div className="m-topo">
          <img src="logo.png" alt="Vincol, desde 1979" className="m-logo" />
          <button type="button" className="m-recolher" onClick={onRecolher} aria-label={recolhido ? "Expandir menu" : "Recolher menu"} aria-expanded={!recolhido} title={recolhido ? "Expandir menu" : "Recolher menu"}>
            {recolhido ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
          </button>
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
              aria-label={SISTEMAS[id].nome}
              title={dica(SISTEMAS[id].nome)}
              className={sis === id ? "on" : ""}
              style={sis === id ? { background: SISTEMAS[id].cor } : undefined}
              onClick={() => onSistema(id)}
            >
              <span className="m-txt">{SISTEMAS[id].nome}</span>
              <span className="m-curto" aria-hidden="true">
                {SISTEMAS[id].nome.slice(0, 1)}
              </span>
            </button>
          ))}
        </div>

        <nav className="m-nav" aria-label="Seções">
          {ITENS.map(({ id, nome, Icone }) => (
            <button key={id} type="button" className={pagina === id ? "on" : ""} aria-current={pagina === id ? "page" : undefined} aria-label={nome} title={dica(nome)} onClick={() => onPagina(id)}>
              <Icone size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="m-txt">{nome}</span>
            </button>
          ))}
        </nav>

        <div className="m-rodape">
          <span className="m-txt">
            Posição em <strong>{dataBR(posicao)}</strong>
          </span>
          <button type="button" className="m-imprimir" aria-label="Imprimir" title={dica("Imprimir")} onClick={() => window.print()}>
            <Printer size={16} strokeWidth={1.75} aria-hidden="true" /> <span className="m-txt">Imprimir</span>
          </button>
        </div>
      </aside>
    </>
  );
}
