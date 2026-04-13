import { ProjetoManualForm } from "./projeto-manual-form";
import { ImportarCsvCard } from "./importar-csv-card";

export default function ImportarPage() {
  return (
    <div className="max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Inscrições</h1>
        <p className="text-muted-foreground">Cadastre manualmente ou importe planilha exportada do Google Forms.</p>
      </div>
      <ProjetoManualForm />
      <ImportarCsvCard />
    </div>
  );
}
