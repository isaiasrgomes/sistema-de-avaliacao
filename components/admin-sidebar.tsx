"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Upload, Users, Link2, LineChart, Trophy, FileText, Scale, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/admin", label: "Monitoramento", icon: LayoutDashboard },
  { href: "/admin/projetos", label: "Projetos", icon: LineChart },
  { href: "/admin/importar", label: "Inscrições", icon: Upload },
  { href: "/admin/avaliadores", label: "Avaliadores", icon: Users },
  { href: "/admin/atribuicoes", label: "Atribuições", icon: Link2 },
  { href: "/admin/ranking", label: "Ranking / Resultado", icon: Trophy },
  { href: "/admin/recursos", label: "Recursos", icon: Scale },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      <div className="border-b p-4">
        <p className="text-sm font-semibold text-primary">Coordenação</p>
        <p className="text-xs text-muted-foreground">45/2026</p>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
              pathname === href && "bg-muted font-medium"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
