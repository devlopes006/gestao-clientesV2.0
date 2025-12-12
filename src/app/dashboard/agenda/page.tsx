"use client";

export default function AgendaPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Agenda</h1>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Em breve: calendário mensal e eventos.
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
              minHeight: 240,
              display: "grid",
              placeItems: "center",
              color: "#9ca3af",
            }}
          >
            Calendário e agenda (placeholder)
          </div>
        </div>
      </section>
    </main>
  );
}
