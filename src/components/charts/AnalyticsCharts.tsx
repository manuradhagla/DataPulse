import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Bar, Line, Doughnut, Pie, Scatter, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
);

const PALETTE = [
  "oklch(0.68 0.22 295)",
  "oklch(0.85 0.18 130)",
  "oklch(0.72 0.18 215)",
  "oklch(0.78 0.18 35)",
  "oklch(0.65 0.20 340)",
  "oklch(0.78 0.15 60)",
  "oklch(0.6 0.15 180)",
  "oklch(0.7 0.18 90)",
];

const baseOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "oklch(0.68 0.025 260)", font: { family: "Inter, sans-serif" } },
    },
    tooltip: {
      backgroundColor: "oklch(0.21 0.025 270)",
      borderColor: "oklch(0.30 0.025 270)",
      borderWidth: 1,
      titleColor: "oklch(0.96 0.01 250)",
      bodyColor: "oklch(0.96 0.01 250)",
      padding: 12,
    },
  },
  scales: {
    x: {
      ticks: { color: "oklch(0.68 0.025 260)" },
      grid: { color: "oklch(0.30 0.025 270 / 0.3)" },
    },
    y: {
      ticks: { color: "oklch(0.68 0.025 260)" },
      grid: { color: "oklch(0.30 0.025 270 / 0.3)" },
    },
  },
};

const noScaleOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: baseOptions.plugins,
};

const radarOptions: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: baseOptions.plugins,
  scales: {
    r: {
      angleLines: { color: "oklch(0.30 0.025 270 / 0.4)" },
      grid: { color: "oklch(0.30 0.025 270 / 0.4)" },
      pointLabels: { color: "oklch(0.68 0.025 260)" },
      ticks: { color: "oklch(0.68 0.025 260)", backdropColor: "transparent" },
    },
  },
};

export function LineTrend({ labels, values, label }: { labels: string[]; values: number[]; label: string }) {
  return (
    <div className="h-72">
      <Line
        options={baseOptions as ChartOptions<"line">}
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              borderColor: PALETTE[0],
              backgroundColor: "oklch(0.68 0.22 295 / 0.18)",
              fill: true,
              tension: 0.35,
              pointRadius: 2,
              pointHoverRadius: 5,
              borderWidth: 2.5,
            },
          ],
        }}
      />
    </div>
  );
}

// Smoothed area chart (no points) — useful for high-density series
export function AreaTrend({ labels, values, label }: { labels: string[]; values: number[]; label: string }) {
  return (
    <div className="h-72">
      <Line
        options={baseOptions as ChartOptions<"line">}
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              borderColor: PALETTE[2],
              backgroundColor: "oklch(0.72 0.18 215 / 0.28)",
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  );
}

export function BarBreakdown({
  labels,
  values,
  label,
}: {
  labels: string[];
  values: number[];
  label: string;
}) {
  return (
    <div className="h-72">
      <Bar
        options={baseOptions as ChartOptions<"bar">}
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        }}
      />
    </div>
  );
}

// Stacked bar — multiple datasets summed per category
export function StackedBars({
  labels,
  datasets,
}: {
  labels: string[];
  datasets: { label: string; values: number[] }[];
}) {
  const stackedOpts: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: baseOptions.plugins,
    scales: {
      x: {
        stacked: true,
        ticks: { color: "oklch(0.68 0.025 260)" },
        grid: { color: "oklch(0.30 0.025 270 / 0.3)" },
      },
      y: {
        stacked: true,
        ticks: { color: "oklch(0.68 0.025 260)" },
        grid: { color: "oklch(0.30 0.025 270 / 0.3)" },
      },
    },
  };
  return (
    <div className="h-72">
      <Bar
        options={stackedOpts}
        data={{
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label,
            data: d.values,
            backgroundColor: PALETTE[i % PALETTE.length],
            borderRadius: 4,
            stack: "total",
          })),
        }}
      />
    </div>
  );
}

export function DoughnutBreakdown({ labels, values }: { labels: string[]; values: number[] }) {
  return (
    <div className="h-72">
      <Doughnut
        options={noScaleOptions as ChartOptions<"doughnut">}
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
              borderColor: "oklch(0.16 0.02 270)",
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  );
}

export function PieBreakdown({ labels, values }: { labels: string[]; values: number[] }) {
  return (
    <div className="h-72">
      <Pie
        options={noScaleOptions as ChartOptions<"pie">}
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
              borderColor: "oklch(0.16 0.02 270)",
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  );
}

// Scatter plot — correlation between two numeric columns
export function ScatterPlot({
  points,
  xLabel,
  yLabel,
}: {
  points: { x: number; y: number }[];
  xLabel: string;
  yLabel: string;
}) {
  const opts: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: baseOptions.plugins,
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: xLabel, color: "oklch(0.68 0.025 260)" },
        ticks: { color: "oklch(0.68 0.025 260)" },
        grid: { color: "oklch(0.30 0.025 270 / 0.3)" },
      },
      y: {
        type: "linear",
        title: { display: true, text: yLabel, color: "oklch(0.68 0.025 260)" },
        ticks: { color: "oklch(0.68 0.025 260)" },
        grid: { color: "oklch(0.30 0.025 270 / 0.3)" },
      },
    },
  };
  return (
    <div className="h-72">
      <Scatter
        options={opts}
        data={{
          datasets: [
            {
              label: `${xLabel} × ${yLabel}`,
              data: points,
              backgroundColor: "oklch(0.68 0.22 295 / 0.65)",
              borderColor: PALETTE[0],
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        }}
      />
    </div>
  );
}

// Radar — multi-metric comparison across a few categories
export function RadarChart({
  labels,
  values,
  metricLabel,
}: {
  labels: string[];
  values: number[];
  metricLabel: string;
}) {
  return (
    <div className="h-72">
      <Radar
        options={radarOptions}
        data={{
          labels,
          datasets: [
            {
              label: metricLabel,
              data: values,
              backgroundColor: "oklch(0.85 0.18 130 / 0.22)",
              borderColor: PALETTE[1],
              borderWidth: 2,
              pointBackgroundColor: PALETTE[1],
            },
          ],
        }}
      />
    </div>
  );
}
