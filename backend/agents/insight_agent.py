import os
import json
import pandas as pd
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INSIGHT_SYSTEM_PROMPT = """You are a senior data analyst. You will receive statistics about a retail/business dataset.
You MUST return between 4 and 6 insights. Never return an empty array.

Respond with ONLY a valid JSON array. No explanation, no markdown, no backticks, no preamble.

Each insight must follow this exact format:
{
  "title": "short title under 6 words",
  "description": "one specific sentence with real numbers from the data",
  "type": "trend|anomaly|stat|distribution",
  "importance": "high|medium|low"
}

Rules:
- ALWAYS include at least one "anomaly" type
- ALWAYS include at least one "trend" type  
- Use real column names and real numbers in descriptions
- Be specific: "Revenue peaks in November at $287,000" not "Revenue varies by month"
- importance=high means actionable or surprising findings
- If you see nulls/missing data, flag it as an anomaly
- Look for the top performer, bottom performer, biggest outlier"""

CHART_SYSTEM_PROMPT = """You are a data visualization expert. Given a result table, decide the best chart type.

Respond with ONLY a valid JSON object, no explanation, no markdown, no backticks.

Format:
{
  "chart_type": "bar|line|pie|scatter|none",
  "x_col": "column name for x axis",
  "y_col": "column name for y axis",
  "title": "chart title"
}

Rules:
- Use "bar" for comparisons between categories
- Use "line" for time series or sequential data
- Use "pie" for proportions (only if fewer than 8 categories)
- Use "scatter" for correlations between two numeric columns
- Use "none" if a chart would not add value (e.g. single value results)"""


def generate_insights(df: pd.DataFrame) -> list:
    summary = _build_insight_summary(df)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": INSIGHT_SYSTEM_PROMPT},
            {"role": "user", "content": summary}
        ],
        temperature=0.3,
        max_tokens=1500
    )

    raw = response.choices[0].message.content.strip()

    # strip markdown if GPT wraps it anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        result = json.loads(raw)
        if isinstance(result, list) and len(result) > 0:
            return result
        # if empty array, try once more with a simpler prompt
        return _fallback_insights(df)
    except json.JSONDecodeError:
        return _fallback_insights(df)


def _fallback_insights(df: pd.DataFrame) -> list:
    """Simpler fallback if main prompt fails"""
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    prompt = f"""This dataset has {len(df)} rows and {len(df.columns)} columns.
Columns: {df.columns.tolist()}
"""
    if numeric_cols:
        prompt += f"\nNumeric columns summary:\n{df[numeric_cols].describe().round(2).to_string()}"

    if text_cols:
        for col in text_cols[:3]:
            top = df[col].value_counts().head(5)
            prompt += f"\n\nTop values in {col}:\n{top.to_string()}"

    null_counts = df.isnull().sum()
    nulls = null_counts[null_counts > 0]
    if not nulls.empty:
        prompt += f"\n\nMissing data:\n{nulls.to_string()}"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": INSIGHT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=1500
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # last resort — return a hardcoded basic insight from the data
        insights = []
        if numeric_cols:
            col = numeric_cols[0]
            insights.append({
                "title": f"{col} overview",
                "description": f"{col} ranges from {df[col].min():.2f} to {df[col].max():.2f} with a mean of {df[col].mean():.2f}",
                "type": "stat",
                "importance": "medium"
            })
        if text_cols:
            col = text_cols[0]
            top_val = df[col].value_counts().index[0]
            top_count = df[col].value_counts().iloc[0]
            insights.append({
                "title": f"Top {col}",
                "description": f"'{top_val}' is the most frequent value in {col} appearing {top_count} times",
                "type": "stat",
                "importance": "medium"
            })
        null_cols = null_counts[null_counts > 0]
        if not null_cols.empty:
            worst_col = null_cols.idxmax()
            insights.append({
                "title": "Missing data detected",
                "description": f"{worst_col} has {null_cols.max()} missing values ({null_cols.max()/len(df)*100:.1f}% of rows)",
                "type": "anomaly",
                "importance": "high"
            })
        return insights


def suggest_chart(columns: list, rows: list) -> dict:
    if not columns or not rows:
        return {"chart_type": "none"}

    sample = rows[:5]
    prompt = f"Columns: {columns}\nSample rows: {json.dumps(sample, default=str)}"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": CHART_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=200
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"chart_type": "none"}


def _build_insight_summary(df: pd.DataFrame) -> str:
    lines = [f"Dataset: {len(df)} rows x {len(df.columns)} columns"]
    lines.append(f"Columns: {df.columns.tolist()}\n")

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()
    date_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

    if numeric_cols:
        lines.append("=== NUMERIC STATS ===")
        stats = df[numeric_cols].describe().round(2)
        lines.append(stats.to_string())

        # correlations if more than one numeric col
        if len(numeric_cols) > 1:
            lines.append("\n=== TOP CORRELATIONS ===")
            corr = df[numeric_cols].corr().round(2)
            for i in range(len(numeric_cols)):
                for j in range(i+1, len(numeric_cols)):
                    val = corr.iloc[i, j]
                    if abs(val) > 0.5:
                        lines.append(f"{numeric_cols[i]} vs {numeric_cols[j]}: {val}")

    if text_cols:
        lines.append("\n=== TOP CATEGORICAL VALUES ===")
        for col in text_cols[:6]:
            top = df[col].value_counts().head(5)
            null_pct = df[col].isnull().mean() * 100
            lines.append(f"\n{col} (nulls: {null_pct:.1f}%):")
            for val, count in top.items():
                pct = count / len(df) * 100
                lines.append(f"  {val}: {count} ({pct:.1f}%)")

    if date_cols:
        lines.append("\n=== DATE RANGES ===")
        for col in date_cols:
            lines.append(f"{col}: {df[col].min()} → {df[col].max()}")

    # null summary
    null_counts = df.isnull().sum()
    nulls = null_counts[null_counts > 0]
    if not nulls.empty:
        lines.append("\n=== MISSING DATA ===")
        for col, count in nulls.items():
            lines.append(f"{col}: {count} missing ({count/len(df)*100:.1f}%)")

    # numeric outliers
    if numeric_cols:
        lines.append("\n=== OUTLIER CHECK ===")
        for col in numeric_cols[:4]:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            outliers = df[(df[col] < q1 - 1.5*iqr) | (df[col] > q3 + 1.5*iqr)]
            if len(outliers) > 0:
                lines.append(f"{col}: {len(outliers)} outliers detected (range: {df[col].min():.2f} to {df[col].max():.2f})")

    return "\n".join(lines)