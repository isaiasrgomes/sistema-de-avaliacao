import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-amber-50 to-white p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Sertão Inovador</h1>
        <p className="mt-2 text-muted-foreground">Avaliação e ranqueamento — Edital 45/2026</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/login?next=/admin">Painel coordenação</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/login?next=/avaliador">Área do avaliador</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/resultado">Resultado público</Link>
        </Button>
      </div>
    </main>
  );
}
