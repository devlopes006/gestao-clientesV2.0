"use client";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";
import React, { Suspense } from "react";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Defensive check: ensure children is valid
  if (!children) return null;

  // While loading, render children to avoid layout flicker
  if (loading) {
    return (
      <Suspense fallback={null}>
        {children}
      </Suspense>
    );
  }

  // If not authenticated, render children normally (no sidebar)
  // Also hide sidebar explicitly on the login page
  if (!user || pathname === "/login") {
    return (
      <Suspense fallback={null}>
        {children}
      </Suspense>
    );
  }

  // Authenticated: render with global bottom dock (no sidebar)
  return (
    <div className="min-h-screen flex flex-col relative pb-20 sm:pb-0">
      <main className="flex-1">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
      {/* Global Bottom Navigation (Dock) */}
      <MobileBottomNav />
    </div>
  );
}
