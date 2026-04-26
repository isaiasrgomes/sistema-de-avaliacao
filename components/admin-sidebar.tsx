"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  Users,
  Link2,
  LineChart,
  Trophy,
  FileText,
  Scale,
  LogOut,
  CalendarRange,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { toast } from "sonner";

const items = [
  { href: "/admin", label: "Monitoramento", icon: LayoutDashboard },
  { href: "/admin/projetos", label: "Projetos", icon: LineChart },
  { href: "/admin/importar", label: "Inscrições", icon: Upload },
  { href: "/admin/avaliadores", label: "Avaliadores", icon: Users },
  { href: "/admin/programa", label: "Programa", icon: CalendarRange },
  { href: "/admin/atribuicoes", label: "Atribuições", icon: Link2 },
  { href: "/admin/ranking", label: "Ranking", icon: Trophy },
  { href: "/admin/recursos", label: "Recursos", icon: Scale },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileText },
];

export function AdminSidebar({ displayName }: { displayName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    toast.message("Fazendo logout...");
    const res = await fetch("/auth/signout?next=/", { method: "POST" });
    const to = res.redirected ? res.url : "/";
    router.push(to);
    router.refresh();
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/70 bg-card/95 px-3 py-2 backdrop-blur md:hidden">
        <Link
          href="/admin"
          prefetch
          className="inline-flex items-center rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SertaoMakerBrand variant="compact" />
        </Link>
        <Button variant="outline" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menu">
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {mobileOpen && (
        <button className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-border/70 bg-card/95 backdrop-blur-xl transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 p-4">
          <Link
            href="/admin"
            prefetch
            className="inline-flex items-center rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SertaoMakerBrand variant="compact" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="px-4 pt-3 text-xs font-medium text-muted-foreground">Painel de Coordenação</p>
        <nav className="flex-1 space-y-1.5 p-3">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground/85 transition-all hover:bg-primary/10 hover:text-primary",
                pathname === href && "bg-primary/15 font-medium text-primary shadow-sm"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sticky bottom-0 border-t border-border/70 bg-card/95 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-lg text-foreground/80 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <aside className="sticky top-0 hidden h-screen w-64 flex-col overflow-y-auto border-r border-border/70 bg-card/85 backdrop-blur-xl md:flex">
        <div className="border-b border-border/70 p-4">
          <Link
            href="/admin"
            prefetch
            className="flex w-full items-center justify-center rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SertaoMakerBrand variant="compact" />
          </Link>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Painel de Coordenação</p>
          <p className="mt-1 truncate text-xs text-foreground/80">Bem-vindo, {displayName || "Usuário"}</p>
        </div>
        <nav className="flex-1 space-y-1.5 p-3">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground/85 transition-all hover:bg-primary/10 hover:text-primary",
                pathname === href && "bg-primary/15 font-medium text-primary shadow-sm"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sticky bottom-0 border-t border-border/70 bg-card/85 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-lg text-foreground/80 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}
