const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCurto = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const inteiro = new Intl.NumberFormat("pt-BR");
const porcento = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

/** Valor completo: R$ 216.432,90 */
export const R = (n: number) => brl.format(n || 0);
/** Valor resumido para gráficos: R$ 216,4 mil */
export const Rc = (n: number) => brlCurto.format(n || 0);
export const N = (n: number) => inteiro.format(n || 0);
export const P = (n: number) => porcento.format(isFinite(n) ? n : 0);

export function dataBR(iso: string | null | undefined): string {
  return iso ? iso.split("-").reverse().join("/") : "—";
}

export function diasTxt(d: number): string {
  if (d <= 0) return d === 0 ? "vence hoje" : "vence em " + -d + (d === -1 ? " dia" : " dias");
  if (d >= 365) return Math.floor(d / 365) + " ano(s) e " + (d % 365) + " dias";
  return d + (d === 1 ? " dia" : " dias");
}
