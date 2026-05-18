import { PublicHome } from "@/components/public-home";
import { getEstadoInscricaoPublica } from "@/lib/programa/inscricao-publica";

export default async function HomePage() {
  const estado = await getEstadoInscricaoPublica();

  return (
    <PublicHome
      inscricaoAberta={estado.aberta}
      programaAtivoNome={estado.aberta ? estado.programa.nome : null}
    />
  );
}
