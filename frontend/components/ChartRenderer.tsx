"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import apiClient from "@/lib/apiClient";

interface ChartRendererProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

interface ChartSuggestion {
  chart_type: "bar" | "line" | "pie" | "scatter" | "none";
  x_col: string;
  y_col: string;
  title: string;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export default function ChartRenderer({ columns, rows }: ChartRendererProps) {
  const [suggestion, setSuggestion] = useState<ChartSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!columns.length || !rows.length) return;

    setLoading(true);
    apiClient.post("/chart-suggest", { columns, rows: rows.slice(0, 10) })
      .then(({ data }) => setSuggestion(data))
      .catch(() => setSuggestion({ chart_type: "none", x_col: "", y_col: "", title: "" }))
      .finally(() => setLoading(false));
  }, [columns, rows]);

  if (loading) {
    return (
      <div className="h-48 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
        <p className="text-xs text-gray-400">Picking best chart...</p>
      </div>
    );
  }

  if (!suggestion || suggestion.chart_type === "none") return null;

  const { chart_type, x_col, y_col, title } = suggestion;

  // prepare data — recharts needs clean numbers
  const data = rows.map((row) => ({
    ...row,
    [y_col]: Number(row[y_col]) || 0,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {title && (
        <p className="text-sm font-medium text-gray-700">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        {chart_type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={x_col} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey={y_col} fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart_type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={x_col} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={y_col}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : chart_type === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={y_col}
              nameKey={x_col}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : chart_type === "scatter" ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={x_col} tick={{ fontSize: 11 }} />
            <YAxis dataKey={y_col} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Scatter data={data} fill="#3B82F6" />
          </ScatterChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={x_col} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={y_col} fill="#3B82F6" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}