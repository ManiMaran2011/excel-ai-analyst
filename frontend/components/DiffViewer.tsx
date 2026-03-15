"use client";

import { useState } from "react";

interface DiffItem {
  type: string;
  column: string;
  description: string;
  old_value: string;
  new_value: string;
}

interface CleaningPlanItem {
  issue: string;
  fix: string;
  column: string;
  type: string;
}

interface DiffViewerProps {
  diff: DiffItem[];
  cleaningPlan: CleaningPlanItem[];
  originalRowCount: number;
  cleanedRowCount: number;
  onAccept: () => void;
  onReject: () => void;
}

const TYPE_META: Record<string, { color: string; dim: string; label: string }> = {
  duplicate:  { color: "var(--red)",    dim: "var(--red-dim)",    label: "DUPE" },
  missing:    { color: "var(--amber)",  dim: "var(--amber-dim)",  label: "NULL" },
  format:     { color: "var(--cyan)",   dim: "var(--cyan-dim)",   label: "FMT" },
  whitespace: { color: "var(--purple)", dim: "var(--purple-dim)", label: "WSPACE" },
  case:       { color: "var(--green)",  dim: "var(--green-dim)",  label: "CASE" },
  other:      { color: "var(--text2)",  dim: "var(--surface2)",   label: "OTHER" },
};

export default function DiffViewer({ diff, originalRowCount, cleanedRowCount, onAccept, onReject }: DiffViewerProps) {
  const [accepted, setAccepted] = useState<Set<number>>(new Set(diff.map((_, i) => i)));

  const toggle = (i: number) => {
    setAccepted(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        {[
          { label: "ORIGINAL", value: originalRowCount, color: "var(--text2)" },
          { label: "CLEANED", value: cleanedRowCount, color: "var(--green)" },
          { label: "CHANGES", value: diff.length, color: "var(--cyan)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "6px", padding: "14px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "24px", fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text3)", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* diff list */}
      {diff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)", fontSize: "12px", letterSpacing: "0.1em" }}>
          NO ISSUES DETECTED — DATA IS CLEAN
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text3)", marginBottom: "4px" }}>
            CLICK TO TOGGLE · {accepted.size}/{diff.length} SELECTED
          </div>
          {diff.map((item, i) => {
            const meta = TYPE_META[item.type] || TYPE_META.other;
            const isOn = accepted.has(i);
            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "12px 14px",
                  background: isOn ? "var(--surface)" : "var(--bg3)",
                  border: `1px solid ${isOn ? meta.color + "40" : "var(--border)"}`,
                  borderRadius: "6px", cursor: "pointer",
                  opacity: isOn ? 1 : 0.4,
                  transition: "all 0.15s",
                }}
              >
                {/* checkbox */}
                <div style={{
                  width: 16, height: 16, borderRadius: "3px", flexShrink: 0, marginTop: "2px",
                  border: `1.5px solid ${isOn ? meta.color : "var(--border2)"}`,
                  background: isOn ? meta.dim : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isOn && <div style={{ width: 6, height: 6, borderRadius: "1px", background: meta.color }} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      fontSize: "9px", letterSpacing: "0.12em", fontWeight: 700,
                      color: meta.color, background: meta.dim,
                      padding: "2px 6px", borderRadius: "3px",
                    }}>{meta.label}</span>
                    <span style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                      {item.column}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "6px", lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "10px", fontFamily: "var(--font-mono)",
                      color: "var(--red)", background: "var(--red-dim)",
                      padding: "2px 6px", borderRadius: "3px",
                      textDecoration: "line-through",
                    }}>{item.old_value}</span>
                    <span style={{ color: "var(--text3)", fontSize: "10px" }}>→</span>
                    <span style={{
                      fontSize: "10px", fontFamily: "var(--font-mono)",
                      color: "var(--green)", background: "var(--green-dim)",
                      padding: "2px 6px", borderRadius: "3px",
                    }}>{item.new_value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button
          onClick={onAccept}
          disabled={accepted.size === 0}
          style={{
            flex: 1, padding: "11px",
            background: accepted.size > 0 ? "var(--green)" : "var(--surface2)",
            border: "none", borderRadius: "6px",
            color: accepted.size > 0 ? "var(--bg)" : "var(--text3)",
            fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: accepted.size > 0 ? "pointer" : "not-allowed",
            fontFamily: "var(--font-mono)", transition: "all 0.2s",
          }}
        >
          Apply {accepted.size} change{accepted.size !== 1 ? "s" : ""}
        </button>
        <button
          onClick={onReject}
          style={{
            padding: "11px 20px",
            background: "transparent",
            border: "1px solid var(--border2)", borderRadius: "6px",
            color: "var(--text3)", fontSize: "11px",
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "var(--font-mono)",
            transition: "all 0.2s",
          }}
        >
          Discard
        </button>
      </div>
    </div>
  );
}