"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section = "/admin" | "/avaliador";

export function BackNav({
  sectionRoot,
  primaryLabel,
  className,
}: {
  sectionRoot: Section;
  /** Texto do atalho para a raiz da área (ex.: Monitoramento, Minhas avaliações). */
  primaryLabel: string;
  className?: string;
}) {
  const pathname = usePathname();
  const normalized = (pathname.replace(/\/$/, "") || "/") as string;
  const root = sectionRoot;
  const isRoot = normalized === root;

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2 border-b border-border/60 pb-3", className)}>
      {isRoot ? (
        <div />
      ) : (
        <>
          <Button variant="outline" size="sm" className="gap-1.5 border-border/80 bg-card/70" asChild>
            <Link href={root}>
              <ArrowLeft className="h-4 w-4" />
              {primaryLabel}
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
