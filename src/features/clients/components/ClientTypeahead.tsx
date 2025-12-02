"use client"
import { useEffect, useMemo, useRef, useState } from "react";

type ClientItem = { id: string; name: string }

export function ClientTypeahead({
  name = "clientId",
  placeholder = "Cliente (opcional)",
  defaultValue,
}: {
  name?: string;
  placeholder?: string;
  defaultValue?: { id: string; name: string } | null;
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ClientItem[]>([])
  const [selected, setSelected] = useState<ClientItem | null>(
    defaultValue || null
  )
  const abortRef = useRef<AbortController | null>(null)

  const search = useMemo(
    () =>
      async (q: string) => {
        if (abortRef.current) abortRef.current.abort()
        const ac = new AbortController()
        abortRef.current = ac
        setLoading(true)
        try {
          const url = new URL("/api/clients/search", window.location.origin)
          url.searchParams.set("q", q)
          url.searchParams.set("take", "20")
          const res = await fetch(url.toString(), { signal: ac.signal })
          if (!res.ok) throw new Error("Falha na busca")
          const data: ClientItem[] = await res.json()
          setItems(data)
        } catch (e) {
          if ((e as unknown as { name?: string })?.name !== "AbortError") {
            setItems([])
          }
        } finally {
          setLoading(false)
        }
      },
    []
  )

  // Debounce query
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    // Só faz busca se tiver pelo menos 1 caractere
    if (!q) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      search(q);
    }, 300);
    return () => clearTimeout(t);
  }, [open, query, search]);

  return (
    <div style={{ position: "relative" }}>
      {/* Hidden input que envia o ID */}
      <input
        type="hidden"
        name={name}
        value={selected?.id || ""}
      />
      {/* Input visível para busca */}
      <input
        placeholder={placeholder}
        value={selected ? selected.name : query}
        onChange={e => {
          setQuery(e.target.value);
          setSelected(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg z-50">
          {loading ? (
            <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">{query.trim() ? "Nenhum cliente encontrado" : "Digite para buscar..."}</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                style={{ background: selected?.id === item.id ? "var(--accent)" : "transparent" }}
                onMouseDown={() => {
                  setSelected(item);
                  setQuery(item.name);
                  setOpen(false);
                }}
              >
                {item.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
