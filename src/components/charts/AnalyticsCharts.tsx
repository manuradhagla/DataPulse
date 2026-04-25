import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
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
