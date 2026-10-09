import type { Base, Cor, DadosBrutos, PosicaoHistorico, SistemaId } from "./tipos";

/* Fonte dos dados. Hoje: arquivos gerados a partir das planilhas (window.DADOS etc.).
   Quando o sistema tiver API, troque só esta função por chamadas fetch() e mantenha o formato de Base. */

type Janela = Window & {
  DADOS?: DadosBrutos;
  DADOS_JUNSOFT?: DadosBrutos;
  HISTORICO?: Partial<Record<SistemaId, PosicaoHistorico[]>>;
  CLASSIFICACOES?: Record<string, Cor>;
  CLASSIFICACOES_JUNSOFT?: Record<string, Cor>;
};

function script(src: string): Promise<void> {
  return new Promise((ok, falha) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => ok();
    el.onerror = () => falha(new Error("Não foi possível carregar " + src));
    document.head.appendChild(el);
  });
}

export async function carregarBase(): Promise<Base> {
  const versao = Date.now();
  const arquivos = ["data.js", "data-junsoft.js", "historico.js", "ratings.js"];
  const res = await Promise.allSettled(arquivos.map((f) => script("dados/" + f + "?v=" + versao)));
  const w = window as Janela;
  if (!w.DADOS && !w.DADOS_JUNSOFT) {
    const motivo = res.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
    throw motivo?.reason ?? new Error("Sem dados");
  }
  return {
    dados: { tecinco: w.DADOS, junsoft: w.DADOS_JUNSOFT },
    historico: w.HISTORICO ?? {},
    classificacoes: { tecinco: w.CLASSIFICACOES ?? {}, junsoft: w.CLASSIFICACOES_JUNSOFT ?? {} },
  };
}
