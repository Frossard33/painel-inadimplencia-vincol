import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu as IconeMenu } from "lucide-react";
import { carregarBase } from "./dados/carregar";
import { preparar } from "./dados/calculos";
import { SISTEMAS } from "./dados/sistemas";
import type { Base, SistemaId } from "./dados/tipos";
import { classificacoesFinais, useClassificacoes, useFiltros } from "./estado";
import { baixar } from "./dados/exportar";
import { Menu } from "./componentes/Menu";
import { FichaCliente } from "./componentes/FichaCliente";
import { Impressao } from "./componentes/Impressao";
import { VisaoGeral } from "./paginas/VisaoGeral";
import { Titulos } from "./paginas/Titulos";
import { Classificar } from "./paginas/Classificar";

export default function App() {
  const [base, setBase] = useState<Base | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    carregarBase().then(setBase, (e: Error) => setErro(e.message));
  }, []);

  if (erro)
    return (
      <div className="tela-msg" role="alert">
        <h1>Não foi possível carregar os dados</h1>
        <p>{erro}</p>
      </div>
    );
  if (!base)
    return (
      <div className="tela-msg" aria-busy="true">
        <div className="carregando" />
        <p>Carregando o painel…</p>
      </div>
    );
  return <Painel base={base} />;
}

function Painel({ base }: { base: Base }) {
  const [f, mudar] = useFiltros();
  const disponiveis = (Object.keys(SISTEMAS) as SistemaId[]).filter((id) => base.dados[id]);
  const sisId = base.dados[f.sis] ? f.sis : disponiveis[0];
  const s = SISTEMAS[sisId];
  const dados = base.dados[sisId]!;
  const todos = useMemo(() => preparar(dados, s), [dados, s]);
  const { cor, definir, locais, descartar } = useClassificacoes(s.chaveLocal, base.classificacoes[sisId]);

  /* ratings.js com os dois sistemas: publicadas + alterações deste navegador */
  const baixarClassificacoes = () => {
    let txt = '// Classificação dos clientes (semáforo). Chave = código do cliente.\n// Valores: "verde" (em dia), "amarelo" (em atraso), "vermelho" (inadimplente).\n';
    for (const id of Object.keys(SISTEMAS) as SistemaId[]) {
      const S = SISTEMAS[id];
      const o = classificacoesFinais(S.chaveLocal, base.classificacoes[id]);
      const linhas = Object.keys(o)
        .sort()
        .map((k) => '  "' + k + '": "' + o[k] + '"');
      txt += "window." + S.variavel + " = {\n" + linhas.join(",\n") + "\n};\n";
    }
    baixar("ratings.js", txt, "text/javascript;charset=utf-8");
  };

  const [menu, setMenu] = useState(false);
  // Menu lateral recolhido (só ícones) no computador; a escolha fica salva neste navegador
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem("vincol_menu_recolhido") === "1";
    } catch {
      return false;
    }
  });
  const alternarMenu = useCallback(() => {
    setRecolhido((r) => {
      try {
        localStorage.setItem("vincol_menu_recolhido", r ? "0" : "1");
      } catch {
        /* sem armazenamento */
      }
      return !r;
    });
  }, []);
  const [cliente, setCliente] = useState<string | null>(null);
  const fecharMenu = useCallback(() => setMenu(false), []);
  const fecharFicha = useCallback(() => setCliente(null), []);

  useEffect(() => {
    document.title = "Painel de Inadimplência · " + s.nome + " · Vincol";
    document.documentElement.style.setProperty("--sis", s.cor);
  }, [s]);

  return (
    <div className={"app" + (recolhido ? " menu-recolhido" : "")}>
      <a className="pular" href="#conteudo" onClick={(e) => (e.preventDefault(), document.getElementById("conteudo")?.focus())}>
        Pular para o conteúdo
      </a>
      <Menu
        pagina={f.pagina}
        sis={sisId}
        disponiveis={disponiveis}
        posicao={dados.gerado}
        aberto={menu}
        recolhido={recolhido}
        onRecolher={alternarMenu}
        onFechar={fecharMenu}
        onPagina={(p) => {
          mudar({ pagina: p });
          setMenu(false);
          window.scrollTo(0, 0);
        }}
        onSistema={(id) => {
          mudar({ sis: id });
          setMenu(false);
        }}
      />

      <div className="area">
        <header className="barra-celular">
          <button type="button" className="b-menu" onClick={() => setMenu(true)} aria-label="Abrir menu" aria-expanded={menu}>
            <IconeMenu size={22} />
          </button>
          <img src="logo.png" alt="Vincol" />
          <span className="sis-chip" style={{ background: s.cor }}>
            {s.nome}
          </span>
        </header>

        <main id="conteudo" tabIndex={-1}>
          {f.pagina === "geral" ? (
            <VisaoGeral key={sisId} s={s} todos={todos} gerado={dados.gerado} historico={base.historico[sisId] ?? []} f={f} mudar={mudar} onCliente={setCliente} />
          ) : f.pagina === "titulos" ? (
            <Titulos key={sisId} s={s} todos={todos} gerado={dados.gerado} f={f} mudar={mudar} onCliente={setCliente} cor={cor} />
          ) : (
            <Classificar
              key={sisId}
              s={s}
              todos={todos}
              gerado={dados.gerado}
              f={f}
              mudar={mudar}
              cor={cor}
              definir={definir}
              pendentes={Object.keys(locais).length}
              onBaixar={baixarClassificacoes}
              onDescartar={descartar}
              onCliente={setCliente}
            />
          )}
        </main>
      </div>

      <Impressao s={s} todos={todos} gerado={dados.gerado} f={f} />
      {cliente && <FichaCliente titulos={todos.filter((t) => t.cod === cliente)} cor={cor(cliente)} onCor={(c) => definir(cliente, c)} onFechar={fecharFicha} />}
    </div>
  );
}
