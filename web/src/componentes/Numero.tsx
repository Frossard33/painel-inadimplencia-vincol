import { useEffect, useRef, useState } from "react";
import { movimentoReduzido } from "../estado";

/** Número que conta até o valor quando muda (sem animação se o aparelho pede menos movimento). */
export function Numero({ valor, formato }: { valor: number; formato: (n: number) => string }) {
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(0);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = valor;
    if (movimentoReduzido() || de === valor) {
      setMostrado(valor);
      return;
    }
    let quadro = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / 650);
      setMostrado(de + (valor - de) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor]);

  return <span className="num-anim">{formato(mostrado)}</span>;
}
