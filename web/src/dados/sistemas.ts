import type { SistemaId } from "./tipos";

export interface Filial {
  id: string;
  nome: string;
}

export interface Sistema {
  id: SistemaId;
  nome: string;
  /** Cor de identificação do sistema (faixa, botão ativo). */
  cor: string;
  /** Chave no localStorage das classificações feitas neste navegador. */
  chaveLocal: string;
  /** Nome da variável no ratings.js. */
  variavel: string;
  semFilial: boolean;
  filiais: Filial[];
  /** Tipos de título da inadimplência. */
  inad: string[];
  /** Demais abas da planilha (pendência). Contas a pagar não entra no painel. */
  pend: string[];
}

export const SISTEMAS: Record<SistemaId, Sistema> = {
  tecinco: {
    id: "tecinco",
    nome: "Tecinco",
    cor: "#14B8A6",
    chaveLocal: "vincol_classificacoes_v1",
    variavel: "CLASSIFICACOES",
    semFilial: false,
    filiais: [
      { id: "01", nome: "Três Poços" },
      { id: "02", nome: "Ponte Alta" },
      { id: "03", nome: "Barra Mansa" },
      { id: "04", nome: "Beira Rio" },
      { id: "06", nome: "Resende" },
      { id: "OUT", nome: "Outras (05 e 08)" },
    ],
    inad: ["Boletos", "Judicial", "Cobrança Extrajudicial", "Dívida Antiga", "Órgão Público", "Depósito"],
    pend: ["Frota", "Auditoria", "Tesouraria", "Permuta", "Pneustore", "Conciliação Vanessa", "Conciliação Marla", "Pendências Diversas", "Mercado Livre Koncilli", "Mercado Livre Conta"],
  },
  junsoft: {
    id: "junsoft",
    nome: "Junsoft",
    cor: "#60A5FA",
    chaveLocal: "vincol_classificacoes_junsoft_v1",
    variavel: "CLASSIFICACOES_JUNSOFT",
    semFilial: true,
    filiais: [{ id: "01", nome: "Recauchutadora Vincol" }],
    inad: ["Boletos", "Judicial", "Cobrança Extrajudicial", "Dívida Antiga"],
    pend: ["Clientes em Carteira", "Depósito", "Diversos", "Borrachas Vipal"],
  },
};

export function nomeFilial(s: Sistema, id: string): string {
  return s.filiais.find((f) => f.id === id)?.nome ?? id;
}
