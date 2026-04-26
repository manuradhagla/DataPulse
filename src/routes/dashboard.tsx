import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Database,
  Download,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { DatasetUploader } from "@/components/DatasetUploader";
import {
  AreaTrend,
  BarBreakdown,
  DoughnutBreakdown,
  LineTrend,
  PieBreakdown,
  RadarChart,
  ScatterPlot,
  StackedBars,
} from "@/components/charts/AnalyticsCharts";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  detectOutliers,
  formatNumber,
  growthPercent,
  isDateColumn,
  isNumericColumn,
  mean,
  median,
  minMax,
  rowDate,
  toNumberArray,
  valueCounts,
  type Row,
} from "@/lib/analytics";
import { logActivity } from "@/lib/activityLog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DataPulse" },
      { name: "description", content: "Your DataPulse analytics workspace." },
    ],
  }),
  component: Dashboard,
});

type DatasetRow = {
  id: string;
  name: string;
  file_type: string;
  columns: string[];
  rows: Row[];
  row_count: number;
  created_at: string;
  storage_path: string | null;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState<DatasetRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { mode: "login" } });
    }
  }, [user, loading, navigate]);

  const loadDatasets = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("datasets")
      .select("id, name, file_type, columns, rows, row_count, created_at, storage_path")
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
    })) as DatasetRow[];
    setDatasets(rows);
    setActiveId((prev) => {
      if (prev && rows.some((r) => r.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });
    setFetching(false);
  };

  useEffect(() => {
    if (user) void loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id: string) => {
    // Clean up the backed-up original file too (best-effort).
    const target = datasets.find((d) => d.id === id);
    if (target?.storage_path) {
      await supabase.storage.from("dataset-files").remove([target.storage_path]);
    }
    const { error } = await supabase.from("datasets").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user && target) {
      void logActivity(user.id, "delete", target.name, {
        rows: target.row_count,
        file_type: target.file_type,
      });
    }
    toast.success("Dataset deleted");
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const filtered = useMemo(
    () =>
      datasets.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())),
    [datasets, search],
  );

  const active = useMemo(
    () => datasets.find((d) => d.id === activeId) ?? null,
    [datasets, activeId],
  );

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
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Workspace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {datasets.length} dataset{datasets.length === 1 ? "" : "s"} · Welcome,{" "}
              {user?.email}
            </p>
          </div>
          <Button variant="hero" onClick={() => setUploadOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New dataset
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search datasets…"
                className="pl-9"
              />
            </div>
            <div className="space-y-1.5">
              {fetching ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <EmptySidebar onUpload={() => setUploadOpen(true)} />
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      activeId === d.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-surface/40 hover:border-border hover:bg-surface/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{d.name}</span>
                      <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                        {d.file_type}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {d.row_count} rows · {d.columns.length} cols
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section>
            {active ? (
              <DatasetView dataset={active} userId={user!.id} onDelete={() => handleDelete(active.id)} />
            ) : (
              <EmptyState onUpload={() => setUploadOpen(true)} />
            )}
          </section>
        </div>
      </main>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload dataset</DialogTitle>
            <DialogDescription>
              CSV or JSON. We'll detect the schema and let you preview before saving.
            </DialogDescription>
          </DialogHeader>
          {user && (
            <DatasetUploader
              userId={user.id}
              onSaved={() => {
                setUploadOpen(false);
                void loadDatasets();
              }}
              onCancel={() => setUploadOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptySidebar({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center">
      <p className="text-xs text-muted-foreground">No datasets yet.</p>
      <Button variant="link" size="sm" onClick={onUpload}>
        Upload one
      </Button>
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-card py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Database className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">No dataset selected</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Upload a CSV or JSON file to start exploring KPIs, trends, and outliers.
      </p>
      <Button variant="hero" className="mt-6" onClick={onUpload}>
        <Plus className="mr-1.5 h-4 w-4" /> Upload dataset
      </Button>
    </div>
  );
}

function DatasetView({
  dataset,
  userId,
  onDelete,
}: {
  dataset: DatasetRow;
  userId: string;
  onDelete: () => void;
}) {
  const numericCols = useMemo(
    () => dataset.columns.filter((c) => isNumericColumn(dataset.rows, c)),
    [dataset],
  );
  const categoricalCols = useMemo(
    () => dataset.columns.filter((c) => !isNumericColumn(dataset.rows, c)),
    [dataset],
  );
  const dateCols = useMemo(
    () => dataset.columns.filter((c) => isDateColumn(dataset.rows, c)),
    [dataset],
  );

  const [metricCol, setMetricCol] = useState<string>(numericCols[0] ?? "");
  const [groupCol, setGroupCol] = useState<string>(
    categoricalCols[0] ?? dataset.columns[0] ?? "",
  );
  const [dateCol, setDateCol] = useState<string>(dateCols[0] ?? "__none");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  // Variant pickers for the new chart types.
  const [trendType, setTrendType] = useState<"line" | "area" | "radar">("line");
  const [shareType, setShareType] = useState<"doughnut" | "pie">("doughnut");
  // Optional second numeric column to enable scatter (correlation) view.
  const [scatterCol, setScatterCol] = useState<string>("__none");

  useEffect(() => {
    setMetricCol(numericCols[0] ?? "");
    setGroupCol(categoricalCols[0] ?? dataset.columns[0] ?? "");
    setDateCol(dateCols[0] ?? "__none");
    setFromDate("");
    setToDate("");
    setScatterCol("__none");
  }, [dataset.id, numericCols, categoricalCols, dateCols, dataset.columns]);

  // Apply date-range filter (if a date column is chosen) before computing KPIs.
  const filteredRows = useMemo(() => {
    if (dateCol === "__none" || (!fromDate && !toDate)) return dataset.rows;
    const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
    const to = toDate ? new Date(toDate).getTime() + 86_399_999 : Infinity; // include the end day
    return dataset.rows.filter((r) => {
      const d = rowDate(r, dateCol);
      if (!d) return false;
      const t = d.getTime();
      return t >= from && t <= to;
    });
  }, [dataset.rows, dateCol, fromDate, toDate]);

  const numbers = useMemo(
    () => (metricCol ? toNumberArray(dataset.rows, metricCol) : []),
    [dataset.rows, metricCol],
  );

  const stats = useMemo(() => {
    const { min, max } = minMax(numbers);
    return {
      mean: mean(numbers),
      median: median(numbers),
      min,
      max,
      growth: growthPercent(numbers),
      outliers: detectOutliers(numbers).length,
    };
  }, [numbers]);

  const groups = useMemo(
    () => (groupCol ? valueCounts(dataset.rows, groupCol, 8) : []),
    [dataset.rows, groupCol],
  );

  // Sum of `metricCol` per top group → stacked bar / per-group magnitude.
  const groupedSums = useMemo(() => {
    if (!metricCol || !groupCol) return [] as { label: string; total: number }[];
    const sums = new Map<string, number>();
    for (const row of dataset.rows) {
      const key = row[groupCol];
      if (key === null || key === undefined || key === "") continue;
      const raw = row[metricCol];
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) continue;
      const k = String(key);
      sums.set(k, (sums.get(k) ?? 0) + n);
    }
    return [...sums.entries()]
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 8)
      .map(([label, total]) => ({ label, total }));
  }, [dataset.rows, metricCol, groupCol]);

  // Scatter points: pair the two chosen numeric columns row-by-row.
  const scatterPoints = useMemo(() => {
    if (!metricCol || scatterCol === "__none" || scatterCol === metricCol) return [];
    const pts: { x: number; y: number }[] = [];
    for (const r of dataset.rows) {
      const x = Number(r[scatterCol]);
      const y = Number(r[metricCol]);
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
    }
    return pts.slice(0, 1000); // cap for perf
  }, [dataset.rows, metricCol, scatterCol]);

  const trendLabels = useMemo(
    () => numbers.map((_, i) => `${i + 1}`).slice(-50),
    [numbers],
  );
  const trendValues = useMemo(() => numbers.slice(-50), [numbers]);

  const handleExport = () => {
    const report = {
      dataset: dataset.name,
      generated_at: new Date().toISOString(),
      row_count: dataset.row_count,
      columns: dataset.columns,
      metric_column: metricCol,
      group_column: groupCol,
      analytics: stats,
      breakdown: groups,
      grouped_sums: groupedSums,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset.name}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    // Treat report export as an analytics run for the activity log.
    void logActivity(userId, "analytics_run", dataset.name, {
      metric_column: metricCol,
      group_column: groupCol,
      mean: stats.mean,
      median: stats.median,
      outliers: stats.outliers,
    });
    void logActivity(userId, "export_report", dataset.name);
    toast.success("Report exported");
  };

  // Download the original uploaded file via short-lived signed URL (private bucket).
  const handleDownloadOriginal = async () => {
    if (!dataset.storage_path) {
      toast.error("Original file unavailable for this dataset");
      return;
    }
    const { data, error } = await supabase.storage
      .from("dataset-files")
      .createSignedUrl(dataset.storage_path, 60);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not get download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = `${dataset.name}.${dataset.file_type}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    void logActivity(userId, "download_original", dataset.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-gradient-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">{dataset.name}</h2>
          <p className="text-sm text-muted-foreground">
            {dataset.row_count} rows · {dataset.columns.length} columns ·{" "}
            {dataset.file_type.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dataset.storage_path && (
            <Button variant="outline" size="sm" onClick={handleDownloadOriginal}>
              <Download className="mr-1.5 h-4 w-4" /> Original file
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" /> Export report
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Metric column
          </Label>
          <Select value={metricCol} onValueChange={setMetricCol}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {numericCols.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No numeric columns
                </SelectItem>
              ) : (
                numericCols.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Group by column
          </Label>
          <Select value={groupCol} onValueChange={setGroupCol}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {dataset.columns.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Trend chart style
          </Label>
          <Select value={trendType} onValueChange={(v) => setTrendType(v as typeof trendType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="radar">Radar (top groups)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Compare with (scatter)
          </Label>
          <Select value={scatterCol} onValueChange={setScatterCol}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {numericCols
                .filter((c) => c !== metricCol)
                .map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {metricCol ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Mean" value={formatNumber(stats.mean)} icon={TrendingUp} />
          <KpiCard label="Median" value={formatNumber(stats.median)} icon={BarChart3} />
          <KpiCard
            label="Growth"
            value={`${stats.growth >= 0 ? "+" : ""}${stats.growth.toFixed(1)}%`}
            tone={stats.growth >= 0 ? "good" : "bad"}
            icon={TrendingUp}
          />
          <KpiCard label="Min" value={formatNumber(stats.min)} icon={BarChart3} />
          <KpiCard label="Max" value={formatNumber(stats.max)} icon={BarChart3} />
          <KpiCard
            label="Outliers"
            value={String(stats.outliers)}
            tone={stats.outliers > 0 ? "warn" : "muted"}
            icon={BarChart3}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No numeric columns detected — KPIs unavailable. Categorical breakdowns
          are still available below.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {metricCol && trendValues.length > 1 && (
          <div className="rounded-2xl border border-border bg-gradient-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">
                Trend · {metricCol}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {trendType === "radar"
                  ? `top ${groupedSums.length} groups`
                  : `last ${trendValues.length}`}
              </span>
            </div>
            {trendType === "line" && (
              <LineTrend labels={trendLabels} values={trendValues} label={metricCol} />
            )}
            {trendType === "area" && (
              <AreaTrend labels={trendLabels} values={trendValues} label={metricCol} />
            )}
            {trendType === "radar" &&
              (groupedSums.length >= 3 ? (
                <RadarChart
                  labels={groupedSums.map((g) => g.label)}
                  values={groupedSums.map((g) => g.total)}
                  metricLabel={`${metricCol} by ${groupCol}`}
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                  Need at least 3 groups for a radar chart.
                </div>
              ))}
          </div>
        )}

        {/* Scatter: correlation between two numeric columns */}
        {scatterPoints.length > 1 && (
          <div className="rounded-2xl border border-border bg-gradient-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Correlation</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {scatterPoints.length} points
              </span>
            </div>
            <ScatterPlot points={scatterPoints} xLabel={scatterCol} yLabel={metricCol} />
          </div>
        )}

        {/* Stacked bar of summed metric per top group */}
        {metricCol && groupedSums.length > 0 && (
          <div className="rounded-2xl border border-border bg-gradient-card p-5">
            <h3 className="mb-4 font-display text-base font-semibold">
              {metricCol} sum by {groupCol}
            </h3>
            <StackedBars
              labels={groupedSums.map((g) => g.label)}
              datasets={[{ label: metricCol, values: groupedSums.map((g) => g.total) }]}
            />
          </div>
        )}

        {groupCol && groups.length > 0 && (
          <>
            <div className="rounded-2xl border border-border bg-gradient-card p-5">
              <h3 className="mb-4 font-display text-base font-semibold">
                Counts by {groupCol}
              </h3>
              <BarBreakdown
                labels={groups.map((g) => g.label)}
                values={groups.map((g) => g.count)}
                label="count"
              />
            </div>
            <div className="rounded-2xl border border-border bg-gradient-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold">
                  Share of {groupCol}
                </h3>
                <Select
                  value={shareType}
                  onValueChange={(v) => setShareType(v as typeof shareType)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doughnut">Doughnut</SelectItem>
                    <SelectItem value="pie">Pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {shareType === "doughnut" ? (
                <DoughnutBreakdown
                  labels={groups.map((g) => g.label)}
                  values={groups.map((g) => g.count)}
                />
              ) : (
                <PieBreakdown
                  labels={groups.map((g) => g.label)}
                  values={groups.map((g) => g.count)}
                />
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-card p-5">
        <h3 className="mb-3 font-display text-base font-semibold">Sample rows</h3>
        <div className="max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface">
              <tr>
                {dataset.columns.map((c) => (
                  <th
                    key={c}
                    className="border-b border-border px-3 py-2 text-left font-medium"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.rows.slice(0, 25).map((r, i) => (
                <tr key={i} className="odd:bg-background/40">
                  {dataset.columns.map((c) => (
                    <td
                      key={c}
                      className="border-b border-border/40 px-3 py-1.5 font-mono text-muted-foreground"
                    >
                      {r[c] === null || r[c] === undefined ? "—" : String(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone?: "default" | "good" | "bad" | "warn" | "muted";
}) {
  const toneCls =
    tone === "good"
      ? "text-success"
      : tone === "bad"
        ? "text-destructive"
        : tone === "warn"
          ? "text-accent"
          : tone === "muted"
            ? "text-muted-foreground"
            : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-2 font-display text-3xl font-semibold tabular-nums ${toneCls}`}>
        {value}
      </div>
    </div>
  );
}
