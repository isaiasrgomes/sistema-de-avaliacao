import Link from "next/link";
import { ClipboardPen, History, Lock } from "lucide-react";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { LandingLayout } from "@/components/landing/landing-layout";
import { PortalCard } from "@/components/landing/portal-card";
import { Button } from "@/components/ui/button";

type PublicHomeProps = {
  inscricaoAberta: boolean;
  programaAtivoNome?: string | null;
};

export function PublicHome({ inscricaoAberta, programaAtivoNome }: PublicHomeProps) {
  const inscricaoDescricao = inscricaoAberta
    ? programaAtivoNome
      ? `Inscrições abertas para ${programaAtivoNome}. Envie sua proposta pelo formulário oficial.`
      : "Envie sua proposta pelo formulário oficial do edital em andamento."
    : "Não há programa com inscrições abertas no momento. Consulte o histórico ou aguarde nova edição.";

  return (
    <LandingLayout className="justify-center gap-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <SertaoMakerBrand variant="full" align="center" className="origin-center scale-105 sm:scale-110" />
        <div className="max-w-xl space-y-2">
          <p className="text-base font-medium text-foreground/90">Plataforma de avaliação e seleção de projetos</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {inscricaoAberta
              ? "Inscrições abertas para o programa em andamento, histórico de edições encerradas e avaliação com transparência."
              : "Histórico de programas finalizados e processo de avaliação com transparência."}
          </p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          <PortalCard
            href={inscricaoAberta ? "/inscricao" : undefined}
            title="Inscrição de Projetos"
            description={inscricaoDescricao}
            icon={ClipboardPen}
            featured
            disabled={!inscricaoAberta}
            buttonLabel={inscricaoAberta ? "Acessar" : "Indisponível"}
          />
          <PortalCard
            href="/historico-programas"
            title="Histórico de Programas"
            description="Consulte resultados finais e rankings de edições já encerradas."
            icon={History}
            featured
            buttonLabel="Acessar"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl border-t border-border/50 pt-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-6 text-center backdrop-blur-sm sm:flex-row sm:justify-between sm:text-left">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Área restrita</p>
            <p className="text-xs text-muted-foreground">
              Avaliadores e coordenação acessam o painel em ambiente autenticado.
            </p>
          </div>
          <Button variant="outline" size="lg" className="h-10 shrink-0 gap-2 border-border/80 bg-background/80" asChild>
            <Link href="/acesso">
              <Lock className="h-4 w-4" aria-hidden />
              Acesso Restrito (Avaliador / Coordenação)
            </Link>
          </Button>
        </div>
      </section>
    </LandingLayout>
  );
}
