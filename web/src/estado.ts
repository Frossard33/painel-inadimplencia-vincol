import { useCallback, useEffect, useState } from "react";
import type { Cor, SistemaId } from "./dados/tipos";

export type Pagina = "geral" | "titulos" | "classificar";

export interface Filtros {
  pagina: Pagina;
  sis: SistemaId;
  filial: string; // "" = todas
  tipo: string; // "" = todos
  st: Situacao;
}

/** Filtro rápido da lista de títulos. */
export type Situacao = "" | "abertos" | "vencidos" | "pagos";

const PADRAO: Filtros = { pagina: "geral", sis: "tecinco", filial: "", tipo: "", st: "" };

/* Estado na URL (#/geral?sis=junsoft&filial=02&tipo=Boletos): o link pode ser compartilhado */
function ler(): Filtros {
  const [caminho, busca = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const q = new URLSearchParams(busca);
  const pagina = (["geral", "titulos", "classificar"] as const).find((p) => p === caminho) ?? "geral";
  const sis = q.get("sis") === "junsoft" ? "junsoft" : "tecinco";
  const st = (["abertos", "vencidos", "pagos"] as const).find((x) => x === q.get("st")) ?? "";
  return { pagina, sis, filial: q.get("filial") ?? "", tipo: q.get("tipo") ?? "", st };
}

function escrever(f: Filtros) {
  const q = new URLSearchParams();
  if (f.sis !== PADRAO.sis) q.set("sis", f.sis);
  if (f.filial) q.set("filial", f.filial);
  if (f.tipo) q.set("tipo", f.tipo);
  if (f.st && f.pagina === "titulos") q.set("st", f.st);
  const s = q.toString();
  history.replaceState(null, "", "#/" + f.pagina + (s ? "?" + s : ""));
}

export function useFiltros(): [Filtros, (mudar: Partial<Filtros>) => void] {
  const [f, setF] = useState<Filtros>(ler);
  useEffect(() => {
    const aoMudar = () => setF(ler());
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  const mudar = useCallback((m: Partial<Filtros>) => {
    setF((atual) => {
      const novo = { ...atual, ...m };
      // trocar de sistema limpa os filtros, que não valem no outro
      if (m.sis && m.sis !== atual.sis) Object.assign(novo, { filial: "", tipo: "", st: "" });
      escrever(novo);
      return novo;
    });
  }, []);
  return [f, mudar];
}

/* Classificação dos clientes: a publicada (ratings.js) com as alterações feitas neste navegador por cima.
   Mesma chave do painel anterior, então as classificações já feitas continuam valendo. */
export function useClassificacoes(chaveLocal: string, publicadas: Record<string, Cor>) {
  const lerLocais = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveLocal) || "{}") as Record<string, string>;
    } catch {
      return {};
    }
  };
  const [locais, setLocais] = useState<Record<string, string>>(lerLocais);
  useEffect(() => setLocais(lerLocais()), [chaveLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  const cor = useCallback(
    (cod: string): Cor => {
      if (Object.prototype.hasOwnProperty.call(locais, cod)) return (locais[cod] as Cor) || "nenhum";
      return publicadas[cod] ?? "nenhum";
    },
    [locais, publicadas],
  );

  const definir = useCallback(
    (cod: string, c: Cor) => {
      setLocais((atual) => {
        const novo = { ...atual };
        const base = publicadas[cod] ?? "nenhum";
        if (c === base) delete novo[cod];
        else novo[cod] = c === "nenhum" ? "" : c;
        try {
          localStorage.setItem(chaveLocal, JSON.stringify(novo));
        } catch {
          /* navegador sem armazenamento: vale só nesta visita */
        }
        return novo;
      });
    },
    [chaveLocal, publicadas],
  );

  const descartar = useCallback(() => {
    setLocais({});
    try {
      localStorage.removeItem(chaveLocal);
    } catch {
      /* sem armazenamento */
    }
  }, [chaveLocal]);

  return { cor, definir, locais, descartar };
}

export function movimentoReduzido(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Classificações publicadas + alterações locais de um sistema (para gerar o ratings.js com os dois sistemas). */
export function classificacoesFinais(chaveLocal: string, publicadas: Record<string, Cor>): Record<string, Cor> {
  const o: Record<string, Cor> = { ...publicadas };
  let loc: Record<string, string> = {};
  try {
    loc = JSON.parse(localStorage.getItem(chaveLocal) || "{}");
  } catch {
    loc = {};
  }
  for (const [k, v] of Object.entries(loc)) {
    if (v) o[k] = v as Cor;
    else delete o[k];
  }
  return o;
}
