import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PortalCardProps = {
  href?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  buttonLabel?: string;
  featured?: boolean;
  disabled?: boolean;
};

export function PortalCard({
  href,
  title,
  description,
  icon: Icon,
  buttonLabel = "Acessar",
  featured = false,
  disabled = false,
}: PortalCardProps) {
  const content = (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/60 bg-card p-6 shadow-card transition-shadow duration-300",
        featured && "sm:p-8",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-primary/35 hover:shadow-card-hover"
      )}
      aria-disabled={disabled || undefined}
    >
      <div
        className={cn(
          "mb-5 inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors",
          !disabled && "group-hover:bg-primary/15",
          featured ? "h-12 w-12" : "h-11 w-11"
        )}
      >
        <Icon className={featured ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
      </div>
      <h2 className={cn("font-semibold tracking-tight text-foreground", featured ? "text-xl" : "text-lg")}>
        {title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span
        className={cn(
          buttonVariants({ variant: disabled ? "secondary" : "default", size: "default" }),
          "mt-6 inline-flex h-10 w-full gap-2 sm:w-auto",
          disabled && "pointer-events-none"
        )}
      >
        {buttonLabel}
        {!disabled ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        ) : null}
      </span>
    </article>
  );

  if (disabled || !href) {
    return <div className="block h-full">{content}</div>;
  }

  return (
    <Link href={href} className="group block h-full">
      {content}
    </Link>
  );
}
