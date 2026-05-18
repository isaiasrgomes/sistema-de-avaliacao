import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LandingLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-accent/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <main
        className={cn(
          "relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6 sm:py-14",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
