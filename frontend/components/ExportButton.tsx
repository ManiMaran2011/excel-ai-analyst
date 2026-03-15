"use client";

import { useState } from "react";

export default function ExportButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "xlsx" | "csv") => {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${base}/export/${sessionId}?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cleaned_export.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Export failed.");
    } finally {
      setLoading(false);
    }
  };

  const btnStyle = (primary: boolean): React.CSSProperties => ({
    padding: "8px 14px", fontSize: "10px", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    fontFamily: "var(--font-mono)",
    border: primary ? "none" : "1px solid var(--border2)",
    borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.5 : 1,
    transition: "all 0.2s",
    background: primary ? "var(--green)" : "transparent",
    color: primary ? "var(--bg)" : "var(--text3)",
  });

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button onClick={() => handleExport("xlsx")} disabled={loading} style={btnStyle(true)}>
        {loading ? "..." : "Export .xlsx"}
      </button>
      <button onClick={() => handleExport("csv")} disabled={loading} style={btnStyle(false)}>
        Export .csv
      </button>
    </div>
  );
}