import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from "lucide-react";
import type { Titulo } from "../dados/tipos";
import { N, R } from "../dados/formato";

export interface Coluna {
  id: string;
  nome: string;
  num?: boolean;
  /** Valor mostrado na lista do filtro (e usado para filtrar). */
  valor: (t: Titulo) => string;
  ordem: (a: Titulo, b: Titulo) => number;
  celula: (t: Titulo) => ReactNode;
}

interface Props {
  coluna: Coluna;
  /** Linhas já filtradas pelas outras colunas (como no Excel). */
  linhas: Titulo[];
  selecionados?: string[];
  ancora: DOMRect;
  onAplicar: (valores: string[] | null) => void;
  onOrdenar: (dir: 1 | -1) => void;
  onFechar: () => void;
}

/** Filtro de coluna estilo Excel: ordenar, pesquisar, marcar valores e ver a soma do que está marcado. */
export function FiltroColuna({ coluna, linhas, selecionados, ancora, onAplicar, onOrdenar, onFechar }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const [busca, setBusca] = useState("");

  const valores = useMemo(() => {
    const m = new Map<string, { n: number; aberto: number; exemplo: Titulo }>();
    for (const t of linhas) {
      const v = coluna.valor(t);
      const it = m.get(v) ?? { n: 0, aberto: 0, exemplo: t };
      it.n += 1;
      it.aberto += t.aberto;
      m.set(v, it);
    }
    return [...m.entries()].sort((a, b) => coluna.ordem(a[1].exemplo, b[1].exemplo)).map(([v, it]) => ({ v, ...it }));
  }, [linhas, coluna]);

  const [marcados, setMarcados] = useState<Set<string>>(() => new Set(selecionados ?? valores.map((x) => x.v)));
  const visiveis = valores.filter((x) => !busca || x.v.toLowerCase().includes(busca.toLowerCase()));
  const todosMarcados = visiveis.length > 0 && visiveis.every((x) => marcados.has(x.v));
  const soma = valores.reduce((a, x) => (marcados.has(x.v) ? { n: a.n + x.n, aberto: a.aberto + x.aberto } : a), { n: 0, aberto: 0 });

  useEffect(() => {
    caixa.current?.querySelector("input")?.focus({ preventScroll: true });
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Element;
      // o próprio botão da coluna alterna (abre/fecha) no clique
      if (caixa.current && !caixa.current.contains(alvo) && !alvo.closest?.(".th-filtro, .col-chips button")) onFechar();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [onFechar]);

  const alternar = (v: string) =>
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });

  const largura = 320;
  const estilo = { top: ancora.bottom + window.scrollY + 6, left: Math.max(8, Math.min(ancora.left + window.scrollX, window.innerWidth - largura - 8)) };

  return (
    <div ref={caixa} className="filtro-col" style={estilo} role="dialog" aria-label={"Filtrar coluna " + coluna.nome}>
      <div className="fc-ordem">
        <button type="button" onClick={() => onOrdenar(1)}>
          <ArrowUpNarrowWide size={16} aria-hidden="true" /> Ordenar do menor para o maior / A a Z
        </button>
        <button type="button" onClick={() => onOrdenar(-1)}>
          <ArrowDownWideNarrow size={16} aria-hidden="true" /> Ordenar do maior para o menor / Z a A
        </button>
      </div>
      <div className="fc-busca">
        <Search size={15} aria-hidden="true" />
        <input type="search" placeholder="Pesquisar…" aria-label="Pesquisar valores" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <label className="fc-item fc-todos">
        <input
          type="checkbox"
          checked={todosMarcados}
          onChange={() =>
            setMarcados((m) => {
              const n = new Set(m);
              for (const x of visiveis) {
                if (todosMarcados) n.delete(x.v);
                else n.add(x.v);
              }
              return n;
            })
          }
        />
        (Selecionar tudo)
      </label>
      <div className="fc-lista">
        {visiveis.slice(0, 400).map((x) => (
          <label key={x.v} className="fc-item">
            <input type="checkbox" checked={marcados.has(x.v)} onChange={() => alternar(x.v)} />
            <span>{x.v}</span>
            <small>{N(x.n)}</small>
          </label>
        ))}
        {visiveis.length > 400 && <p className="fc-nota">Mostrando 400 de {N(visiveis.length)}. Use a pesquisa.</p>}
        {!visiveis.length && <p className="fc-nota">Nenhum valor encontrado.</p>}
      </div>
      <p className="fc-soma" aria-live="polite">
        Selecionado: <b>{N(soma.n)}</b> título(s) · falta receber <b>{R(soma.aberto)}</b>
      </p>
      <div className="fc-acoes">
        <button type="button" className="fc-ok" onClick={() => onAplicar(marcados.size === valores.length ? null : [...marcados])}>
          Aplicar
        </button>
        <button type="button" onClick={() => onAplicar(null)}>
          Limpar
        </button>
        <button type="button" onClick={onFechar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
