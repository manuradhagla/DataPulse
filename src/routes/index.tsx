import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Clock,
  Database,
  Github,
  LineChart,
  Linkedin,
  Lock,
  PieChart,
  Quote,
  Sparkles,
  Twitter,
  UploadCloud,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DataPulse — Self-serve analytics for CSV & JSON" },
      {
        name: "description",
        content:
          "Upload CSV or JSON files and get instant KPIs, trend lines, and interactive charts. Built for teams that want answers, not BI training.",
      },
      { property: "og:title", content: "DataPulse — Self-serve analytics for CSV & JSON" },
      {
        property: "og:description",
        content:
          "Drop in your data and get a live dashboard in seconds. KPIs, charts, outlier detection — no Tableau required.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <DashboardPreview />
      <WhyChoose />
      <Testimonials />
      <About />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Built for teams who need answers, not training
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Turn raw files into a{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              live dashboard
            </span>{" "}
            in seconds.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            DataPulse ingests your CSV or JSON, detects the schema, computes the
            KPIs that matter, and renders interactive charts — no Power BI, no
            Tableau, no setup.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild variant="hero" size="xl">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/" hash="preview">
                See it in action
              </Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Row-level security
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Instant insights
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" /> CSV & JSON
            </div>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-20 blur-2xl animate-pulse-glow" />
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card shadow-elevated backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            datapulse.app/dashboard/q3-revenue
          </span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <KpiTile label="Total Revenue" value="$2.84M" delta="+18.2%" />
          <KpiTile label="Avg Order" value="$148" delta="+4.6%" />
          <KpiTile label="Outliers" value="12" delta="-2" muted />
        </div>
        <div className="grid gap-4 px-5 pb-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border/60 bg-surface/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Revenue trend</h4>
              <span className="font-mono text-xs text-muted-foreground">12 weeks</span>
            </div>
            <FakeLineChart />
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/60 p-5">
            <h4 className="mb-4 text-sm font-semibold">Channel mix</h4>
            <FakeDonut />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  delta,
  muted,
}: {
  label: string;
  value: string;
  delta: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/60 p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
      <div
        className={`mt-1 text-xs font-medium ${
          muted ? "text-muted-foreground" : "text-accent"
        }`}
      >
        {delta} vs last period
      </div>
    </div>
  );
}

function FakeLineChart() {
  return (
    <svg viewBox="0 0 400 140" className="h-32 w-full">
      <defs>
        <linearGradient id="hp-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.68 0.22 295)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.68 0.22 295)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,110 L40,95 L80,100 L120,75 L160,80 L200,55 L240,60 L280,40 L320,45 L360,25 L400,30 L400,140 L0,140 Z"
        fill="url(#hp-grad)"
      />
      <path
        d="M0,110 L40,95 L80,100 L120,75 L160,80 L200,55 L240,60 L280,40 L320,45 L360,25 L400,30"
        fill="none"
        stroke="oklch(0.68 0.22 295)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FakeDonut() {
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-24 w-24 -rotate-90">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="oklch(0.27 0.03 270)" strokeWidth="6" />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="oklch(0.68 0.22 295)"
          strokeWidth="6"
          strokeDasharray="42 100"
        />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="oklch(0.85 0.18 130)"
          strokeWidth="6"
          strokeDasharray="28 100"
          strokeDashoffset="-42"
        />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="oklch(0.72 0.18 215)"
          strokeWidth="6"
          strokeDasharray="18 100"
          strokeDashoffset="-70"
        />
      </svg>
      <ul className="space-y-1.5 text-xs">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" /> Direct 42%
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" /> Email 28%
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-chart-3" /> Social 18%
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted" /> Other 12%
        </li>
      </ul>
    </div>
  );
}

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Drop in CSV or JSON",
    body: "Auto-detects columns and types. Preview before saving — no schema modeling required.",
  },
  {
    icon: Brain,
    title: "Built-in analytics engine",
    body: "Mean, median, mode, min/max, growth %, IQR-based outlier detection — all computed in real time.",
  },
  {
    icon: BarChart3,
    title: "Interactive charts",
    body: "Line, bar, pie, and doughnut visualisations powered by Chart.js. Switch columns on the fly.",
  },
  {
    icon: Lock,
    title: "Secure by default",
    body: "Row-level security ensures every dataset stays scoped to its owner. Admin role for full org view.",
  },
  {
    icon: LineChart,
    title: "Trend lines & KPIs",
    body: "First-vs-last growth, period-over-period deltas, and visual trend overlays in one click.",
  },
  {
    icon: PieChart,
    title: "Categorical breakdowns",
    body: "Top-N value counts on text columns surface your most common segments instantly.",
  },
];

function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium uppercase tracking-wider text-accent">
            Features
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
            Everything you need, nothing you don't.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            DataPulse is a focused analytics workbench — not a sprawling BI suite.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-border/60 bg-gradient-card p-6 transition-all hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section
      id="preview"
      className="relative scroll-mt-20 border-t border-border/40 bg-surface/30 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-sm font-medium uppercase tracking-wider text-accent">
              Dashboard
            </div>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
              From upload to insight in three steps.
            </h2>
            <ol className="mt-8 space-y-5">
              {[
                {
                  n: "01",
                  t: "Upload your file",
                  d: "Drag in a CSV or JSON. We parse it client-side and show a preview.",
                },
                {
                  n: "02",
                  t: "Review detected schema",
                  d: "Confirm columns and types, then save the dataset to your private workspace.",
                },
                {
                  n: "03",
                  t: "Explore live analytics",
                  d: "KPIs, charts, and outlier detection update as you switch columns and filters.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <div className="font-mono text-sm font-semibold text-primary">{s.n}</div>
                  <div>
                    <div className="font-display font-semibold">{s.t}</div>
                    <div className="text-sm text-muted-foreground">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild variant="hero" size="lg" className="mt-10">
              <Link to="/auth" search={{ mode: "signup" }}>
                Try it now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-primary opacity-15 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-elevated">
              <div className="grid grid-cols-2 gap-3">
                <KpiTile label="Mean" value="148.2" delta="σ 23.4" muted />
                <KpiTile label="Median" value="142.0" delta="IQR 38" muted />
                <KpiTile label="Min" value="84" delta="—" muted />
                <KpiTile label="Max" value="312" delta="2 outliers" />
              </div>
              <div className="mt-4 rounded-xl border border-border/60 bg-surface/60 p-4">
                <FakeLineChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="relative scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <div className="text-sm font-medium uppercase tracking-wider text-accent">
          About
        </div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
          Analytics shouldn't require a specialist.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          DataPulse was built for product, ops, and finance teams that already
          have the data — they just don't have the time to wire up a BI stack
          every time a question comes up. Drop the file in, get the answer out.
          That's it.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { v: "10K+", l: "Rows parsed in <1s" },
            { v: "8", l: "Built-in KPIs per dataset" },
            { v: "100%", l: "Your data stays yours" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl border border-border/60 bg-gradient-card p-6"
            >
              <div className="font-display text-3xl font-semibold text-primary">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  const reasons = [
    {
      icon: Zap,
      title: "Faster than Excel",
      body: "No formulas, no pivot tables. Drop a file, get KPIs in under a second — even on 10K+ rows.",
    },
    {
      icon: Brain,
      title: "Smarter than manual reports",
      body: "Outliers, growth %, and trend lines computed automatically. No more eyeballing spreadsheets.",
    },
    {
      icon: Users,
      title: "Built for business teams",
      body: "Product, ops, and finance can self-serve insights without bothering the data team.",
    },
    {
      icon: Clock,
      title: "Instant — no BI setup",
      body: "Skip the Tableau license, the Power BI training, the warehouse modeling. Just upload.",
    },
  ];
  return (
    <section className="relative scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium uppercase tracking-wider text-accent">
            Why DataPulse
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
            The fastest path from raw file to real decision.
          </h2>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl border border-border/60 bg-gradient-card p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        "We replaced a fortnightly Excel ritual with DataPulse. Our ops team now has live KPIs instead of stale snapshots.",
      name: "Priya R.",
      role: "Head of Operations, Northbeam Logistics",
    },
    {
      quote:
        "The outlier detection alone has paid for itself. We caught a billing anomaly in week one that would've taken us a quarter to spot.",
      name: "Marcus T.",
      role: "FP&A Lead, Vertex Studios",
    },
    {
      quote:
        "Finally a tool that doesn't need a six-week onboarding. I dropped a CSV in and had a dashboard before my coffee was cold.",
      name: "Aisha K.",
      role: "Product Analyst, Loop Health",
    },
  ];
  return (
    <section className="relative scroll-mt-20 border-t border-border/40 bg-surface/30 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium uppercase tracking-wider text-accent">
            Testimonials
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
            Teams making faster calls with DataPulse.
          </h2>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border/60 bg-gradient-card p-6"
            >
              <Quote className="h-6 w-6 text-primary/70" />
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 border-t border-border/50 pt-4">
                <div className="font-display text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/60 py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary shadow-glow">
                <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-semibold">DataPulse</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Self-serve analytics for any CSV or JSON dataset. Built for teams
              who need answers, not training.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "Features", href: "#features" },
              { label: "Preview", href: "#preview" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", href: "#about" },
            ]}
          />
          <div>
            <div className="text-sm font-semibold">Get in touch</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:hello@datapulse.app"
                  className="hover:text-foreground"
                >
                  hello@datapulse.app
                </a>
              </li>
              <li>Stockholm · Remote</li>
            </ul>
            <div className="mt-5 flex items-center gap-3 text-muted-foreground">
              <a href="#" aria-label="Twitter" className="hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="GitHub" className="hover:text-foreground">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DataPulse. All rights reserved.
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="hover:text-foreground">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
