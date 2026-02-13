"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// UniPod theme
const UNIPOD_BLUE = "#0066cc";
const UNIPOD_BLUE_LIGHT = "#e6f0fa";
const UNIPOD_YELLOW = "#facc15";
const UNIPOD_GREEN = "#00c853";
const GREY = "#6b7280";
const LIGHT_GREY = "#e5e7eb";

type ActivityDay = { date: string; label: string; count: number; fullMark?: number };
type SubmissionStatusItem = { name: string; value: number; color: string };

export function ActivityBarChart({ data }: { data: ActivityDay[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: GREY }}
            axisLine={{ stroke: LIGHT_GREY }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: GREY }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${LIGHT_GREY}`,
              backgroundColor: "white",
            }}
            formatter={(value: number | undefined) => [value ?? 0, "Submissions"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar
            dataKey="count"
            fill={UNIPOD_BLUE}
            radius={[4, 4, 0, 0]}
            name="Submissions"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubmissionDonutChart({ data }: { data: SubmissionStatusItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${LIGHT_GREY}`,
              backgroundColor: "white",
            }}
            formatter={(value: number | undefined, name?: string) => [
              `${value ?? 0} (${total ? Math.round(((value ?? 0) / total) * 100) : 0}%)`,
              name ?? "",
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: GREY, fontSize: 12 }}>
                {value} – {(entry?.payload as { value?: number })?.value ?? 0}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
