import FileUploader from "@/components/FileUploader";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* animated grid bg */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        animation: "grid-move 8s linear infinite",
      }} />

      {/* scanline effect */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, var(--cyan), transparent)",
        opacity: 0.4, zIndex: 1,
        animation: "scanline 6s linear infinite",
        pointerEvents: "none",
      }} />

      {/* corner decorations */}
      {["top-left","top-right","bottom-left","bottom-right"].map((pos) => {
        const isTop = pos.includes("top");
        const isLeft = pos.includes("left");
        return (
          <div key={pos} style={{
            position: "fixed",
            top: isTop ? "24px" : "auto",
            bottom: !isTop ? "24px" : "auto",
            left: isLeft ? "24px" : "auto",
            right: !isLeft ? "24px" : "auto",
            width: "40px", height: "40px",
            borderTop: isTop ? `1px solid var(--cyan)` : "none",
            borderBottom: !isTop ? `1px solid var(--cyan)` : "none",
            borderLeft: isLeft ? `1px solid var(--cyan)` : "none",
            borderRight: !isLeft ? `1px solid var(--cyan)` : "none",
            opacity: 0.4, zIndex: 1,
          }} />
        );
      })}

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "560px", animation: "fadeUp 0.6s ease both" }}>

        {/* header */}
        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--cyan-dim)", border: "1px solid var(--border2)",
            borderRadius: "4px", padding: "4px 12px", marginBottom: "1.5rem",
            fontSize: "10px", letterSpacing: "0.15em", color: "var(--cyan)",
            textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse-glow 2s ease infinite" }} />
            System online
          </div>

          <h1 style={{
            fontFamily: "var(--font-head)",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #E2EAF4 0%, var(--cyan) 60%, var(--purple) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Excel AI<br />Analyst
          </h1>

          <p style={{ color: "var(--text2)", fontSize: "13px", letterSpacing: "0.05em", lineHeight: 1.8 }}>
            Upload a spreadsheet. Talk to your data.<br />
            Clean, analyze, and export in seconds.
          </p>
        </div>

        <FileUploader />

        {/* feature tags */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "2rem" }}>
          {["NL queries", "AI cleaning", "Auto charts", "Insights", "Formula explainer"].map((f) => (
            <span key={f} style={{
              fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--text3)", border: "1px solid var(--border)",
              borderRadius: "3px", padding: "3px 8px",
            }}>{f}</span>
          ))}
        </div>
      </div>
    </main>
  );
}