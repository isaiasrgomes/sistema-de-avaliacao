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

  return <Toaster richColors position={isMobile ? "bottom-center" : "top-center"} />;
}
