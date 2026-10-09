import type { ReactNode } from "react";
import { X } from "lucide-react";
import { nomeFilial, type Sistema } from "../dados/sistemas";
import { dataBR } from "../dados/formato";
import type { Filtros } from "../estado";

/** Topo escuro de cada página: título, etiqueta do sistema, data da posição e um espaço à direita (busca). */
export function Cabecalho({ titulo, s, gerado, subtitulo, direita }: { titulo: string; s: Sistema; gerado: string; subtitulo?: string; direita?: ReactNode }) {
  return (
    <header className="p-topo">
      <div>
        <h1>
          {titulo}{" "}
          <span className="sis-chip" style={{ background: s.cor }}>
            {s.nome}
          </span>
        </h1>
        <p>{subtitulo ?? "Posição em " + dataBR(gerado) + " · valores em reais"}</p>
      </div>
      {direita}
    </header>
  );
}

/** Filtros de filial e tipo de título, com as etiquetas dos filtros ativos. */
export function BarraFiltros({ s, f, mudar, comTipo = true, extra }: { s: Sistema; f: Filtros; mudar: (m: Partial<Filtros>) => void; comTipo?: boolean; extra?: ReactNode }) {
  const temFiltro = Boolean(f.filial || (comTipo && f.tipo));
  return (
    <div className="filtros" role="group" aria-label="Filtros">
      {!s.semFilial && (
        <label className="sel">
          <span>Filial</span>
          <select value={f.filial} onChange={(e) => mudar({ filial: e.target.value })}>
            <option value="">Todas as filiais</option>
            {s.filiais.map((fl) => (
              <option key={fl.id} value={fl.id}>
                {fl.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      {comTipo && (
        <label className="sel">
          <span>Tipo de título</span>
          <select value={f.tipo} onChange={(e) => mudar({ tipo: e.target.value })}>
            <option value="">Todos os tipos</option>
            <optgroup label="Inadimplência">
              {s.inad.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </optgroup>
            <optgroup label="Pendência">
              {s.pend.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </optgroup>
          </select>
        </label>
      )}
      {extra}
      {temFiltro && (
        <div className="ativos">
          {f.filial && (
            <button type="button" className="tag" onClick={() => mudar({ filial: "" })} aria-label={"Remover filtro da filial " + nomeFilial(s, f.filial)}>
              {nomeFilial(s, f.filial)} <X size={14} aria-hidden="true" />
            </button>
          )}
          {comTipo && f.tipo && (
            <button type="button" className="tag" onClick={() => mudar({ tipo: "" })} aria-label={"Remover filtro do tipo " + f.tipo}>
              {f.tipo} <X size={14} aria-hidden="true" />
            </button>
          )}
          <button type="button" className="limpar" onClick={() => mudar({ filial: "", tipo: "" })}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
