import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Devedor } from "../dados/calculos";
import { R } from "../dados/formato";

/** Busca global de clientes: digitar o nome ou o código e abrir a ficha. */
export function Busca({ clientes, onAbrir }: { clientes: Devedor[]; onAbrir: (cod: string) => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [foco, setFoco] = useState(false);
  const id = useId();

  const achados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return clientes.filter((c) => (c.cliente + " " + c.cod).toLowerCase().includes(t)).slice(0, 8);
  }, [q, clientes]);

  const abrir = (cod: string) => {
    onAbrir(cod);
    setQ("");
  };
  const lista = foco && achados.length > 0;

  return (
    <div className="busca">
      <Search size={16} className="busca-ico" aria-hidden="true" />
      <input
        type="search"
        role="combobox"
        aria-expanded={lista}
        aria-controls={id}
        aria-activedescendant={lista ? id + "-" + sel : undefined}
        aria-label="Buscar cliente por nome ou código"
        placeholder="Buscar cliente…"
        autoComplete="off"
        spellCheck={false}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
        }}
        onFocus={() => setFoco(true)}
        onBlur={() => setTimeout(() => setFoco(false), 150)}
        onKeyDown={(e) => {
          if (!achados.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSel((s) => (s + 1) % achados.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSel((s) => (s - 1 + achados.length) % achados.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            abrir(achados[sel].cod);
          } else if (e.key === "Escape") setQ("");
        }}
      />
      {lista && (
        <ul className="busca-lista" id={id} role="listbox">
          {achados.map((c, i) => (
            <li key={c.cod} id={id + "-" + i} role="option" aria-selected={i === sel} className={i === sel ? "sel" : ""} onMouseDown={() => abrir(c.cod)}>
              <span>
                {c.cliente}
                <small>Cód. {c.cod}</small>
              </span>
              <b>{R(c.valor)}</b>
            </li>
          ))}
        </ul>
      )}
      {foco && q.trim().length >= 2 && !achados.length && <div className="busca-lista vazio">Nenhum cliente encontrado.</div>}
    </div>
  );
}
