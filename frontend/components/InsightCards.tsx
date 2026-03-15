"use client";

interface Insight {
  title: string;
  description: string;
  type: "trend" | "anomaly" | "stat" | "distribution";
  importance: "high" | "medium" | "low";
}

const TYPE_META = {
  trend:        { icon: "↗", color: "var(--cyan)",   dim: "var(--cyan-dim)",   label: "TREND" },
  anomaly:      { icon: "!",  color: "var(--red)",    dim: "var(--red-dim)",    label: "ANOMALY" },
  stat:         { icon: "#",  color: "var(--purple)", dim: "var(--purple-dim)", label: "STAT" },
  distribution: { icon: "~",  color: "var(--amber)",  dim: "var(--amber-dim)",  label: "DIST" },
};

const IMPORTANCE_COLOR = { high: "var(--red)", medium: "var(--amber)", low: "var(--text3)" };

export default function InsightCards({ insights, loading }: { insights: Insight[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: "72px", background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: "6px",
            animation: "flicker 3s ease infinite",
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>
    );
  }

  if (!insights.length) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)", fontSize: "11px", letterSpacing: "0.1em" }}>
        NO INSIGHTS YET — CLICK GENERATE
      </div>
    );
  }

  const sorted = [...insights].sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 };
    return o[a.importance] - o[b.importance];
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {sorted.map((insight, i) => {
        const meta = TYPE_META[insight.type] || TYPE_META.stat;
        return (
          <div key={i} style={{
            padding: "14px 16px",
            background: "var(--surface)",
            border: `1px solid ${meta.color}30`,
            borderLeft: `3px solid ${meta.color}`,
            borderRadius: "6px",
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${i * 0.06}s`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "4px",
                  background: meta.dim,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", color: meta.color, fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-head)" }}>
                      {insight.title}
                    </span>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: IMPORTANCE_COLOR[insight.importance],
                      flexShrink: 0,
                    }} />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text2)", lineHeight: 1.6 }}>
                    {insight.description}
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: "9px", letterSpacing: "0.12em", fontWeight: 700,
                color: meta.color, background: meta.dim,
                padding: "3px 7px", borderRadius: "3px", flexShrink: 0,
                fontFamily: "var(--font-mono)",
              }}>
                {meta.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}