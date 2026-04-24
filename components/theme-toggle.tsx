"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const order: Array<"light" | "dark"> = ["light", "dark"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const current = theme === "light" ? "light" : "dark";
  const next = order[(order.indexOf(current) + 1) % order.length];
  const label = current === "light" ? "Tema claro" : "Tema escuro";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(next)}
      title={`${label} (clique para alternar)`}
      aria-label={`${label} (clique para alternar)`}
      className="rounded-full border-border/70 bg-card/90 shadow-sm backdrop-blur"
    >
      {current === "light" && <Sun className="h-4 w-4" />}
      {current === "dark" && <Moon className="h-4 w-4" />}
    </Button>
  );
}
