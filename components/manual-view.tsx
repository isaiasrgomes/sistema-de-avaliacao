import { MANUAIS, type ManualPerfil } from "@/lib/manuals/manual-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function ManualView({ perfil }: { perfil: ManualPerfil }) {
  const manual = MANUAIS[perfil];

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {manual.titulo}
        </CardTitle>
        <CardDescription>{manual.subtitulo}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {manual.secoes.map((s) => (
            <div key={s.titulo} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <h3 className="text-sm font-semibold text-foreground">{s.titulo}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.descricao}</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {s.passos.map((p) => (
                  <li key={p} className="list-inside list-disc">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
