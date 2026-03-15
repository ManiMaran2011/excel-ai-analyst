import os
import pandas as pd
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an expert data analyst. You are given a pandas DataFrame called `df`.
The user will ask questions about the data in natural language.
Your job is to write a single Python expression using pandas that answers the question.

Rules:
- Always assign the result to a variable called `result`
- `result` must be either a DataFrame, a scalar value, or a Series
- Never import anything — pandas is already imported as pd
- Never modify the original df — only read from it
- Never use exec() or eval() inside your code
- Respond with ONLY the Python code, no explanation, no markdown, no backticks

Example:
User: show me the top 5 customers by revenue
Code: result = df.nlargest(5, 'Revenue')
"""

def run_nl_query(df: pd.DataFrame, user_query: str, history: list) -> dict:
    # build messages with history for context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in history[-6:]:  # last 6 turns for context
        messages.append({"role": msg["role"], "content": msg["content"]})

    # add column info so GPT-4 knows the schema
    col_info = "\n".join([f"- {col} ({df[col].dtype})" for col in df.columns])
    context = f"DataFrame columns:\n{col_info}\n\nUser query: {user_query}"
    messages.append({"role": "user", "content": context})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0,
        max_tokens=500
    )

    code = response.choices[0].message.content.strip()

    # execute the generated code safely
    try:
        local_vars = {"df": df.copy(), "pd": pd}
        exec(code, {}, local_vars)
        result = local_vars.get("result")

        if result is None:
            return {"type": "error", "message": "Query ran but produced no result"}

        if isinstance(result, pd.DataFrame):
            return {
                "type": "dataframe",
                "columns": result.columns.tolist(),
                "rows": result.where(pd.notnull(result), None).to_dict(orient="records"),
                "row_count": len(result),
                "code": code
            }
        elif isinstance(result, pd.Series):
            df_result = result.reset_index()
            return {
                "type": "dataframe",
                "columns": df_result.columns.tolist(),
                "rows": df_result.where(pd.notnull(df_result), None).to_dict(orient="records"),
                "row_count": len(df_result),
                "code": code
            }
        else:
            return {
                "type": "scalar",
                "value": str(result),
                "code": code
            }

    except Exception as e:
        return {
            "type": "error",
            "message": f"Could not execute query: {str(e)}",
            "code": code
        }