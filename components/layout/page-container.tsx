import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "full";
}) {
  const maxWidth =
    size === "full" ? "max-w-none" : size === "wide" ? "max-w-7xl" : "max-w-6xl";

  return <div className={cn("mx-auto w-full space-y-6 pb-2", maxWidth, className)}>{children}</div>;
}
