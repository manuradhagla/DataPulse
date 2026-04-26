import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  detectOutliers,
  formatNumber,
  growthPercent,
  isNumericColumn,
  mean,
  median,
  minMax,
  toNumberArray,
  type Row,
} from "@/lib/analytics";
import { logActivity } from "@/lib/activityLog";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DataPulse" },
      {
        name: "description",
        content:
          "Cross-dataset analytics summary. Aggregate KPIs and export consolidated reports across all your DataPulse datasets.",
      },
      { property: "og:title", content: "Reports — DataPulse" },
      {
        property: "og:description",
        content: "Aggregate KPIs and export consolidated reports across all your datasets.",
      },
    ],
  }),
  component: ReportsPage,
});

type DatasetSummary = {
  id: string;
  name: string;
  file_type: string;
  row_count: number;
  columns: string[];
  rows: Row[];
  created_at: string;
};

function ReportsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("datasets")
        .select("id, name, file_type, row_count, columns, rows, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setFetching(false);
        return;
      }
      const rows = (data ?? []).map((d) => ({
        ...d,
        columns: (d.columns as unknown as string[]) ?? [],
        rows: (d.rows as unknown as Row[]) ?? [],
      })) as DatasetSummary[];
      setDatasets(rows);
      setFetching(false);
    })();
  }, [user]);

  const summaries = useMemo(() => {
    return datasets.map((d) => {
      const numericCols = d.columns.filter((c) => isNumericColumn(d.rows, c));
      const primary = numericCols[0];
      const nums = primary ? toNumericValues(d.rows, primary) : [];
      const { min, max } = minMax(nums);
      return {
        id: d.id,
        name: d.name,
        file_type: d.file_type,
        row_count: d.row_count,
        column_count: d.columns.length,
        created_at: d.created_at,
        primary_metric: primary ?? null,
        mean: nums.length ? mean(nums) : null,
        median: nums.length ? median(nums) : null,
        growth: nums.length ? growthPercent(nums) : null,
        outliers: nums.length ? detectOutliers(nums).length : 0,
        min: nums.length ? min : null,
        max: nums.length ? max : null,
      };
    });
  }, [datasets]);

  const totals = useMemo(() => {
    return {
      datasets: summaries.length,
      rows: summaries.reduce((a, s) => a + s.row_count, 0),
      outliers: summaries.reduce((a, s) => a + s.outliers, 0),
      withMetrics: summaries.filter((s) => s.primary_metric).length,
    };
  }, [summaries]);

  const handleExportAll = () => {
    if (!user) return;
    const payload = {
      generated_at: new Date().toISOString(),
      user: user.email,
      totals,
      datasets: summaries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datapulse-reports-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    void logActivity(user.id, "export_report", "all_datasets", { count: summaries.length });
    toast.success("Consolidated report exported");
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cross-dataset analytics summary across your workspace.
            </p>
          </div>
          <Button variant="hero" onClick={handleExportAll} disabled={summaries.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Export consolidated report
          </Button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Datasets" value={String(totals.datasets)} />
          <SummaryCard label="Total rows" value={formatNumber(totals.rows)} />
          <SummaryCard label="With numeric KPIs" value={String(totals.withMetrics)} />
          <SummaryCard label="Outliers detected" value={String(totals.outliers)} tone="warn" />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-gradient-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <h2 className="font-display text-base font-semibold">Per-dataset summary</h2>
            <span className="text-xs text-muted-foreground">{summaries.length} datasets</span>
          </div>
          {fetching ? (
            <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <FileBarChart className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No datasets yet — upload one to see reports.
              </p>
              <Button asChild variant="hero" size="sm" className="mt-4">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Dataset</th>
                    <th className="px-3 py-3 font-medium">Rows</th>
                    <th className="px-3 py-3 font-medium">Cols</th>
                    <th className="px-3 py-3 font-medium">Primary metric</th>
                    <th className="px-3 py-3 font-medium">Mean</th>
                    <th className="px-3 py-3 font-medium">Median</th>
                    <th className="px-3 py-3 font-medium">Growth</th>
                    <th className="px-3 py-3 font-medium">Outliers</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.id} className="border-t border-border/40">
                      <td className="px-5 py-3 font-medium">{s.name}</td>
                      <td className="px-3 py-3 tabular-nums">{s.row_count}</td>
                      <td className="px-3 py-3 tabular-nums">{s.column_count}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {s.primary_metric ?? "—"}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {s.mean !== null ? formatNumber(s.mean) : "—"}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {s.median !== null ? formatNumber(s.median) : "—"}
                      </td>
                      <td
                        className={`px-3 py-3 tabular-nums ${
                          s.growth === null
                            ? ""
                            : s.growth >= 0
                              ? "text-success"
                              : "text-destructive"
                        }`}
                      >
                        {s.growth === null
                          ? "—"
                          : `${s.growth >= 0 ? "+" : ""}${s.growth.toFixed(1)}%`}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {s.outliers > 0 ? (
                          <span className="text-accent">{s.outliers}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function toNumericValues(rows: Row[], col: string): number[] {
  return toNumberArray(rows, col);
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-3xl font-semibold tabular-nums ${
          tone === "warn" ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
