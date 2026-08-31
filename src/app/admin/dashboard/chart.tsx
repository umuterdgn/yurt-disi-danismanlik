// app/admin/dashboard/chart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartProps {
  data: {
    country: string;
    count: number;
    color: string;
  }[];
}

export default function CountryChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="country" tick={{ fill: "#6b7280" }} />
        <YAxis tick={{ fill: "#6b7280" }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#ffffff", 
            border: "1px solid #e5e7eb",
            borderRadius: "8px"
          }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}