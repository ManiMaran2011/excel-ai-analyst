"use client";

interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  maxRows?: number;
}

export default function DataTable({ columns, rows, maxRows = 100 }: DataTableProps) {
  const displayRows = rows.slice(0, maxRows);
  if (!columns.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{
                padding: "8px 12px", textAlign: "left",
                background: "var(--surface2)",
                color: "var(--cyan)", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                borderBottom: "1px solid var(--border2)",
                whiteSpace: "nowrap", fontSize: "10px",
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} style={{
              background: i % 2 === 0 ? "transparent" : "rgba(56,189,248,0.02)",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--cyan-dim)")}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(56,189,248,0.02)")}
            >
              {columns.map((col) => (
                <td key={col} style={{
                  padding: "7px 12px",
                  color: row[col] === null || row[col] === undefined ? "var(--text3)" : "var(--text2)",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                  fontStyle: row[col] === null ? "italic" : "normal",
                  fontSize: "11px",
                }}>
                  {row[col] === null || row[col] === undefined ? "—" : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div style={{
          padding: "6px 12px", fontSize: "10px", color: "var(--text3)",
          borderTop: "1px solid var(--border)", letterSpacing: "0.08em",
          background: "var(--surface)",
        }}>
          SHOWING {maxRows} / {rows.length} ROWS
        </div>
      )}
    </div>
  );
}