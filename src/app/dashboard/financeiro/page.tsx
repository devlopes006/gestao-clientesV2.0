"use client";

export default function FinanceiroPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Financeiro</h1>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Em breve: gráficos de receita, despesa e saldo.
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
              height: 280,
              display: "grid",
              placeItems: "center",
              color: "#9ca3af",
            }}
          >
            Placeholder de gráfico financeiro
          </div>
        </div>
      </section>
    </main>
  );
}
