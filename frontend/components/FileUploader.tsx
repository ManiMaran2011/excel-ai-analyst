"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { parseExcelFile } from "@/lib/sheetParser";

export default function FileUploader() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setProgress("Parsing file...");

    try {
      await parseExcelFile(file);
      setProgress("Uploading to server...");

      const formData = new FormData();
      formData.append("file", file);

      const { data } = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProgress("Initializing session...");
      router.push(`/chat/${data.session_id}`);
    } catch {
      setError("Upload failed. Please try again.");
      setLoading(false);
      setProgress("");
    }
  }, [router]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          position: "relative",
          border: `1px solid ${dragging ? "var(--cyan)" : "var(--border2)"}`,
          borderRadius: "8px",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--cyan-dim)" : "var(--surface)",
          transition: "all 0.2s ease",
          boxShadow: dragging ? "0 0 30px var(--cyan-glow), inset 0 0 30px var(--cyan-dim)" : "none",
          animation: loading ? "pulse-glow 1.5s ease infinite" : "none",
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        />

        {/* icon */}
        <div style={{
          width: 56, height: 56, margin: "0 auto 1.25rem",
          border: "1px solid var(--border2)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface2)",
          fontSize: "24px",
        }}>
          {loading ? "⟳" : "⬡"}
        </div>

        {loading ? (
          <div>
            <p style={{ color: "var(--cyan)", fontSize: "13px", letterSpacing: "0.1em", marginBottom: "8px" }}>
              {progress}
            </p>
            <div style={{ height: "2px", background: "var(--border)", borderRadius: "1px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(90deg, var(--cyan), var(--purple))",
                borderRadius: "1px",
                animation: "scanline 1.2s ease-in-out infinite",
                width: "40%",
              }} />
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-head)", fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
              Drop your file here
            </p>
            <p style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em" }}>
              .XLSX · .XLS · .CSV
            </p>
          </>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: "12px", padding: "10px 14px",
          background: "var(--red-dim)", border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: "6px", fontSize: "12px", color: "var(--red)",
          letterSpacing: "0.05em",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}