import Link from "next/link";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { ProjetoInscricaoForm } from "@/app/admin/importar/projeto-manual-form";
import { UFS_BRASIL } from "@/lib/constants/brasil";
import { loadMunicipiosParaInscricao } from "@/lib/data/municipios-inscricao";
import { getEstadoInscricaoPublica } from "@/lib/programa/inscricao-publica";

export default async function InscricaoPage() {
  const estado = await getEstadoInscricaoPublica();

  let municipios: string[] = [];
  let municipiosErro: string | null = null;

  if (estado.aberta) {
    try {
      municipios = await loadMunicipiosParaInscricao();
    } catch {
      municipiosErro =
        "Inscrições temporariamente indisponíveis. Verifique a configuração do servidor (SUPABASE_SERVICE_ROLE_KEY).";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <SertaoMakerBrand variant="full" align="center" className="origin-center scale-110 sm:scale-125" />
        {estado.aberta ? (
          <p className="max-w-xl text-sm text-muted-foreground">
            Inscrições abertas para <span className="font-medium text-foreground">{estado.programa.nome}</span>.
            Preencha o formulário abaixo para participar.
          </p>
        ) : (
          <p className="max-w-xl text-sm text-muted-foreground">
            {estado.motivo === "configuracao"
              ? "Inscrições temporariamente indisponíveis. Tente novamente mais tarde."
              : "Não há programa com inscrições abertas no momento."}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
            Voltar à página inicial
          </Link>
        </p>
      </div>

      {!estado.aberta ? (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
          Quando uma nova edição for aberta pela coordenação, o formulário de inscrição será liberado na página
          inicial.
        </p>
      ) : municipiosErro ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {municipiosErro}
        </p>
      ) : (
        <ProjetoInscricaoForm municipios={municipios} ufs={[...UFS_BRASIL]} variant="public" />
      )}
    </main>
  );
}
