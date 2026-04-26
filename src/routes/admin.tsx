import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Shield, Database, Users, Activity } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useRole";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — DataPulse" },
      { name: "description", content: "Cross-user analytics overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminDataset = {
  id: string;
  name: string;
  file_type: string;
  row_count: number;
  created_at: string;
  user_id: string;
};

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
};

type ActivityEntry = {
  id: string;
  user_id: string;
  action: string;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [datasets, setDatasets] = useState<AdminDataset[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  // Bounce non-authenticated users to /auth, non-admins back to /dashboard.
  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } });
    } else if (!isAdmin) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  // Pull all profiles + datasets — admin RLS policies expose every row.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const [{ data: profileData }, { data: datasetData }, { data: activityData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, email, display_name, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("datasets")
            .select("id, name, file_type, row_count, created_at, user_id")
            .order("created_at", { ascending: false }),
          supabase
            .from("activity_logs")
            .select("id, user_id, action, target_name, details, created_at")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);
      if (cancelled) return;
      setProfiles((profileData ?? []) as Profile[]);
      setDatasets((datasetData ?? []) as AdminDataset[]);
      setActivity((activityData ?? []) as ActivityEntry[]);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Group dataset counts per user for the user table.
  const datasetsByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of datasets) map.set(d.user_id, (map.get(d.user_id) ?? 0) + 1);
    return map;
  }, [datasets]);

  // Map user_id → email so the dataset table reads as a human name, not a UUID.
  const userEmailById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of profiles) map.set(p.id, p.email ?? p.display_name ?? p.id.slice(0, 8));
    return map;
  }, [profiles]);

  const filteredDatasets = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return datasets;
    return datasets.filter((d) => {
      const owner = userEmailById.get(d.user_id) ?? "";
      return d.name.toLowerCase().includes(q) || owner.toLowerCase().includes(q);
    });
  }, [datasets, search, userEmailById]);

  if (authLoading || roleLoading || (isAdmin && fetching)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const totalRows = datasets.reduce((sum, d) => sum + d.row_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Admin overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Cross-user view of all DataPulse activity.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Users" value={profiles.length} icon={Users} />
          <StatCard label="Datasets" value={datasets.length} icon={Database} />
          <StatCard label="Total rows" value={totalRows.toLocaleString()} icon={Database} />
        </div>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-lg font-semibold">Users</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Display name</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Datasets</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-mono text-xs">{p.email ?? "—"}</td>
                      <td className="px-4 py-3">{p.display_name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {datasetsByUser.get(p.id) ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-lg font-semibold">All datasets</h2>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or owner…"
              className="sm:max-w-xs"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Rows</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No datasets match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredDatasets.map((d) => (
                    <tr key={d.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {userEmailById.get(d.user_id) ?? d.user_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                          {d.file_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {d.row_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(d.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            <span className="text-xs text-muted-foreground">(last 100 events)</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Target</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  activity.map((a) => (
                    <tr key={a.id} className="border-t border-border/60 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {userEmailById.get(a.user_id) ?? a.user_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={a.action} />
                      </td>
                      <td className="px-4 py-3">{a.target_name ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {a.details && Object.keys(a.details).length > 0
                          ? Object.entries(a.details)
                              .map(([k, v]) => `${k}: ${typeof v === "number" ? Math.round(v * 100) / 100 : String(v)}`)
                              .join(" · ")
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// Color-coded badge for the action column so admins can scan event types quickly.
function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    upload: "bg-emerald-500/15 text-emerald-300",
    delete: "bg-red-500/15 text-red-300",
    analytics_run: "bg-primary/15 text-primary",
    download_original: "bg-sky-500/15 text-sky-300",
    export_report: "bg-amber-500/15 text-amber-300",
  };
  const cls = styles[action] ?? "bg-surface-elevated text-muted-foreground";
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${cls}`}>
      {action.replace("_", " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof Database;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {value}
      </div>
    </div>
  );
}
