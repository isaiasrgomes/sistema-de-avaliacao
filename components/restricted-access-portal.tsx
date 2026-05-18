import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users2 } from "lucide-react";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { LandingLayout } from "@/components/landing/landing-layout";
import { PortalCard } from "@/components/landing/portal-card";
import { Button } from "@/components/ui/button";

const RESTRICTED_ROUTES = [
  {
    href: "/login?next=/avaliador",
    title: "Área do Avaliador",
    description: "Acesse projetos atribuídos, envie avaliações e acompanhe pendências.",
    icon: Users2,
    buttonLabel: "Entrar",
  },
  {
    href: "/login?next=/admin",
    title: "Painel de Coordenação",
    description: "Gerencie inscrições, atribuições, ranking, relatórios e configurações do programa.",
    icon: ShieldCheck,
    buttonLabel: "Entrar",
  },
] as const;

export function RestrictedAccessPortal() {
  return (
    <LandingLayout className="justify-center gap-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Button variant="ghost" size="sm" className="self-start gap-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar à página inicial
          </Link>
        </Button>
        <SertaoMakerBrand variant="compact" align="center" />
        <div className="max-w-lg space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Acesso restrito</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Entre com suas credenciais para acessar o painel do avaliador ou da coordenação.
          </p>
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-3xl gap-5 sm:grid-cols-2 sm:gap-6">
        {RESTRICTED_ROUTES.map((route) => (
          <PortalCard key={route.href} {...route} />
        ))}
      </section>
    </LandingLayout>
  );
}
