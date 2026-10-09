import { useCallback, useMemo, useState } from "react";
import { Download, ListFilter, Search, X } from "lucide-react";
import type { Cor, Titulo } from "../dados/tipos";
import { nomeFilial, type Sistema } from "../dados/sistemas";
import { FAIXAS, faixa } from "../dados/calculos";
import { N, R, dataBR, diasTxt } from "../dados/formato";
import { baixar, csv, numeroExcel } from "../dados/exportar";
import type { Filtros, Situacao } from "../estado";
import { BarraFiltros, Cabecalho } from "../componentes/Cabecalho";
import { FiltroColuna, type Coluna } from "../componentes/FiltroColuna";

export const NOMES_COR: Record<Cor, string> = { verde: "Em dia", amarelo: "Em atraso", vermelho: "Inadimplente", nenhum: "Sem classificação" };

interface Props {
  s: Sistema;
  todos: Titulo[];
  gerado: string;
  f: Filtros;
  mudar: (m: Partial<Filtros>) => void;
  onCliente: (cod: string) => void;
  cor: (cod: string) => Cor;
}

const SITUACOES: { id: Situacao; nome: string }[] = [
  { id: "", nome: "Todos" },
  { id: "abertos", nome: "Não pagos" },
  { id: "vencidos", nome: "Vencidos" },
  { id: "pagos", nome: "Pagos" },
];

function passaSituacao(t: Titulo, st: Situacao) {
  if (st === "abertos") return !t.pago;
  if (st === "vencidos") return !t.pago && t.dias > 0;
  if (st === "pagos") return t.pago;
  return true;
}

const txt = (a: string, b: string) => a.localeCompare(b, "pt-BR", { numeric: true });

export function Titulos({ s, todos, gerado, f, mudar, onCliente, cor }: Props) {
  const [busca, setBusca] = useState("");
  const [colFiltros, setColFiltros] = useState<Record<string, string[]>>({});
  const [ordem, setOrdem] = useState<{ id: string; dir: 1 | -1 } | null>(null);
  const [limite, setLimite] = useState(100);
  const [aberta, setAberta] = useState<{ id: string; ancora: DOMRect } | null>(null);
  const fecharFiltro = useCallback(() => setAberta(null), []);

  const colunas = useMemo<Coluna[]>(() => {
    const c: (Coluna | false)[] = [
      {
        id: "cliente",
        nome: "Cliente",
        valor: (t) => t.cliente,
        ordem: (a, b) => txt(a.cliente, b.cliente),
        celula: (t) => (
          <button type="button" className="t-cliente" onClick={() => onCliente(t.cod)}>
            {t.cliente}
            <small>Cód. {t.cod}</small>
          </button>
        ),
      },
      !f.tipo && { id: "tipo", nome: "Tipo", valor: (t) => t.tipo, ordem: (a, b) => txt(a.tipo, b.tipo), celula: (t) => t.tipo },
      !s.semFilial && !f.filial && { id: "filial", nome: "Filial", valor: (t) => nomeFilial(s, t.filial), ordem: (a, b) => txt(a.filial, b.filial), celula: (t) => nomeFilial(s, t.filial) },
      {
        id: "titulo",
        nome: "Título",
        valor: (t) => t.titulo,
        ordem: (a, b) => txt(a.titulo, b.titulo),
        celula: (t) => (
          <span>
            {t.titulo}
            {t.parcela && <small> parc. {t.parcela}</small>}
          </span>
        ),
      },
      { id: "venc", nome: "Vencimento", valor: (t) => dataBR(t.vencimento), ordem: (a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? ""), celula: (t) => dataBR(t.vencimento) },
      {
        id: "dias",
        nome: "Dias vencido",
        num: true,
        valor: (t) => (t.pago ? "Pago" : FAIXAS[faixa(t.dias)].nome),
        ordem: (a, b) => a.dias - b.dias,
        celula: (t) => (t.pago ? "—" : <span className={t.dias > 90 ? "risco" : ""}>{diasTxt(t.dias)}</span>),
      },
      {
        id: "situacao",
        nome: "Situação",
        num: true,
        valor: (t) => (t.pago ? "Pago" : "Não pago"),
        ordem: (a, b) => a.aberto + a.recebido - (b.aberto + b.recebido),
        celula: (t) =>
          t.pago ? (
            <>
              <span className="selo pago">Pago{t.pagoEm ? " em " + dataBR(t.pagoEm) : ""}</span>
              <b>{R(t.recebido)}</b>
            </>
          ) : (
            <>
              <span className="selo aberto">Falta receber</span>
              <b>{R(t.aberto)}</b>
            </>
          ),
      },
      {
        id: "classe",
        nome: "Classificação",
        valor: (t) => NOMES_COR[cor(t.cod)],
        ordem: (a, b) => txt(NOMES_COR[cor(a.cod)], NOMES_COR[cor(b.cod)]),
        celula: (t) => <span className={"pilula cor-" + cor(t.cod)}>{NOMES_COR[cor(t.cod)]}</span>,
      },
    ];
    return c.filter(Boolean) as Coluna[];
  }, [s, f.tipo, f.filial, cor, onCliente]);

  // Filtros de fora da tabela: filial, tipo, situação e busca
  const base = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todos.filter(
      (t) =>
        (!f.filial || t.filial === f.filial) &&
        (!f.tipo || t.tipo === f.tipo) &&
        passaSituacao(t, f.st) &&
        (!q || (t.cliente + " " + t.cod + " " + t.titulo).toLowerCase().includes(q)),
    );
  }, [todos, f.filial, f.tipo, f.st, busca]);

  const passaColunas = useCallback(
    (t: Titulo, ignorar?: string) => {
      for (const c of colunas) {
        const sel = colFiltros[c.id];
        if (!sel || c.id === ignorar) continue;
        if (!sel.includes(c.valor(t))) return false;
      }
      return true;
    },
    [colunas, colFiltros],
  );

  const lista = useMemo(() => {
    const l = base.filter((t) => passaColunas(t));
    const c = ordem && colunas.find((x) => x.id === ordem.id);
    if (c) l.sort((a, b) => c.ordem(a, b) * ordem!.dir);
    else l.sort((a, b) => b.aberto + b.recebido - (a.aberto + a.recebido));
    return l;
  }, [base, passaColunas, ordem, colunas]);

  const naoPagos = lista.filter((t) => !t.pago);
  const recebido = lista.reduce((a, t) => a + t.recebido, 0);
  const temColFiltro = Object.keys(colFiltros).length > 0 || ordem;
  const colAberta = aberta && colunas.find((c) => c.id === aberta.id);

  const exportar = () => {
    const cab = ["Filial", "Tipo", "Cliente", "Codigo cliente", "Titulo", "Parcela", "Vencimento", "Dias vencido", "Valor do titulo", "Falta receber", "Recebido", "Data pagamento", "Classificacao"];
    const linhas = lista.map((t) => [nomeFilial(s, t.filial), t.tipo, t.cliente, t.cod, t.titulo, t.parcela, dataBR(t.vencimento), t.pago ? "" : t.dias, numeroExcel(t.valor), numeroExcel(t.aberto), numeroExcel(t.recebido), t.pagoEm ? dataBR(t.pagoEm) : "", NOMES_COR[cor(t.cod)]]);
    const nome = ["titulos", s.nome, f.filial ? nomeFilial(s, f.filial) : "", f.tipo].filter(Boolean).join("_").replace(/\s+/g, "_");
    baixar(nome + ".csv", csv([cab, ...linhas]), "text/csv;charset=utf-8");
  };

  const abrirFiltro = (id: string, el: HTMLElement) => setAberta((a) => (a?.id === id ? null : { id, ancora: el.getBoundingClientRect() }));

  return (
    <div className="pagina">
      <div className="faixa-escura">
        <Cabecalho
          titulo="Títulos"
          s={s}
          gerado={gerado}
          direita={
            <div className="busca">
              <Search size={16} className="busca-ico" aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar cliente, código ou título"
                placeholder="Buscar cliente, código ou título…"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setLimite(100);
                }}
              />
            </div>
          }
        />
        <BarraFiltros s={s} f={f} mudar={mudar} />
        <div className="situacoes" role="group" aria-label="Situação do título">
          {SITUACOES.map((x) => (
            <button key={x.id} type="button" aria-pressed={f.st === x.id} onClick={() => mudar({ st: x.id })}>
              {x.nome}
            </button>
          ))}
        </div>
        <div className="totais" role="status">
          <div>
            <span>Títulos na lista</span>
            <b>{N(lista.length)}</b>
          </div>
          <div>
            <span>Não pagos</span>
            <b>{N(naoPagos.length)}</b>
          </div>
          <div>
            <span>Falta receber</span>
            <b>{R(naoPagos.reduce((a, t) => a + t.aberto, 0))}</b>
          </div>
          <div>
            <span>Recebido</span>
            <b>{R(recebido)}</b>
          </div>
        </div>
      </div>

      <section className="cartao lista-titulos">
        <header className="cartao-topo">
          <div>
            <h2>Lista de títulos</h2>
            <p>Toque no cliente para abrir a ficha. Use a seta de cada coluna para filtrar e ordenar, como no Excel.</p>
          </div>
          <div className="acoes">
            {temColFiltro && (
              <button
                type="button"
                className="btn-claro"
                onClick={() => {
                  setColFiltros({});
                  setOrdem(null);
                }}
              >
                <X size={16} aria-hidden="true" /> Limpar filtros das colunas
              </button>
            )}
            <button type="button" className="btn-claro" onClick={exportar}>
              <Download size={16} aria-hidden="true" /> Exportar para Excel
            </button>
          </div>
        </header>

        {/* No celular os filtros de coluna ficam numa fila de botões */}
        <div className="col-chips" role="group" aria-label="Filtrar colunas">
          {colunas.map((c) => (
            <button key={c.id} type="button" className={colFiltros[c.id] || ordem?.id === c.id ? "on" : ""} onClick={(e) => abrirFiltro(c.id, e.currentTarget)}>
              <ListFilter size={14} aria-hidden="true" /> {c.nome}
            </button>
          ))}
        </div>

        <div className="tabela tabela-titulos">
          <table>
            <thead>
              <tr>
                {colunas.map((c) => {
                  const ativo = Boolean(colFiltros[c.id]) || ordem?.id === c.id;
                  return (
                    <th key={c.id} scope="col" className={c.num ? "num" : ""} aria-sort={ordem?.id === c.id ? (ordem.dir > 0 ? "ascending" : "descending") : "none"}>
                      <button type="button" className={"th-filtro" + (ativo ? " on" : "")} aria-haspopup="dialog" aria-expanded={aberta?.id === c.id} onClick={(e) => abrirFiltro(c.id, e.currentTarget)}>
                        {c.nome}
                        <ListFilter size={13} aria-hidden="true" />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, limite).map((t, i) => (
                <tr key={t.cod + t.tipo + t.titulo + t.parcela + i} className={t.pago ? "pago" : ""}>
                  {colunas.map((c) => (
                    <td key={c.id} className={(c.num ? "num " : "") + "c-" + c.id} data-rot={c.nome}>
                      {c.celula(t)}
                    </td>
                  ))}
                </tr>
              ))}
              {!lista.length && (
                <tr>
                  <td colSpan={colunas.length} className="vazio">
                    Nenhum título encontrado. Tente limpar a busca ou os filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {lista.length > limite && (
          <div className="mais">
            <button type="button" className="btn-escuro" onClick={() => setLimite((l) => l + 200)}>
              Mostrar mais ({N(lista.length - limite)} restantes)
            </button>
          </div>
        )}
      </section>

      {colAberta && aberta && (
        <FiltroColuna
          key={colAberta.id}
          coluna={colAberta}
          linhas={base.filter((t) => passaColunas(t, colAberta.id))}
          selecionados={colFiltros[colAberta.id]}
          ancora={aberta.ancora}
          onFechar={fecharFiltro}
          onOrdenar={(dir) => {
            setOrdem({ id: colAberta.id, dir });
            setAberta(null);
          }}
          onAplicar={(v) => {
            setColFiltros((cf) => {
              const n = { ...cf };
              if (v) n[colAberta.id] = v;
              else delete n[colAberta.id];
              return n;
            });
            setLimite(100);
            setAberta(null);
          }}
        />
      )}
    </div>
  );
}
