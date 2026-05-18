import { ManualView } from "@/components/manual-view";
import { PageHeader } from "@/components/layout/page-header";

export default function AvaliadorManualPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Manual do Avaliador"
        description="Guia da área do avaliador com orientações de uso e boas práticas de avaliação."
      />
      <ManualView perfil="avaliador" />
    </div>
  );
}
