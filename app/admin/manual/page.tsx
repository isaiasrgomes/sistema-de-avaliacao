import { ManualView } from "@/components/manual-view";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminManualPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Manual da Coordenação"
        description="Instruções operacionais do painel administrativo com passo a passo das rotinas principais."
      />
      <ManualView perfil="admin" />
    </div>
  );
}
