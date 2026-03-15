import os
import json
import pandas as pd
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a data cleaning expert. You will be given information about a pandas DataFrame.
Your job is to identify data quality issues and return a JSON cleaning plan.

You must respond with ONLY a valid JSON array, no explanation, no markdown, no backticks.

Each item in the array should be:
{
  "issue": "short description of the issue",
  "fix": "what you will do to fix it",
  "column": "column name affected",
  "type": "duplicate|missing|format|whitespace|case|outlier|other"
}

Example response:
[
  {"issue": "Duplicate rows found", "fix": "Remove duplicate rows", "column": "all", "type": "duplicate"},
  {"issue": "Missing values in Email column", "fix": "Fill with 'unknown@email.com'", "column": "Email", "type": "missing"},
  {"issue": "Inconsistent date formats in Date column", "fix": "Standardize to YYYY-MM-DD", "column": "Date", "type": "format"}
]

Only return issues you can actually fix with pandas. Be specific about which column is affected."""


def run_cleaning(df: pd.DataFrame) -> dict:
    # build dataframe summary for GPT-4
    summary = _build_summary(df)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": summary}
        ],
        temperature=0,
        max_tokens=1000
    )

    raw = response.choices[0].message.content.strip()

    try:
        cleaning_plan = json.loads(raw)
    except json.JSONDecodeError:
        cleaning_plan = []

    # apply fixes and track diff
    cleaned_df, diff = _apply_fixes(df.copy(), cleaning_plan)

    return {
        "cleaning_plan": cleaning_plan,
        "diff": diff,
        "original_row_count": len(df),
        "cleaned_row_count": len(cleaned_df),
        "changes_count": len(diff),
        "cleaned_df": cleaned_df
    }


def _build_summary(df: pd.DataFrame) -> str:
    lines = [f"DataFrame shape: {df.shape[0]} rows x {df.shape[1]} columns\n"]
    lines.append("Column info:")

    for col in df.columns:
        null_count = df[col].isnull().sum()
        dtype = df[col].dtype
        sample = df[col].dropna().head(3).tolist()
        unique_count = df[col].nunique()
        lines.append(
            f"  - {col}: dtype={dtype}, nulls={null_count}, "
            f"unique={unique_count}, sample={sample}"
        )

    # check duplicates
    dup_count = df.duplicated().sum()
    lines.append(f"\nDuplicate rows: {dup_count}")

    return "\n".join(lines)


def _apply_fixes(df: pd.DataFrame, plan: list) -> tuple:
    diff = []

    for item in plan:
        fix_type = item.get("type", "other")
        column = item.get("column", "all")

        try:
            if fix_type == "duplicate":
                before_count = len(df)
                df = df.drop_duplicates()
                removed = before_count - len(df)
                if removed > 0:
                    diff.append({
                        "type": "duplicate",
                        "column": "all",
                        "description": f"Removed {removed} duplicate rows",
                        "old_value": f"{before_count} rows",
                        "new_value": f"{len(df)} rows"
                    })

            elif fix_type == "missing" and column in df.columns:
                null_mask = df[column].isnull()
                null_count = null_mask.sum()
                if null_count > 0:
                    if pd.api.types.is_numeric_dtype(df[column]):
                        fill_value = df[column].median()
                        df[column] = df[column].fillna(fill_value)
                        diff.append({
                            "type": "missing",
                            "column": column,
                            "description": f"Filled {null_count} missing values with median ({fill_value:.2f})",
                            "old_value": "null",
                            "new_value": str(round(fill_value, 2))
                        })
                    else:
                        df[column] = df[column].fillna("unknown")
                        diff.append({
                            "type": "missing",
                            "column": column,
                            "description": f"Filled {null_count} missing values with 'unknown'",
                            "old_value": "null",
                            "new_value": "unknown"
                        })

            elif fix_type == "whitespace" and column in df.columns:
                if pd.api.types.is_string_dtype(df[column]):
                    before = df[column].copy()
                    df[column] = df[column].str.strip()
                    changed = (before != df[column]).sum()
                    if changed > 0:
                        diff.append({
                            "type": "whitespace",
                            "column": column,
                            "description": f"Stripped whitespace from {changed} values",
                            "old_value": "values with spaces",
                            "new_value": "trimmed values"
                        })

            elif fix_type == "case" and column in df.columns:
                if pd.api.types.is_string_dtype(df[column]):
                    before = df[column].copy()
                    df[column] = df[column].str.title()
                    changed = (before != df[column]).sum()
                    if changed > 0:
                        diff.append({
                            "type": "case",
                            "column": column,
                            "description": f"Standardized casing in {changed} values",
                            "old_value": "mixed case",
                            "new_value": "title case"
                        })

            elif fix_type == "format" and column in df.columns:
                try:
                    before = df[column].copy()
                    df[column] = pd.to_datetime(df[column], infer_datetime_format=True).dt.strftime("%Y-%m-%d")
                    changed = (before.astype(str) != df[column]).sum()
                    if changed > 0:
                        diff.append({
                            "type": "format",
                            "column": column,
                            "description": f"Standardized {changed} date values to YYYY-MM-DD",
                            "old_value": "mixed formats",
                            "new_value": "YYYY-MM-DD"
                        })
                except Exception:
                    pass

        except Exception:
            continue

    return df, diff