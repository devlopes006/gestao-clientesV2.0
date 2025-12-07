"use client";

import { SidebarV3 } from "@/components/layout/SidebarV3";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar() {
  const { isOpen, close } = useSidebar();

  // Safety wrapper: only close the sidebar automatically on small viewports
  // (mobile/tablet). On desktop (>= lg / 1024px) we keep the sidebar visible
  // across navigations so it doesn't disappear when routing between pages.
  const handleClose = () => {
    if (typeof window === "undefined") return;
    // Match the Tailwind 'lg' breakpoint used across the app (1024px)
    if (window.innerWidth < 1024) {
      close();
    }
  };

  return <SidebarV3 isOpen={isOpen} onClose={handleClose} />;
}

export default AppSidebar;
