"use client"

import styles from "@/app/login/login.module.css";

export default function Illustration() {
  return (
    <div className={`hidden lg:flex items-center justify-center ${styles.illustration}`}>
      <svg className={`${styles.illustrationSvg} lux-ill-svg`} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0" stopColor="#D4AF37" />
            <stop offset="1" stopColor="#F6E7C2" />
          </linearGradient>
          <linearGradient id="g2" x1="0" x2="1">
            <stop offset="0" stopColor="#FFF9F0" />
            <stop offset="1" stopColor="#0FA678" />
          </linearGradient>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="lux-ill" filter="url(#softBlur)">
          <circle cx="60" cy="60" r="48" fill="url(#g1)" opacity="0.98" />
          <rect x="120" y="100" width="88" height="88" rx="18" fill="url(#g2)" opacity="0.95" />
          <path d="M30 200 C80 150, 160 230, 210 180" stroke="#D4AF37" strokeWidth="7" strokeLinecap="round" opacity="0.9" fill="none" />
        </g>

        <g className="lux-ill-halo" opacity="0.22">
          <ellipse cx="130" cy="60" rx="48" ry="28" fill="#D4AF37" />
        </g>
      </svg>
    </div>
  );
}
