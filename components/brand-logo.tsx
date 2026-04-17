"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "full" | "compact";
  align?: "start" | "center";
  layout?: "stacked" | "sideBySide";
};

export function SertaoMakerBrand({ className, variant = "full", align = "start", layout = "stacked" }: LogoProps) {
  const compact = variant === "compact";
  const src = layout === "sideBySide" ? "/logos-lado-a-lado.svg" : "/logos-em-cima.svg";
  const alt = layout === "sideBySide" ? "Logos lado a lado" : "Logos em cima";

  return (
    <div
      className={cn(
        "flex",
        compact ? "flex-col items-start" : "items-center",
        align === "center" && "justify-center",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={compact ? 170 : 340}
        height={compact ? 85 : 170}
        sizes={compact ? "170px" : "(max-width: 768px) 240px, 340px"}
        className={cn(
          "h-auto w-auto object-contain",
          compact ? "max-w-[170px] sm:max-w-[190px]" : "max-w-[240px] sm:max-w-[300px] md:max-w-[340px]"
        )}
        priority
      />
    </div>
  );
}
