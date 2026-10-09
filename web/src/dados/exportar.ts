/** Baixa um arquivo gerado no navegador. */
export function baixar(nome: string, conteudo: string, tipo: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

/** CSV no formato que o Excel brasileiro abre direto (ponto e vírgula, BOM UTF-8). */
export function csv(linhas: (string | number)[][]): string {
  const cel = (c: string | number) => '"' + String(c).replace(/"/g, '""') + '"';
  return "﻿" + linhas.map((l) => l.map(cel).join(";")).join("\r\n");
}

export const numeroExcel = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
