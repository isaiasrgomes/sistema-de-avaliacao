"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Upload, Users, Link2, LineChart, Trophy, FileText, Scale, LogOut, CalendarRange } from "lucide-react";
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

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-border/70 bg-card/85 backdrop-blur-xl">
      <div className="border-b border-border/70 p-4">
        <Link href="/admin" prefetch className="block rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring">
          <SertaoMakerBrand variant="compact" className="origin-center scale-95" />
        </Link>
        <p className="mt-3 text-xs font-medium text-muted-foreground">Painel de Coordenação</p>
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
      <div className="border-t border-border/70 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-lg text-foreground/80 hover:bg-destructive/10 hover:text-destructive"
          onClick={async () => {
            toast.message("Fazendo logout...");
            const res = await fetch("/auth/signout?next=/", { method: "POST" });
            const to = res.redirected ? res.url : "/";
            router.push(to);
            router.refresh();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
