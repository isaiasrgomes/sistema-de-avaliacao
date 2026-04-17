"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, CalendarRange, Download, Gauge, Timer } from "lucide-react";

type DashboardProjetoMetric = {
  id: string;
  municipio: string;
  fase: "IDEACAO" | "VALIDACAO";
  status: string;
  timestamp_submissao: string;
  first_eval_at: string | null;
};

export function DashboardMetricasClient({ projetos, progressoPct }: { projetos: DashboardProjetoMetric[]; progressoPct: number }) {
  const [filtroMunicipio, setFiltroMunicipio] = useState("");
  const [filtroFase, setFiltroFase] = useState<"" | "IDEACAO" | "VALIDACAO">("");

  const municipios = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.municipio))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [projetos]
  );

  const filtrados = useMemo(() => {
    return projetos.filter((p) => {
      if (filtroMunicipio && p.municipio !== filtroMunicipio) return false;
      if (filtroFase && p.fase !== filtroFase) return false;
      return true;
    });
  }, [projetos, filtroMunicipio, filtroFase]);

  const topMunicipios = useMemo(() => {
    const metricsPorMunicipio = new Map<string, { total: number; ideacao: number; validacao: number; avaliados: number }>();
    for (const p of filtrados) {
      const item = metricsPorMunicipio.get(p.municipio) ?? { total: 0, ideacao: 0, validacao: 0, avaliados: 0 };
      item.total += 1;
      if (p.fase === "IDEACAO") item.ideacao += 1;
      if (p.fase === "VALIDACAO") item.validacao += 1;
      if (p.status === "AVALIADO" || p.status === "SELECIONADO" || p.status === "SUPLENTE" || p.status === "NAO_SELECIONADO") {
        item.avaliados += 1;
      }
      metricsPorMunicipio.set(p.municipio, item);
    }
    return Array.from(metricsPorMunicipio.entries())
      .map(([municipio, m]) => ({ municipio, ...m, taxaAvaliacao: m.total ? Math.round((m.avaliados / m.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filtrados]);

  const taxa = useMemo(() => {
    const avaliados = filtrados.filter(
      (p) => p.status === "AVALIADO" || p.status === "SELECIONADO" || p.status === "SUPLENTE" || p.status === "NAO_SELECIONADO"
    ).length;
    return filtrados.length ? Math.round((avaliados / filtrados.length) * 100) : 0;
  }, [filtrados]);

  const tempoMedioHoras = useMemo(() => {
    let soma = 0;
    let qtd = 0;
    for (const p of filtrados) {
      if (!p.first_eval_at) continue;
      const horas = (new Date(p.first_eval_at).getTime() - new Date(p.timestamp_submissao).getTime()) / (1000 * 60 * 60);
      if (horas >= 0) {
        soma += horas;
        qtd += 1;
      }
    }
    return qtd ? (soma / qtd).toFixed(1) : "0.0";
  }, [filtrados]);

  const serieTemporal = useMemo(() => {
    const bucket = new Map<string, { mes: string; submetidos: number; avaliados: number }>();
    for (const p of filtrados) {
      const mesSub = p.timestamp_submissao.slice(0, 7);
      const sub = bucket.get(mesSub) ?? { mes: mesSub, submetidos: 0, avaliados: 0 };
      sub.submetidos += 1;
      bucket.set(mesSub, sub);

      if (p.first_eval_at) {
        const mesAv = p.first_eval_at.slice(0, 7);
        const av = bucket.get(mesAv) ?? { mes: mesAv, submetidos: 0, avaliados: 0 };
        av.avaliados += 1;
        bucket.set(mesAv, av);
      }
    }
    return Array.from(bucket.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filtrados]);

  const maxSerie = useMemo(() => Math.max(1, ...serieTemporal.map((s) => Math.max(s.submetidos, s.avaliados))), [serieTemporal]);
  const totalIdeacao = useMemo(() => filtrados.filter((p) => p.fase === "IDEACAO").length, [filtrados]);
  const totalValidacao = useMemo(() => filtrados.filter((p) => p.fase === "VALIDACAO").length, [filtrados]);
  const totalAvaliados = useMemo(
    () =>
      filtrados.filter(
        (p) => p.status === "AVALIADO" || p.status === "SELECIONADO" || p.status === "SUPLENTE" || p.status === "NAO_SELECIONADO"
      ).length,
    [filtrados]
  );
  const totalNaoAvaliados = Math.max(0, filtrados.length - totalAvaliados);

  function exportarCsvRecorte() {
    const headers = [
      "id",
      "municipio",
      "fase",
      "status",
      "timestamp_submissao",
      "first_eval_at",
      "tempo_ate_primeira_avaliacao_horas",
    ];
    const rows = filtrados.map((p) => {
      const horas = p.first_eval_at
        ? ((new Date(p.first_eval_at).getTime() - new Date(p.timestamp_submissao).getTime()) / (1000 * 60 * 60)).toFixed(1)
        : "";
      return [p.id, p.municipio, p.fase, p.status, p.timestamp_submissao, p.first_eval_at ?? "", horas];
    });
    const csv = [headers, ...rows]
      .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard-recorte.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm">
        <div className="min-w-56 space-y-1">
          <p className="text-xs text-muted-foreground">Município</p>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
          >
            <option value="">Todos</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-48 space-y-1">
          <p className="text-xs text-muted-foreground">Fase</p>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={filtroFase}
            onChange={(e) => setFiltroFase(e.target.value as "" | "IDEACAO" | "VALIDACAO")}
          >
            <option value="">Todas</option>
            <option value="IDEACAO">Ideação</option>
            <option value="VALIDACAO">Validação</option>
          </select>
        </div>
        <div className="min-w-40 space-y-1">
          <p className="text-xs text-muted-foreground">Projetos no recorte</p>
          <Input value={String(filtrados.length)} readOnly />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={exportarCsvRecorte}>
            Exportar recorte (CSV)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top municípios</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{topMunicipios[0]?.municipio ?? "Sem dados"}</p>
              <p className="text-xs text-muted-foreground">Maior volume no recorte atual</p>
            </div>
            <Building2 className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de avaliação</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{taxa}%</p>
              <p className="text-xs text-muted-foreground">Projetos já avaliados no recorte</p>
            </div>
            <Gauge className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo médio por projeto</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{tempoMedioHoras}h</p>
              <p className="text-xs text-muted-foreground">Da submissão à 1ª avaliação</p>
            </div>
            <Timer className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="w-full border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Métricas por município e fase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topMunicipios.map((m) => (
              <div key={m.municipio} className="rounded-md border border-border/60 px-2 py-1.5">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate pr-2 font-medium text-foreground">{m.municipio}</span>
                  <span className="text-muted-foreground">
                    {m.total} | I {m.ideacao} | V {m.validacao} | Av {m.taxaAvaliacao}%
                  </span>
                </div>
                <div className="h-1 rounded bg-muted">
                  <div className="h-1 rounded bg-primary/60" style={{ width: `${m.taxaAvaliacao}%` }} />
                </div>
              </div>
            ))}
            {topMunicipios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto no recorte atual.</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarRange className="h-4 w-4 text-primary" />
                Tendência temporal (mês)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {serieTemporal.map((s) => (
                <div key={s.mes} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{s.mes}</span>
                    <span>
                      Submetidos: {s.submetidos} | Avaliados: {s.avaliados}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded bg-muted">
                      <div className="h-2 rounded bg-blue-500" style={{ width: `${(s.submetidos / maxSerie) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div className="h-2 rounded bg-emerald-500" style={{ width: `${(s.avaliados / maxSerie) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {serieTemporal.length === 0 && <p className="text-sm text-muted-foreground">Sem dados no recorte.</p>}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Distribuição do recorte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="rounded-md border border-border/60 px-2 py-1.5">
                <div className="mb-1 flex items-center justify-between">
                  <span>Fase</span>
                  <span>
                    Ideação {totalIdeacao} | Validação {totalValidacao}
                  </span>
                </div>
                <div className="h-1 rounded bg-muted">
                  <div
                    className="h-1 rounded bg-slate-500"
                    style={{ width: `${(totalIdeacao / Math.max(1, filtrados.length)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="rounded-md border border-border/60 px-2 py-1.5">
                <div className="mb-1 flex items-center justify-between">
                  <span>Status</span>
                  <span>
                    Avaliados {totalAvaliados} | Pendentes {totalNaoAvaliados}
                  </span>
                </div>
                <div className="h-1 rounded bg-muted">
                  <div
                    className="h-1 rounded bg-primary/60"
                    style={{ width: `${(totalAvaliados / Math.max(1, filtrados.length)) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardContent className="pt-5">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Download className="h-3.5 w-3.5" />
                Use “Exportar recorte (CSV)” para levar essa visão para BI/planilha.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso estimado</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, progressoPct)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {progressoPct}% dos elegíveis com ciclo encerrado (aproximação por status “Avaliado”).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

