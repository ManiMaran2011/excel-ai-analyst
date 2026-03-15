"use client";

import { useState } from "react";
import apiClient from "@/lib/apiClient";

interface FormulaExplainerProps {
  sessionId: string;
  columns: string[];
}

const EXAMPLES = [
  "=SUM(B2:B100)",
  "=VLOOKUP(A2,D:E,2,0)",
  "=IF(C2>1000,\"High\",\"Low\")",
  "=SUMIF(B2:B50,\"North\",C2:C50)",
];

export default function FormulaExplainer({ sessionId, columns }: FormulaExplainerProps) {
  const [formula, setFormula] = useState("");
  const [cellRef, setCellRef] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = async () => {
    if (!formula.trim()) return;
    setLoading(true); setExplanation(null); setError(null);
    try {
      const { data } = await apiClient.post("/formula/explain", {
        session_id: sessionId, formula: formula.trim(), cell_ref: cellRef.trim() || "Unknown",
      });
      setExplanation(data.explanation);
    } catch {
      setError("Could not explain formula.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    background: "var(--bg3)", border: "1px solid var(--border2)",
    borderRadius: "6px", fontSize: "12px",
    color: "var(--text)", fontFamily: "var(--font-mono)",
    outline: "none", transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase",
    color: "var(--text3)", display: "block", marginBottom: "6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <div>
        <label style={labelStyle}>Formula</label>
        <input
          value={formula}
          onChange={e => setFormula(e.target.value)}
          onKeyDown={e => e.key === "Enter" && explain()}
          placeholder="=SUMIF(B2:B100, &quot;North&quot;, C2:C100)"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = "var(--cyan)"}
          onBlur={e => e.target.style.borderColor = "var(--border2)"}
        />
      </div>

      <div>
        <label style={labelStyle}>Cell ref <span style={{ opacity: 0.5 }}>(optional)</span></label>
        <input
          value={cellRef}
          onChange={e => setCellRef(e.target.value)}
          placeholder="e.g. F4"
          style={{ ...inputStyle, width: "120px" }}
          onFocus={e => e.target.style.borderColor = "var(--cyan)"}
          onBlur={e => e.target.style.borderColor = "var(--border2)"}
        />
      </div>

      <button
        onClick={explain}
        disabled={!formula.trim() || loading}
        style={{
          padding: "11px", background: formula.trim() && !loading ? "var(--cyan)" : "var(--surface2)",
          border: "none", borderRadius: "6px",
          color: formula.trim() && !loading ? "var(--bg)" : "var(--text3)",
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: formula.trim() && !loading ? "pointer" : "not-allowed",
          fontFamily: "var(--font-mono)", transition: "all 0.2s",
        }}
      >
        {loading ? "Analyzing..." : "Explain formula"}
      </button>

      {/* column reference */}
      {columns.length > 0 && (
        <div style={{
          padding: "12px 14px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "6px",
        }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text3)", marginBottom: "8px" }}>
            COLUMN MAP
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {columns.slice(0, 8).map((col, i) => (
              <span key={col} style={{
                fontSize: "10px", fontFamily: "var(--font-mono)",
                color: "var(--cyan)", background: "var(--cyan-dim)",
                padding: "2px 7px", borderRadius: "3px",
              }}>
                {String.fromCharCode(65 + i)}={col}
              </span>
            ))}
            {columns.length > 8 && (
              <span style={{ fontSize: "10px", color: "var(--text3)" }}>+{columns.length - 8}</span>
            )}
          </div>
        </div>
      )}

      {/* result */}
      {explanation && (
        <div style={{
          padding: "16px",
          background: "var(--cyan-dim)", border: "1px solid var(--border2)",
          borderRadius: "6px", animation: "fadeUp 0.3s ease",
        }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--cyan)", marginBottom: "8px" }}>
            EXPLANATION
          </div>
          <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.8, marginBottom: "10px" }}>
            {explanation}
          </p>
          <div style={{
            fontSize: "11px", fontFamily: "var(--font-mono)",
            color: "var(--cyan)", opacity: 0.7,
            borderTop: "1px solid var(--border)", paddingTop: "8px",
          }}>
            {formula}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 14px", background: "var(--red-dim)",
          border: "1px solid rgba(248,113,113,0.3)", borderRadius: "6px",
          fontSize: "11px", color: "var(--red)", fontFamily: "var(--font-mono)",
        }}>
          ERR: {error}
        </div>
      )}

      {/* examples */}
      {!explanation && !loading && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text3)", marginBottom: "8px" }}>
            EXAMPLES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {EXAMPLES.map(f => (
              <button key={f} onClick={() => setFormula(f)} style={{
                textAlign: "left", padding: "8px 12px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "5px", fontSize: "11px",
                fontFamily: "var(--font-mono)", color: "var(--text3)",
                cursor: "pointer", transition: "all 0.15s",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--cyan)";
                  e.currentTarget.style.color = "var(--cyan)";
                  e.currentTarget.style.background = "var(--cyan-dim)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text3)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}