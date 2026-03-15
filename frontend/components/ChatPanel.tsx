"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/apiClient";
import DataTable from "./DataTable";
import ChartRenderer from "./ChartRenderer";

interface Message {
  role: "user" | "assistant";
  content: string;
  result?: {
    type: "dataframe" | "scalar" | "error";
    columns?: string[];
    rows?: Record<string, unknown>[];
    value?: string;
    message?: string;
  };
}

interface ChatPanelProps {
  sessionId: string;
  fileName: string;
  columns: string[];
}

export default function ChatPanel({ sessionId, fileName, columns }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get(`/chat/history/${sessionId}`).then(({ data }) => {
      if (data.history?.length) {
        setMessages(data.history.map((m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role, content: m.content,
        })));
      } else {
        setMessages([{
          role: "assistant",
          content: `SYSTEM READY. File indexed: ${columns.length} columns detected. ${columns.slice(0, 4).join(", ")}${columns.length > 4 ? ` +${columns.length - 4} more` : ""}. Awaiting query.`,
        }]);
      }
    });
  }, [sessionId, columns]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/chat", { session_id: sessionId, message: input });
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, result: data.result }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "ERROR: Could not process query. Retry." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Show first 10 rows",
    "How many rows total?",
    "Summary statistics",
    "Show unique values",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg2)" }}>

      {/* header bar */}
      <div style={{
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "12px",
        background: "var(--surface)",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--green)",
          boxShadow: "0 0 8px var(--green)",
          animation: "pulse-glow 2s ease infinite",
        }} />
        <span style={{ fontFamily: "var(--font-head)", fontSize: "13px", fontWeight: 600, color: "var(--text)", letterSpacing: "0.05em" }}>
          {fileName}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text3)", letterSpacing: "0.1em", marginLeft: "auto" }}>
          {columns.length} COLUMNS · SESSION ACTIVE
        </span>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            animation: "fadeUp 0.3s ease both",
          }}>
            <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* role label */}
              <div style={{
                fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase",
                color: msg.role === "user" ? "var(--cyan)" : "var(--text3)",
                textAlign: msg.role === "user" ? "right" : "left",
                paddingLeft: msg.role === "assistant" ? "2px" : 0,
              }}>
                {msg.role === "user" ? "YOU" : "AI ANALYST"}
              </div>

              {/* bubble */}
              <div style={{
                padding: "10px 14px",
                background: msg.role === "user" ? "var(--cyan-dim)" : "var(--surface)",
                border: `1px solid ${msg.role === "user" ? "var(--border2)" : "var(--border)"}`,
                borderRadius: msg.role === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                fontSize: "12px", lineHeight: 1.7,
                color: msg.role === "user" ? "var(--cyan)" : "var(--text2)",
                fontFamily: "var(--font-mono)",
              }}>
                {msg.content}
              </div>

              {/* dataframe result */}
              {msg.result?.type === "dataframe" && msg.result.columns && msg.result.rows && (
                <div style={{
                  border: "1px solid var(--border)",
                  borderRadius: "6px", overflow: "hidden",
                  background: "var(--surface)",
                }}>
                  <DataTable columns={msg.result.columns} rows={msg.result.rows} maxRows={50} />
                  {msg.result.rows.length > 1 && (
                    <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
                      <ChartRenderer columns={msg.result.columns} rows={msg.result.rows} />
                    </div>
                  )}
                </div>
              )}

              {/* scalar */}
              {msg.result?.type === "scalar" && (
                <div style={{
                  padding: "10px 14px",
                  background: "var(--green-dim)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  borderRadius: "6px",
                  fontSize: "13px", fontWeight: 700,
                  color: "var(--green)", fontFamily: "var(--font-mono)",
                }}>
                  {msg.result.value}
                </div>
              )}

              {/* error */}
              {msg.result?.type === "error" && (
                <div style={{
                  padding: "10px 14px",
                  background: "var(--red-dim)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  borderRadius: "6px",
                  fontSize: "11px", color: "var(--red)",
                  fontFamily: "var(--font-mono)",
                }}>
                  ERR: {msg.result.message}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* typing indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", animation: "fadeUp 0.3s ease" }}>
            <div style={{
              padding: "12px 16px",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "8px 8px 8px 2px",
              display: "flex", gap: "5px", alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "var(--cyan)",
                  animation: `blink 1.2s ease infinite`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.4,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* suggestions */}
      {messages.length <= 1 && (
        <div style={{
          padding: "8px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: "6px", flexWrap: "wrap",
          background: "var(--bg2)",
        }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} style={{
              fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "4px 10px",
              background: "transparent",
              border: "1px solid var(--border2)",
              borderRadius: "3px", color: "var(--text3)",
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "var(--font-mono)",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--cyan)";
                e.currentTarget.style.borderColor = "var(--cyan)";
                e.currentTarget.style.background = "var(--cyan-dim)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--text3)";
                e.currentTarget.style.borderColor = "var(--border2)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex", gap: "10px", alignItems: "flex-end",
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Query your data..."
          rows={1}
          style={{
            flex: 1, resize: "none",
            background: "var(--bg3)",
            border: "1px solid var(--border2)",
            borderRadius: "6px",
            padding: "10px 14px",
            fontSize: "12px", color: "var(--text)",
            fontFamily: "var(--font-mono)",
            outline: "none",
            transition: "border-color 0.2s",
            lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = "var(--cyan)"}
          onBlur={e => e.target.style.borderColor = "var(--border2)"}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            padding: "10px 18px",
            background: input.trim() && !loading ? "var(--cyan)" : "var(--surface2)",
            border: "none", borderRadius: "6px",
            color: input.trim() && !loading ? "var(--bg)" : "var(--text3)",
            fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            fontFamily: "var(--font-mono)",
            transition: "all 0.2s",
          }}
        >
          RUN
        </button>
      </div>
    </div>
  );
}