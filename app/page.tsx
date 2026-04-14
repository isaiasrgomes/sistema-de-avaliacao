import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, ShieldCheck, Users2 } from "lucide-react";

export default function HomePage() {
  const links = [
    {
      href: "/login?next=/admin",
      title: "Painel de coordenação",
      description: "Gestão de inscrições, atribuições, ranking e relatórios.",
      icon: ShieldCheck,
    },
    {
      href: "/login?next=/avaliador",
      title: "Área do avaliador",
      description: "Acesse projetos atribuídos e envie avaliações com segurança.",
      icon: Users2,
    },
    {
      href: "/resultado",
      title: "Resultado público",
      description: "Consulte a classificação divulgada no edital atual.",
      icon: BarChart3,
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Sertao Maker</h1>
        <p className="text-muted-foreground">Plataforma de avaliação e ranqueamento - Edital 45/2026</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {links.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full border-border/70 bg-card/85 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-lg">
              <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm font-medium text-primary">
                Acessar rota <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
