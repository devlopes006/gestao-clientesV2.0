"use client"

import styles from "@/app/login/login.module.css";
import React from "react";

type Props = {
  icon: React.ComponentType<any>;
  title: string;
  description?: string;
};

export default function FeatureCard({ icon: Icon, title, description }: Props) {
  return (
    <div className={`${styles.featureCard} text-sm`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-[var(--c-peach)]" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-[var(--c-deep)]">{title}</div>
          {description && <div className="text-xs text-[rgba(36,67,71,0.5)]">{description}</div>}
        </div>
      </div>
    </div>
  );
}
