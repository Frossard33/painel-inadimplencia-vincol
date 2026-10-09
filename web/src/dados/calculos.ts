import type { DadosBrutos, Titulo } from "./tipos";
import type { Sistema } from "./sistemas";

/** Único tipo que é boleto (Cobrança Administrativa). */
export const BOLETO = "Boletos";
/** Judicial e Dívida Antiga ficam fora do "A receber" (recuperação mais difícil). */
export const DEMORADOS = ["Judicial", "Dívida Antiga"];
const DIA = 86_400_000;

export function dataRef(gerado: string): Date {
  return new Date(gerado + "T00:00:00");
}

export function isoDe(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Converte as linhas da planilha. Lançamentos a pagar (contas a pagar) ficam de fora do painel. */
export function preparar(d: DadosBrutos, s: Sistema): Titulo[] {
  const ref = dataRef(d.gerado).getTime();
  const aceitos = new Set([...s.inad, ...s.pend]);
  return [...d.titulos, ...(d.pend ?? [])]
    .filter((t) => aceitos.has(t.c) && t.d !== "PAGAR")
    .map((t) => {
      const pago = Boolean(t.pg) || Boolean(t.pago);
      const venc = t.v ? new Date(t.v + "T00:00:00").getTime() : ref;
      return {
        filial: t.f,
        tipo: t.c,
        titulo: String(t.tit ?? ""),
        parcela: t.par == null ? "" : String(t.par),
        cod: String(t.cod),
        cliente: t.cli || "—",
        vencimento: t.v ?? null,
        valor: t.val || 0,
        aberto: pago ? 0 : t.sal || 0,
        recebido: pago ? t.vp || 0 : 0,
        pago,
        pagoEm: t.pg ?? null,
        dias: Math.floor((ref - venc) / DIA),
      };
    });
}

/* Idade da dívida e chance de pagar (decisão da diretoria em 09/10/2026) */
export const FAIXAS = [
  { id: "avencer", nome: "A vencer", chance: 0.95 },
  { id: "1-30", nome: "1 a 30 dias", chance: 0.75 },
  { id: "31-60", nome: "31 a 60 dias", chance: 0.4 },
  { id: "61-90", nome: "61 a 90 dias", chance: 0.4 },
  { id: "90+", nome: "Mais de 90 dias", chance: 0.1 },
] as const;

export function faixa(dias: number): number {
  return dias <= 0 ? 0 : dias <= 30 ? 1 : dias <= 60 ? 2 : dias <= 90 ? 3 : 4;
}
export const chance = (dias: number) => FAIXAS[faixa(dias)].chance;
export const ehReceber = (t: Titulo) => !DEMORADOS.includes(t.tipo);
export const naoPago = (t: Titulo) => !t.pago;

export function soma(ts: Titulo[], k: "aberto" | "recebido" | "valor" = "aberto"): number {
  let s = 0;
  for (const t of ts) s += t[k];
  return s;
}

export interface Indicadores {
  receber: number;
  nTitulos: number;
  nClientes: number;
  previsto30: number;
  vencido90: number;
  demorados: number;
  nDemorados: number;
}

export function indicadores(ts: Titulo[]): Indicadores {
  const rec = ts.filter((t) => ehReceber(t) && naoPago(t));
  const dem = ts.filter((t) => !ehReceber(t) && naoPago(t));
  return {
    receber: soma(rec),
    nTitulos: rec.length,
    nClientes: new Set(rec.map((t) => t.cod)).size,
    // vencidos (pela chance da idade) + o que vence nos próximos 30 dias (95%)
    previsto30: rec.filter((t) => t.dias > -30).reduce((a, t) => a + t.aberto * chance(t.dias), 0),
    vencido90: soma(rec.filter((t) => t.dias > 90)),
    demorados: soma(dem),
    nDemorados: dem.length,
  };
}

/** Recebido nos 7 dias até a data da posição (títulos com data de pagamento). */
export function recebidoSemana(ts: Titulo[], gerado: string): { valor: number; n: number } {
  const ini = dataRef(gerado);
  ini.setDate(ini.getDate() - 6);
  const de = isoDe(ini);
  const pagos = ts.filter((t) => t.pago && t.pagoEm && t.pagoEm >= de && t.pagoEm <= gerado);
  return { valor: soma(pagos, "recebido"), n: pagos.length };
}

export interface ColunaPrevisao {
  id: string;
  rotulo: string;
  dica: string;
  esperado: number;
  nominal: number;
  vencidos?: boolean;
}

/** Previsão de entrada: vencidos em cobrança (ponderados pela idade) + próximas semanas pelo vencimento. */
export function previsaoSemanal(ts: Titulo[], gerado: string, semanas = 8): ColunaPrevisao[] {
  const rec = ts.filter((t) => ehReceber(t) && naoPago(t));
  const venc = rec.filter((t) => t.dias > 0);
  const cols: ColunaPrevisao[] = [
    {
      id: "vencidos",
      rotulo: "Vencidos",
      dica: "Títulos já vencidos, com chance de pagar pela idade",
      esperado: venc.reduce((a, t) => a + t.aberto * chance(t.dias), 0),
      nominal: soma(venc),
      vencidos: true,
    },
  ];
  const ref = dataRef(gerado);
  for (let i = 0; i < semanas; i++) {
    const ini = new Date(ref);
    ini.setDate(ini.getDate() + 7 * i);
    const fim = new Date(ini);
    fim.setDate(fim.getDate() + 6);
    const daSemana = rec.filter((t) => t.dias <= 0 && Math.floor(-t.dias / 7) === i);
    const nominal = soma(daSemana);
    cols.push({
      id: "s" + i,
      rotulo: ini.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      dica: "Vence de " + ini.toLocaleDateString("pt-BR") + " a " + fim.toLocaleDateString("pt-BR"),
      esperado: nominal * FAIXAS[0].chance,
      nominal,
    });
  }
  return cols;
}

export interface Item {
  id: string;
  rotulo: string;
  valor: number;
  n: number;
}

/** Soma do "A receber" agrupado por uma chave, do maior para o menor. */
export function agrupar(ts: Titulo[], chave: (t: Titulo) => string, rotulo: (k: string) => string = (k) => k): Item[] {
  const m = new Map<string, Item>();
  for (const t of ts) {
    if (!ehReceber(t) || t.pago) continue;
    const k = chave(t);
    const it = m.get(k) ?? { id: k, rotulo: rotulo(k), valor: 0, n: 0 };
    it.valor += t.aberto;
    it.n += 1;
    m.set(k, it);
  }
  return [...m.values()].filter((i) => i.valor > 0).sort((a, b) => b.valor - a.valor);
}

export interface Devedor {
  cod: string;
  cliente: string;
  valor: number;
  maiorAtraso: number;
}

export function devedores(ts: Titulo[]): Devedor[] {
  const m = new Map<string, Devedor>();
  for (const t of ts) {
    if (t.pago) continue;
    const d = m.get(t.cod) ?? { cod: t.cod, cliente: t.cliente, valor: 0, maiorAtraso: -Infinity };
    d.valor += t.aberto;
    d.maiorAtraso = Math.max(d.maiorAtraso, t.dias);
    m.set(t.cod, d);
  }
  return [...m.values()].sort((a, b) => b.valor - a.valor);
}
