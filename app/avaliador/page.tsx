import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AvaliadorHomePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: av } = await supabase
    .from("avaliadores")
    .select("id")
    .ilike("email", (user?.email ?? "").trim().toLowerCase())
    .maybeSingle();

  if (!av) {
    return <p className="text-destructive">Seu e-mail não está cadastrado como avaliador. Solicite inclusão à coordenação.</p>;
  }

  const { data: atribs } = await supabase
    .from("atribuicoes")
    .select("id, status, projeto_id, ordem")
    .eq("avaliador_id", av.id)
    .order("data_atribuicao", { ascending: false });

  const projetoIds = Array.from(new Set((atribs ?? []).map((a) => a.projeto_id)));
  const { data: projetos } = await supabase.from("projetos").select("id, nome_projeto, status").in("id", projetoIds);

  const mapP = new Map(projetos?.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Meus projetos</h1>
        <p className="text-muted-foreground">Apenas atribuições vinculadas ao seu e-mail.</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status atribuição</TableHead>
            <TableHead>Projeto (status)</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(atribs ?? []).map((a) => {
            const p = mapP.get(a.projeto_id);
            return (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{p?.nome_projeto ?? a.projeto_id}</TableCell>
                <TableCell>{a.ordem}</TableCell>
                <TableCell>
                  <Badge variant="outline">{a.status}</Badge>
                </TableCell>
                <TableCell>{p?.status}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm">
                    <Link href={`/avaliador/projeto/${a.projeto_id}?atribuicao=${a.id}`}>Abrir</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
