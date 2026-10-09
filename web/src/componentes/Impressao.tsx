import { useMemo } from "react";
import type { Titulo } from "../dados/tipos";
import { nomeFilial, type Sistema } from "../dados/sistemas";
import { FAIXAS, agrupar, devedores, ehReceber, faixa, indicadores } from "../dados/calculos";
import { N, P, R, Rc, dataBR } from "../dados/formato";
import type { Filtros } from "../estado";
import { Barras } from "./Barras";

const ROTULOS = ["A vencer (30 dias)", "Vencido 1–30 dias", "Vencido 31–60 dias", "Vencido 61–90 dias", "Vencido +90 dias"];
const CORES = ["#94A3B8", "#F59E0B", "#EA580C", "#DC2626", "#7F1D1D"];

/** Folha A4 de resumo para reunião. Fica escondida na tela e é a única coisa que sai na impressão. */
export function Impressao({ s, todos, gerado, f }: { s: Sistema; todos: Titulo[]; gerado: string; f: Filtros }) {
  const dados = useMemo(() => {
    const filtrados = todos.filter((t) => (!f.filial || t.filial === f.filial) && (!f.tipo || t.tipo === f.tipo));
    const k = indicadores(filtrados);
    const rec = filtrados.filter((t) => ehReceber(t) && !t.pago);
    const onde = s.semFilial || f.filial ? agrupar(filtrados, (t) => t.tipo) : agrupar(filtrados, (t) => t.filial, (id) => nomeFilial(s, id));
    const previsao = FAIXAS.map((fx, i) => {
      const total = rec.filter((t) => faixa(t.dias) === i && t.dias > -30).reduce((a, t) => a + t.aberto, 0);
      return { id: fx.id, rotulo: ROTULOS[i], valor: total * fx.chance, total, cor: CORES[i], detalhe: "de " + Rc(total) + " · chance de " + P(fx.chance) };
    });
    const top = devedores(rec)
      .slice(0, 8)
      .map((d) => ({ id: d.cod, rotulo: d.cliente, valor: d.valor }));
    const linhas = (s.semFilial ? [...new Set(filtrados.map((t) => t.tipo))].map((id) => ({ id, nome: id, k: indicadores(filtrados.filter((t) => t.tipo === id)) })) : s.filiais.map((fl) => ({ id: fl.id, nome: fl.nome, k: indicadores(filtrados.filter((t) => t.filial === fl.id)) })))
      .filter((l) => l.k.receber + l.k.demorados > 0)
      .sort((a, b) => b.k.receber - a.k.receber);
    return { k, onde, previsao, top, linhas };
  }, [todos, s, f.filial, f.tipo]);

  const filtro = [f.filial && "Filial " + nomeFilial(s, f.filial), f.tipo && "Tipo " + f.tipo].filter(Boolean).join(" · ");
  const { k } = dados;

  return (
    <section className="impressao" aria-hidden="true">
      <header className="i-topo">
        <img src="logo.png" alt="" />
        <div>
          <h1>Painel de Inadimplência · {s.nome}</h1>
          <p>
            Posição em {dataBR(gerado)} · impresso em {new Date().toLocaleDateString("pt-BR")}
            {filtro && " · " + filtro}
          </p>
        </div>
      </header>

      <div className="i-kpis">
        <div className="i-kpi destaque">
          <span>A receber</span>
          <b>{R(k.receber)}</b>
          <small>
            {N(k.nTitulos)} títulos · {N(k.nClientes)} clientes
          </small>
        </div>
        <div className="i-kpi">
          <span>Previsto para 30 dias</span>
          <b>{R(k.previsto30)}</b>
          <small>{P(k.receber ? k.previsto30 / k.receber : 0)} do A receber</small>
        </div>
        <div className="i-kpi">
          <span>Vencido há mais de 90 dias</span>
          <b>{R(k.vencido90)}</b>
          <small>{P(k.receber ? k.vencido90 / k.receber : 0)} do A receber</small>
        </div>
        <div className="i-kpi">
          <span>Judicial + Dívida Antiga</span>
          <b>{R(k.demorados)}</b>
          <small>{N(k.nDemorados)} títulos</small>
        </div>
      </div>
      <p className="i-nota">A receber = tudo o que falta receber, menos Judicial e Dívida Antiga. Previsão ponderada pela chance de pagar de cada faixa de atraso. Valores em reais.</p>

      <div className="i-duas">
        <div className="i-bloco">
          <h2>Onde está o dinheiro a receber</h2>
          <Barras itens={dados.onde.slice(0, 8)} />
        </div>
        <div className="i-bloco">
          <h2>Previsão de entrada em 30 dias: {R(k.previsto30)}</h2>
          <Barras itens={dados.previsao} />
        </div>
      </div>

      <div className="i-duas">
        <div className="i-bloco">
          <h2>Maiores devedores</h2>
          <Barras itens={dados.top} />
        </div>
        <div className="i-bloco">
          <h2>{s.semFilial ? "Resumo por tipo" : "Resumo por filial"}</h2>
          <table className="i-tab">
            <thead>
              <tr>
                <th>{s.semFilial ? "Tipo" : "Filial"}</th>
                <th className="num">A receber</th>
                <th className="num">Previsto 30d</th>
                <th className="num">+90 dias</th>
              </tr>
            </thead>
            <tbody>
              {dados.linhas.map((l) => (
                <tr key={l.id}>
                  <td>{l.nome}</td>
                  <td className="num">{Rc(l.k.receber)}</td>
                  <td className="num">{Rc(l.k.previsto30)}</td>
                  <td className="num">{Rc(l.k.vencido90)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="i-rodape">Vincol Pneus · Volta Redonda – RJ · Dados do relatório financeiro ({s.nome})</footer>
    </section>
  );
}
