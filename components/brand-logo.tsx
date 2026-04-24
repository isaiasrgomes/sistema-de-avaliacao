"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "full" | "compact";
  align?: "start" | "center";
};

/** Marca única SerTão Inovador (`public/logo-sertao-inovador.svg`). */
export function SertaoMakerBrand({ className, variant = "full", align = "start" }: LogoProps) {
  const compact = variant === "compact";
  const src = "/logo-sertao-inovador.svg";

  return (
    <div
      className={cn(
        "inline-flex items-center",
        align === "center" && "justify-center",
        className
      )}
    >
      <div
        className={cn(
          "rounded-xl border border-border/60 bg-[hsl(var(--logo-surface))] shadow-sm",
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        )}
      >
        <Image
          src={src}
          alt="SerTão Inovador"
          width={compact ? 200 : 400}
          height={compact ? 40 : 79}
          sizes={compact ? "200px" : "(max-width: 768px) 280px, 400px"}
          className={cn(
            "h-auto w-auto object-contain",
            compact ? "max-w-[200px] sm:max-w-[220px]" : "max-w-[280px] sm:max-w-[340px] md:max-w-[400px]"
          )}
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
