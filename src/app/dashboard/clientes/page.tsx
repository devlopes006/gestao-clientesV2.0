"use client";

export default function ClientesPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Clientes</h1>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Em breve: lista de clientes com busca e filtros.
      </p>
      <section style={{ marginTop: 24 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <div
            style={{
              minHeight: 200,
              display: "grid",
              placeItems: "center",
              color: "#9ca3af",
            }}
          >
            Tabela de clientes (placeholder)
          </div>
        </div>
      </section>
    </main>
  );
}
