"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function AppToaster() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <Toaster
      richColors
      closeButton
      expand
      position={isMobile ? "bottom-center" : "top-right"}
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border/60 shadow-card",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
        },
      }}
    />
  );
}
