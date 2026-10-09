import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, Gavel, Minus, Wallet } from "lucide-react";
import type { PosicaoHistorico, Titulo } from "../dados/tipos";
import { nomeFilial, type Sistema } from "../dados/sistemas";
import { FAIXAS, agrupar, devedores, ehReceber, faixa, indicadores, previsaoSemanal, recebidoSemana, type Indicadores } from "../dados/calculos";
import { N, P, R, Rc, dataBR } from "../dados/formato";
import type { Filtros } from "../estado";
import { Numero } from "../componentes/Numero";
import { Barras } from "../componentes/Barras";
import { Colunas } from "../componentes/Colunas";
import { Busca } from "../componentes/Busca";
import { BarraFiltros, Cabecalho } from "../componentes/Cabecalho";

interface Props {
  s: Sistema;
  todos: Titulo[];
  gerado: string;
  historico: PosicaoHistorico[];
  f: Filtros;
  mudar: (m: Partial<Filtros>) => void;
  onCliente: (cod: string) => void;
}

const ROTULO_PREVISAO = ["A vencer (30 dias)", "Vencido 1–30 dias", "Vencido 31–60 dias", "Vencido 61–90 dias", "Vencido +90 dias"];
const CORES_IDADE = ["#94A3B8", "#F59E0B", "#EA580C", "#DC2626", "#7F1D1D"];

/** Subiu = ruim (vermelho), caiu = bom (verde). Sempre com seta e texto. */
function Variacao({ atual, antes, data }: { atual: number; antes?: number; data?: string }) {
  if (antes == null || !data) return null;
  const d = atual - antes;
  if (Math.abs(d) < 0.5)
    return (
      <span className="var igual">
        <Minus size={14} aria-hidden="true" /> igual a {dataBR(data)}
      </span>
    );
  const sobe = d > 0;
  return (
    <span className={"var " + (sobe ? "sobe" : "desce")}>
      {sobe ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
      {sobe ? "subiu " : "caiu "}
      {Rc(Math.abs(d))} {antes ? "(" + P(Math.abs(d) / antes) + ")" : ""} desde {dataBR(data)}
    </span>
  );
}

function Kpi({ Icone, rotulo, valor, sub, destaque, children }: { Icone: typeof Wallet; rotulo: string; valor: number; sub: string; destaque?: "risco" | "principal"; children?: React.ReactNode }) {
  return (
    <article className={"kpi" + (destaque ? " " + destaque : "")}>
      <header>
        <span className="kpi-ico" aria-hidden="true">
          <Icone size={18} strokeWidth={1.75} />
        </span>
        <h3>{rotulo}</h3>
      </header>
      <p className="kpi-valor">
        <Numero valor={valor} formato={R} />
      </p>
      <p className="kpi-sub">{sub}</p>
      {children}
    </article>
  );
}

function Cartao({ titulo, pergunta, acoes, children, className = "" }: { titulo: string; pergunta: string; acoes?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={"cartao " + className}>
      <header className="cartao-topo">
        <div>
          <h2>{titulo}</h2>
          <p>{pergunta}</p>
        </div>
        {acoes}
      </header>
      {children}
    </section>
  );
}

export function VisaoGeral({ s, todos, gerado, historico, f, mudar, onCliente }: Props) {
  const [dimensao, setDimensao] = useState<"filial" | "tipo">(s.semFilial ? "tipo" : "filial");
  const porFilial = !s.semFilial && dimensao === "filial";

  const naFilial = (t: Titulo) => !f.filial || t.filial === f.filial;
  const noTipo = (t: Titulo) => !f.tipo || t.tipo === f.tipo;
  const filtrados = useMemo(() => todos.filter((t) => naFilial(t) && noTipo(t)), [todos, f.filial, f.tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = useMemo(() => indicadores(filtrados), [filtrados]);
  const semana = useMemo(() => recebidoSemana(filtrados, gerado), [filtrados, gerado]);
  const previsao = useMemo(() => previsaoSemanal(filtrados, gerado), [filtrados, gerado]);
  const clientes = useMemo(() => devedores(todos), [todos]);

  // Comparação semanal: só quando não há filtro de tipo (o histórico guarda total e por filial)
  const ant = useMemo(() => {
    const e = historico.filter((h) => h.data < gerado).pop();
    if (!e || f.tipo) return null;
    const v = f.filial ? e.filiais?.[f.filial] : e.total;
    return v ? { data: e.data, v } : null;
  }, [historico, gerado, f.filial, f.tipo]);

  // Cada gráfico mostra todas as opções da sua dimensão (para trocar de filial/tipo com um clique)
  const barrasOnde = porFilial
    ? agrupar(todos.filter(noTipo), (t) => t.filial, (id) => nomeFilial(s, id)).map((i) => ({ ...i, detalhe: N(i.n) + " títulos" }))
    : agrupar(todos.filter(naFilial), (t) => t.tipo).map((i) => ({ ...i, detalhe: N(i.n) + " títulos" }));

  const recAbertos = filtrados.filter((t) => ehReceber(t) && !t.pago);
  // Previsão em 30 dias por idade da dívida: barra escura = deve entrar, barra clara = total em aberto
  const previsaoIdade = FAIXAS.map((fx, i) => {
    const daFaixa = recAbertos.filter((t) => faixa(t.dias) === i && t.dias > -30);
    const total = daFaixa.reduce((a, t) => a + t.aberto, 0);
    return { id: fx.id, rotulo: ROTULO_PREVISAO[i], valor: total * fx.chance, total, cor: CORES_IDADE[i], detalhe: "de " + Rc(total) + " · chance de " + P(fx.chance) };
  });
  const semanas = previsao.slice(1);
  const totalSemanas = semanas.reduce((a, c) => a + c.nominal, 0);

  const top = devedores(recAbertos).slice(0, 8);
  let acum = 0;
  const barrasTop = top.map((d) => {
    acum += d.valor;
    return { id: d.cod, rotulo: d.cliente, valor: d.valor, detalhe: "acumulado: " + P(k.receber ? acum / k.receber : 0) + " do A receber" };
  });

  const linhas: { id: string; nome: string; k: Indicadores }[] = (s.semFilial
    ? [...new Set(todos.map((t) => t.tipo))].map((id) => ({ id, nome: id, k: indicadores(todos.filter((t) => t.tipo === id && naFilial(t))) }))
    : s.filiais.map((fl) => ({ id: fl.id, nome: fl.nome, k: indicadores(todos.filter((t) => t.filial === fl.id && noTipo(t))) }))
  )
    .filter((l) => l.k.receber + l.k.demorados > 0)
    .sort((a, b) => b.k.receber - a.k.receber);
  const linhaAtiva = s.semFilial ? f.tipo : f.filial;


  return (
    <div className="pagina">
      <div className="faixa-escura">
        <Cabecalho titulo="Visão geral" s={s} gerado={gerado} direita={<Busca clientes={clientes} onAbrir={onCliente} />} />
        <BarraFiltros s={s} f={f} mudar={mudar} />

        <div className="kpis">
          <Kpi Icone={Wallet} rotulo="A receber" valor={k.receber} sub={N(k.nTitulos) + " títulos · " + N(k.nClientes) + " clientes · sem Judicial e Dívida Antiga"} destaque="principal">
            <Variacao atual={k.receber} antes={ant?.v.receber} data={ant?.data} />
          </Kpi>
          <Kpi Icone={CalendarClock} rotulo="Previsto para 30 dias" valor={k.previsto30} sub={P(k.receber ? k.previsto30 / k.receber : 0) + " do A receber · ponderado pela idade da dívida"} />
          <Kpi Icone={AlertTriangle} rotulo="Vencido há mais de 90 dias" valor={k.vencido90} sub={P(k.receber ? k.vencido90 / k.receber : 0) + " do A receber · maior risco de não entrar"} destaque="risco" />
          <Kpi Icone={Gavel} rotulo="Judicial + Dívida Antiga" valor={k.demorados} sub={N(k.nDemorados) + " títulos · recuperação mais difícil"}>
            <Variacao atual={k.demorados} antes={ant?.v.demorados} data={ant?.data} />
          </Kpi>
        </div>
        {!ant && !f.tipo && <p className="nota-clara">A comparação com a semana anterior aparece a partir da próxima atualização da planilha.</p>}
      </div>

      <div className="grade">
        <Cartao
          className="g7"
          titulo="Onde está o dinheiro a receber"
          pergunta={porFilial ? "A receber por filial. Toque em uma filial para filtrar o painel." : "A receber por tipo de título. Toque em um tipo para filtrar o painel."}
          acoes={
            !s.semFilial && (
              <div className="segmento" role="group" aria-label="Agrupar por">
                <button type="button" aria-pressed={dimensao === "filial"} onClick={() => setDimensao("filial")}>
                  Filial
                </button>
                <button type="button" aria-pressed={dimensao === "tipo"} onClick={() => setDimensao("tipo")}>
                  Tipo
                </button>
              </div>
            )
          }
        >
          <Barras
            itens={barrasOnde}
            ativo={porFilial ? f.filial : f.tipo}
            onEscolher={(id) => (porFilial ? mudar({ filial: f.filial === id ? "" : id }) : mudar({ tipo: f.tipo === id ? "" : id }))}
          />
        </Cartao>

        <Cartao className="g5" titulo="Previsão de entrada em 30 dias" pergunta="Quanto deve entrar de cada faixa de atraso. Barra escura: deve entrar · barra clara: total em aberto.">
          <div className="semana">
            <span>Deve entrar em 30 dias</span>
            <b>{R(k.previsto30)}</b>
            <small>
              entrou nos últimos 7 dias: {R(semana.valor)}
              {semana.n ? " (" + N(semana.n) + " títulos)" : ""}
            </small>
          </div>
          <Barras itens={previsaoIdade} />
        </Cartao>

        <Cartao className="g7" titulo="Maiores devedores" pergunta="Toque em um cliente para abrir a ficha com todos os títulos.">
          <Barras itens={barrasTop} onEscolher={onCliente} />
        </Cartao>

        <Cartao className="g5" titulo="Próximos vencimentos" pergunta={"O que vence nas próximas 8 semanas: " + R(totalSemanas) + "."}>
          {totalSemanas > 0 ? (
            <>
              <Colunas itens={semanas} />
              <p className="legenda">
                <i className="lg-esperado" /> deve entrar (95%) <i className="lg-nominal" /> total que vence
              </p>
            </>
          ) : (
            <p className="vazio">Nada vence nas próximas 8 semanas com estes filtros.</p>
          )}
        </Cartao>

        <Cartao className="g12" titulo={s.semFilial ? "Resumo por tipo de título" : "Resumo por filial"} pergunta="Toque em uma linha para filtrar o painel.">
          <div className="tabela">
            <table>
              <thead>
                <tr>
                  <th scope="col">{s.semFilial ? "Tipo" : "Filial"}</th>
                  <th scope="col" className="num">A receber</th>
                  <th scope="col" className="num">Previsto 30 dias</th>
                  <th scope="col" className="num">Vencido +90 dias</th>
                  <th scope="col" className="num">Judicial + Dívida</th>
                  <th scope="col" className="num">Clientes</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className={linhaAtiva === l.id ? "on" : ""}>
                    <th scope="row">
                      <button type="button" aria-pressed={linhaAtiva === l.id} onClick={() => (s.semFilial ? mudar({ tipo: f.tipo === l.id ? "" : l.id }) : mudar({ filial: f.filial === l.id ? "" : l.id }))}>
                        {l.nome}
                      </button>
                    </th>
                    <td className="num" data-rot="A receber">{R(l.k.receber)}</td>
                    <td className="num" data-rot="Previsto 30 dias">{R(l.k.previsto30)}</td>
                    <td className={"num" + (l.k.vencido90 > 0 ? " risco" : "")} data-rot="Vencido +90 dias">{R(l.k.vencido90)}</td>
                    <td className="num" data-rot="Judicial + Dívida">{R(l.k.demorados)}</td>
                    <td className="num" data-rot="Clientes">{N(l.k.nClientes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
