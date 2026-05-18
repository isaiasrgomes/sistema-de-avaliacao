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
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { toast } from "sonner";

const items = [
  { href: "/admin", label: "Monitoramento", icon: LayoutDashboard },
  { href: "/admin/projetos", label: "Projetos", icon: LineChart },
  { href: "/admin/importar", label: "Inscrições", icon: Upload },
  { href: "/admin/avaliadores", label: "Avaliadores", icon: Users },
  { href: "/admin/programas", label: "Programas", icon: CalendarRange },
  { href: "/admin/programa", label: "Config. do programa", icon: Settings2 },
  { href: "/admin/atribuicoes", label: "Atribuições", icon: Link2 },
  { href: "/admin/ranking", label: "Ranking", icon: Trophy },
  { href: "/admin/recursos", label: "Recursos", icon: Scale },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileText },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

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

  const sidebarContent = (
    <>
      <div className="border-b border-border/60 p-4">
        <Link
          href="/admin"
          prefetch
          className="flex w-full items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SertaoMakerBrand variant="compact" />
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coordenação</p>
        <p className="mt-1 truncate text-sm text-foreground">{displayName || "Usuário"}</p>
      </div>
      <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      <div className="mt-auto border-t border-border/60 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/admin" prefetch className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <SertaoMakerBrand variant="compact" />
        </Link>
        <Button variant="outline" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menu">
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-border/60 bg-card shadow-card transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end p-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-card md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
