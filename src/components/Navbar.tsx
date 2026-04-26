import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, FileBarChart, LogOut, Settings as SettingsIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, signOut } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useRole";

export function Navbar() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            DataPulse
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            hash="features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            to="/"
            hash="preview"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Preview
          </Link>
          <Link
            to="/"
            hash="about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <Shield className="mr-1.5 h-4 w-4" /> Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/reports">
                  <FileBarChart className="mr-1.5 h-4 w-4" /> Reports
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings">
                  <SettingsIcon className="mr-1.5 h-4 w-4" /> Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "login" }}>
                  Log in
                </Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
