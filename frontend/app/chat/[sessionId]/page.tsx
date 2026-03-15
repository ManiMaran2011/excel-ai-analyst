"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import ChatPanel from "@/components/ChatPanel";
import DiffViewer from "@/components/DiffViewer";
import ExportButton from "@/components/ExportButton";
import InsightCards from "@/components/InsightCards";
import FormulaExplainer from "@/components/FormulaExplainer";

interface SessionInfo { file_name: string; columns: string[]; row_count: number; }
interface DiffItem { type: string; column: string; description: string; old_value: string; new_value: string; }
interface CleaningPlanItem { issue: string; fix: string; column: string; type: string; }
interface CleanResult { diff: DiffItem[]; cleaning_plan: CleaningPlanItem[]; original_row_count: number; cleaned_row_count: number; changes_count: number; }
interface Insight { title: string; description: string; type: "trend" | "anomaly" | "stat" | "distribution"; importance: "high" | "medium" | "low"; }
type Tab = "chat" | "clean" | "insights" | "formula";

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: "chat",    label: "Chat",     icon: ">" },
  { key: "clean",   label: "Clean",    icon: "◈" },
  { key: "insights",label: "Insights", icon: "◉" },
  { key: "formula", label: "Formula",  icon: "ƒ" },
];

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanResult | null>(null);
  const [cleanAccepted, setCleanAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    apiClient.get(`/session/${sessionId}`)
      .then(({ data }) => setSession(data))
      .catch(() => setError("Session not found."));
  }, [sessionId]);

  const handleClean = async () => {
    setCleaning(true); setCleanResult(null); setCleanAccepted(false);
    setActiveTab("clean");
    try {
      const { data } = await apiClient.post("/clean", { session_id: sessionId });
      setCleanResult(data);
    } catch { alert("Cleaning failed."); }
    finally { setCleaning(false); }
  };

  const handleInsights = async () => {
    setInsightsLoading(true); setInsights([]); setActiveTab("insights");
    try {
      const { data } = await apiClient.post("/insights", { session_id: sessionId });
      setInsights(data.insights);
    } catch { alert("Could not generate insights."); }
    finally { setInsightsLoading(false); }
  };

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--red)", marginBottom: "16px", fontSize: "13px" }}>{error}</p>
        <button onClick={() => router.push("/")} style={{
          padding: "8px 16px", background: "var(--cyan)", border: "none",
          borderRadius: "5px", color: "var(--bg)", fontSize: "11px",
          fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
        }}>BACK</button>
      </div>
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.15em", animation: "flicker 2s ease infinite" }}>
        LOADING SESSION...
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* sidebar */}
      <div style={{
        width: "220px", flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--bg2)",
        display: "flex", flexDirection: "column",
        padding: "0",
      }}>

        {/* logo */}
        <div style={{
          padding: "18px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            fontFamily: "var(--font-head)", fontSize: "15px", fontWeight: 800,
            color: "var(--cyan)", letterSpacing: "-0.01em", marginBottom: "2px",
          }}>
            EXCEL AI
          </div>
          <div style={{ fontSize: "9px", color: "var(--text3)", letterSpacing: "0.15em" }}>
            ANALYST v1.0
          </div>
        </div>

        {/* file info */}
        <div style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text3)", marginBottom: "6px" }}>
            ACTIVE FILE
          </div>
          <div style={{
            fontSize: "11px", color: "var(--text)", fontFamily: "var(--font-mono)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            marginBottom: "4px",
          }}>
            {session.file_name}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text3)" }}>
            {session.row_count} rows · {session.columns.length} cols
          </div>
          {/* status dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <span style={{ fontSize: "9px", color: "var(--green)", letterSpacing: "0.1em" }}>SESSION ACTIVE</span>
          </div>
        </div>

        {/* nav */}
        <div style={{ padding: "10px 8px", flex: 1 }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text3)", padding: "0 8px", marginBottom: "6px" }}>
            MODULES
          </div>
          {NAV_ITEMS.map(({ key, label, icon }) => {
            const isActive = activeTab === key;
            const badge = key === "clean" && cleanResult ? cleanResult.changes_count
              : key === "insights" && insights.length ? insights.length : null;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 10px", borderRadius: "5px",
                  background: isActive ? "var(--cyan-dim)" : "transparent",
                  border: isActive ? "1px solid var(--border2)" : "1px solid transparent",
                  color: isActive ? "var(--cyan)" : "var(--text3)",
                  fontSize: "11px", fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em", cursor: "pointer",
                  marginBottom: "2px", transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "var(--text2)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "var(--text3)"; }}
              >
                <span style={{ fontSize: "14px", width: "16px", textAlign: "center", opacity: 0.8 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{
                    fontSize: "9px", padding: "1px 5px", borderRadius: "3px",
                    background: key === "insights" ? "var(--purple-dim)" : "var(--green-dim)",
                    color: key === "insights" ? "var(--purple)" : "var(--green)",
                    fontWeight: 700,
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* action buttons */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <button
            onClick={handleClean}
            disabled={cleaning}
            style={{
              padding: "9px 10px",
              background: "var(--cyan-dim)", border: "1px solid var(--border2)",
              borderRadius: "5px", color: "var(--cyan)",
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: cleaning ? "not-allowed" : "pointer",
              fontFamily: "var(--font-mono)", opacity: cleaning ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {cleaning ? "Scanning..." : "Run cleaning"}
          </button>
          <button
            onClick={handleInsights}
            disabled={insightsLoading}
            style={{
              padding: "9px 10px",
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: "5px", color: "var(--text3)",
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: insightsLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-mono)", opacity: insightsLoading ? 0.5 : 1,
              transition: "all 0.15s",
            }}
          >
            {insightsLoading ? "Analyzing..." : "Gen insights"}
          </button>
          {cleanAccepted && <ExportButton sessionId={sessionId} />}
        </div>

        {/* bottom */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%", padding: "7px",
              background: "transparent", border: "none",
              color: "var(--text3)", fontSize: "10px",
              letterSpacing: "0.1em", cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            ← New file
          </button>
        </div>
      </div>

      {/* main panel */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {activeTab === "chat" && (
          <ChatPanel sessionId={sessionId} fileName={session.file_name} columns={session.columns} />
        )}

        {activeTab === "clean" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-head)", fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>
                    Data cleaning
                  </h2>
                  <p style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em" }}>
                    AI-powered issue detection and repair
                  </p>
                </div>
                {cleanAccepted && <ExportButton sessionId={sessionId} />}
              </div>

              {!cleanResult && !cleaning && (
                <div style={{
                  textAlign: "center", padding: "4rem 2rem",
                  border: "1px dashed var(--border)", borderRadius: "8px",
                  color: "var(--text3)", fontSize: "11px", letterSpacing: "0.1em",
                }}>
                  CLICK "RUN CLEANING" TO SCAN YOUR DATA
                </div>
              )}

              {cleaning && (
                <div style={{
                  textAlign: "center", padding: "4rem 2rem",
                  border: "1px solid var(--border)", borderRadius: "8px",
                }}>
                  <div style={{ fontSize: "11px", color: "var(--cyan)", letterSpacing: "0.15em", animation: "flicker 2s ease infinite" }}>
                    SCANNING FOR ISSUES...
                  </div>
                </div>
              )}

              {cleanResult && !cleanAccepted && (
                <DiffViewer
                  diff={cleanResult.diff}
                  cleaningPlan={cleanResult.cleaning_plan}
                  originalRowCount={cleanResult.original_row_count}
                  cleanedRowCount={cleanResult.cleaned_row_count}
                  onAccept={() => setCleanAccepted(true)}
                  onReject={() => setCleanResult(null)}
                />
              )}

              {cleanAccepted && (
                <div style={{
                  textAlign: "center", padding: "3rem",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: "8px", background: "var(--green-dim)",
                  animation: "fadeUp 0.4s ease",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>◈</div>
                  <p style={{ fontFamily: "var(--font-head)", fontSize: "16px", fontWeight: 700, color: "var(--green)", marginBottom: "6px" }}>
                    Cleaning applied
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em", marginBottom: "20px" }}>
                    File is ready to export
                  </p>
                  <ExportButton sessionId={sessionId} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-head)", fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>
                    AI insights
                  </h2>
                  <p style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em" }}>
                    Patterns and anomalies in your data
                  </p>
                </div>
                <button
                  onClick={handleInsights}
                  disabled={insightsLoading}
                  style={{
                    padding: "7px 12px", background: "transparent",
                    border: "1px solid var(--border2)", borderRadius: "5px",
                    color: "var(--text3)", fontSize: "10px",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: "var(--font-mono)",
                  }}
                >
                  Refresh
                </button>
              </div>
              <InsightCards insights={insights} loading={insightsLoading} />
            </div>
          </div>
        )}

        {activeTab === "formula" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontFamily: "var(--font-head)", fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>
                  Formula explainer
                </h2>
                <p style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em" }}>
                  Paste any Excel formula — get plain English back
                </p>
              </div>
              <FormulaExplainer sessionId={sessionId} columns={session.columns} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}