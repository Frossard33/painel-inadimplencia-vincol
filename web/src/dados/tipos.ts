/** Linha como vem da planilha (gerada por tools/build_data.py e tools/build_junsoft.py). */
export interface TituloBruto {
  f: string;
  c: string;
  d?: string | null;
  tit: string | number;
  par?: string | number | null;
  cod: string;
  cli: string;
  v: string | null;
  val: number;
  sal: number;
  pg?: string | null;
  vp?: number;
  pago?: number;
}

export interface DadosBrutos {
  gerado: string;
  titulos: TituloBruto[];
  pend?: TituloBruto[];
  pagar?: TituloBruto[];
}

/** Título já preparado para o painel. */
export interface Titulo {
  filial: string;
  tipo: string;
  titulo: string;
  parcela: string;
  cod: string;
  cliente: string;
  vencimento: string | null;
  valor: number;
  aberto: number;
  recebido: number;
  pago: boolean;
  pagoEm: string | null;
  /** Dias desde o vencimento (0 ou negativo = a vencer). */
  dias: number;
}

export type Cor = "verde" | "amarelo" | "vermelho" | "nenhum";

export interface PosicaoHistorico {
  data: string;
  total: Record<string, number>;
  filiais?: Record<string, Record<string, number>>;
}

export type SistemaId = "tecinco" | "junsoft";

export interface Base {
  dados: Record<SistemaId, DadosBrutos | undefined>;
  historico: Partial<Record<SistemaId, PosicaoHistorico[]>>;
  classificacoes: Record<SistemaId, Record<string, Cor>>;
}
