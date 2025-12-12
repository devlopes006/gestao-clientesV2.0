"use client"

import styles from "@/app/login/login.module.css";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import FeatureCard from "./FeatureCard";

export default function Hero() {
  const features = [
    { icon: CheckCircle2, title: "Clientes organizados" },
    { icon: Zap, title: "Fluxo ágil" },
    { icon: ShieldCheck, title: "Proteção de dados" },
  ];

  return (
    <section className="flex flex-col justify-center">
      <div className="mb-6">
        <div className={`inline-block ${styles.muted} ds-badge`}>Organização</div>
        <h1 className={`mt-4 text-4xl font-extrabold ${styles.heading}`}>Centralize clientes e processos com visão completa</h1>
        <p className={`mt-4 text-lg ${styles.muted}`}>Menos trabalho manual, mais controle — um painel único para clientes, tarefas e finanças.</p>
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        {features.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} />
        ))}
      </div>
    </section>
  );
}
