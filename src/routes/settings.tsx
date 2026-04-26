import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { useAuth, signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/useRole";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DataPulse" },
      {
        name: "description",
        content:
          "Manage your DataPulse profile, account preferences, and session.",
      },
      { property: "og:title", content: "Settings — DataPulse" },
      {
        property: "og:description",
        content: "Manage your DataPulse profile and account preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [displayName, setDisplayName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setFetching(true);
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      const name = data?.display_name ?? "";
      setDisplayName(name);
      setInitialName(name);
      setFetching(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInitialName(displayName.trim());
    toast.success("Profile updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dirty = displayName.trim() !== initialName.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and account.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-gradient-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Profile</h2>
              <p className="text-xs text-muted-foreground">
                Your role: <span className="text-foreground">{isAdmin ? "admin" : "user"}</span>
              </p>
            </div>
          </div>

          {fetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user!.email ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={!dirty || saving} variant="hero">
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-gradient-card p-6">
          <h2 className="font-display text-lg font-semibold">Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign out of your DataPulse account on this device.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
