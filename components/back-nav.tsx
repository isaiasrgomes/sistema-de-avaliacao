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
  primaryLabel: string;
  className?: string;
}) {
  const pathname = usePathname();
  const normalized = (pathname.replace(/\/$/, "") || "/") as string;
  const root = sectionRoot;
  const isRoot = normalized === root;

  if (isRoot) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" asChild>
        <Link href={root}>
          <ArrowLeft className="h-4 w-4" />
          {primaryLabel}
        </Link>
      </Button>
    </div>
  );
}
