import { useMemo, useState } from "react";
import { Download, Info, RotateCcw, Search } from "lucide-react";
import type { Cor, Titulo } from "../dados/tipos";
import type { Sistema } from "../dados/sistemas";
import { BOLETO } from "../dados/calculos";
import { N, R, diasTxt } from "../dados/formato";
import type { Filtros } from "../estado";
import { BarraFiltros, Cabecalho } from "../componentes/Cabecalho";
import { NOMES_COR } from "./Titulos";

interface Props {
  s: Sistema;
  todos: Titulo[];
  gerado: string;
  f: Filtros;
  mudar: (m: Partial<Filtros>) => void;
  cor: (cod: string) => Cor;
  definir: (cod: string, c: Cor) => void;
  pendentes: number;
  onBaixar: () => void;
  onDescartar: () => void;
  onCliente: (cod: string) => void;
}

const ORDEM_CORES: Cor[] = ["verde", "amarelo", "vermelho", "nenhum"];
const DICAS: Record<Cor, string> = { verde: "Sempre paga", amarelo: "Paga, mas com atraso", vermelho: "Nunca paga", nenhum: "Remover a cor" };

interface Cliente {
  cod: string;
  cliente: string;
  filiais: string[];
  naoPagos: number;
  aberto: number;
  maiorAtraso: number;
  pagou: boolean;
}

export function Classificar({ s, todos, gerado, f, mudar, cor, definir, pendentes, onBaixar, onDescartar, onCliente }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroCor, setFiltroCor] = useState<Cor | "">("");
  const [soBoletos, setSoBoletos] = useState(true);
  const [limite, setLimite] = useState(100);

  const clientes = useMemo<Cliente[]>(() => {
    const m = new Map<string, Cliente>();
    for (const t of todos) {
      if (soBoletos && t.tipo !== BOLETO) continue;
      if (f.filial && t.filial !== f.filial) continue;
      const c = m.get(t.cod) ?? { cod: t.cod, cliente: t.cliente, filiais: [], naoPagos: 0, aberto: 0, maiorAtraso: -Infinity, pagou: false };
      if (!c.filiais.includes(t.filial)) c.filiais.push(t.filial);
      if (t.pago) c.pagou = true;
      else {
        c.naoPagos += 1;
        c.aberto += t.aberto;
        c.maiorAtraso = Math.max(c.maiorAtraso, t.dias);
      }
      m.set(t.cod, c);
    }
    return [...m.values()].sort((a, b) => b.aberto - a.aberto);
  }, [todos, soBoletos, f.filial]);

  const contagem = useMemo(() => {
    const k: Record<Cor, number> = { verde: 0, amarelo: 0, vermelho: 0, nenhum: 0 };
    for (const c of clientes) k[cor(c.cod)] += 1;
    return k;
  }, [clientes, cor]);

  const q = busca.trim().toLowerCase();
  const lista = clientes.filter((c) => (!filtroCor || cor(c.cod) === filtroCor) && (!q || (c.cliente + " " + c.cod).toLowerCase().includes(q)));

  return (
    <div className="pagina">
      <div className="faixa-escura">
        <Cabecalho
          titulo="Classificar clientes"
          s={s}
          gerado={gerado}
          subtitulo="Marque cada cliente pelo jeito que ele costuma pagar."
          direita={
            <div className="busca">
              <Search size={16} className="busca-ico" aria-hidden="true" />
              <input type="search" aria-label="Buscar cliente ou código" placeholder="Buscar cliente ou código…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          }
        />
        <BarraFiltros
          s={s}
          f={f}
          mudar={mudar}
          comTipo={false}
          extra={
            <label className="sel">
              <span>Clientes</span>
              <select value={soBoletos ? "boletos" : "todos"} onChange={(e) => setSoBoletos(e.target.value === "boletos")}>
                <option value="boletos">Só clientes de boleto</option>
                <option value="todos">Todos os clientes</option>
              </select>
            </label>
          }
        />
        <div className="situacoes" role="group" aria-label="Filtrar por classificação">
          <button type="button" aria-pressed={!filtroCor} onClick={() => setFiltroCor("")}>
            Todos <small>{N(clientes.length)}</small>
          </button>
          {ORDEM_CORES.map((c) => (
            <button key={c} type="button" aria-pressed={filtroCor === c} onClick={() => setFiltroCor(c)}>
              <i className={"ponto cor-" + c} aria-hidden="true" /> {NOMES_COR[c]} <small>{N(contagem[c])}</small>
            </button>
          ))}
        </div>
      </div>

      <div className={"aviso-publicar" + (pendentes ? " pendente" : "")}>
        <Info size={18} aria-hidden="true" />
        <p>
          {pendentes ? (
            <>
              Você tem <b>{N(pendentes)}</b> classificação(ões) salva(s) só neste navegador. Para todos verem, baixe o arquivo e envie o <code>ratings.js</code> para o repositório.
            </>
          ) : (
            <>As classificações ficam salvas neste navegador. Para todos verem, baixe o arquivo e envie o <code>ratings.js</code> para o repositório.</>
          )}
        </p>
        <div className="acoes">
          <button type="button" className="btn-escuro" onClick={onBaixar}>
            <Download size={16} aria-hidden="true" /> Baixar classificações
          </button>
          {pendentes > 0 && (
            <button type="button" className="btn-claro" onClick={() => confirm("Descartar as classificações feitas neste navegador e voltar às publicadas?") && onDescartar()}>
              <RotateCcw size={16} aria-hidden="true" /> Descartar alterações
            </button>
          )}
        </div>
      </div>

      <section className="cartao">
        <header className="cartao-topo">
          <div>
            <h2>{N(lista.length)} cliente(s)</h2>
            <p>Verde = em dia (sempre paga) · amarelo = em atraso (paga, mas com atraso) · vermelho = inadimplente (nunca paga).</p>
          </div>
        </header>
        <ul className="clientes">
          {lista.slice(0, limite).map((c) => {
            const atual = cor(c.cod);
            return (
              <li key={c.cod}>
                <button type="button" className="cl-nome" onClick={() => onCliente(c.cod)}>
                  {c.cliente}
                  <small>
                    Cód. {c.cod}
                    {!s.semFilial && " · " + c.filiais.join(", ")}
                    {c.pagou && " · já pagou título"}
                  </small>
                </button>
                <div className="cl-num">
                  <b>{R(c.aberto)}</b>
                  <small>
                    {N(c.naoPagos)} não pago(s){c.naoPagos ? " · " + diasTxt(c.maiorAtraso) : ""}
                  </small>
                </div>
                <div className="cl-cores" role="radiogroup" aria-label={"Classificação de " + c.cliente}>
                  {ORDEM_CORES.map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={atual === k} title={NOMES_COR[k] + ": " + DICAS[k]} className={"cl-cor cor-" + k + (atual === k ? " on" : "")} onClick={() => definir(c.cod, k)}>
                      <i aria-hidden="true" />
                      <span>{NOMES_COR[k]}</span>
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
          {!lista.length && <li className="vazio">Nenhum cliente encontrado.</li>}
        </ul>
        {lista.length > limite && (
          <div className="mais">
            <button type="button" className="btn-escuro" onClick={() => setLimite((l) => l + 200)}>
              Mostrar mais ({N(lista.length - limite)} restantes)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
