"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Ícone do sistema: barras de avaliação + sol (Sertão) — usado no favicon e no logo. */
export function LogoMark({ className, "aria-hidden": ariaHidden = true }: { className?: string; "aria-hidden"?: boolean }) {
  const gid = useId().replace(/:/g, "");
  const gradId = `brand-grad-${gid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden={ariaHidden}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradId})`} />
      <path d="M8 22h4v4H8v-4zm6-6h4v10h-4V16zm6-8h4v18h-4V8z" fill="#ffffff" opacity={0.92} />
      <circle cx="24" cy="7" r="2.5" fill="#fde68a" opacity={0.95} />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  variant?: "full" | "compact";
  /** Alinha o texto da marca ao centro (ex.: página inicial). */
  align?: "start" | "center";
};

/**
 * Marca textual: Sistema de Avaliação — Sertão Maker.
 * O ícone repete o favicon para consistência visual.
 */
export function SertaoMakerBrand({ className, variant = "full", align = "start" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className={cn(variant === "compact" ? "h-8 w-8" : "h-10 w-10 sm:h-12 sm:w-12")} aria-hidden />
      <div className={cn("min-w-0 leading-tight", align === "center" ? "text-center" : "text-left")}>
        <p
          className={cn(
            "truncate font-semibold uppercase tracking-[0.12em] text-muted-foreground",
            variant === "compact" ? "text-[0.6rem]" : "text-[0.65rem] sm:text-xs"
          )}
        >
          Sistema de Avaliação
        </p>
        <p className={cn("truncate font-semibold tracking-tight text-foreground", variant === "compact" ? "text-sm" : "text-base sm:text-lg")}>
          Sertão Maker
        </p>
        {variant === "full" && <p className="hidden text-xs text-muted-foreground sm:block">Edital 45/2026</p>}
      </div>
    </div>
  );
}
