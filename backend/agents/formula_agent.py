import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an Excel formula expert. A user will give you an Excel formula and the column context around it.
Your job is to explain what the formula does in plain English — no jargon, no technical terms.

Rules:
- Explain it like you're talking to someone who has never coded
- Be specific — mention the actual column names involved
- Keep it to 2-3 sentences maximum
- If the formula has an error, explain what the error means and how to fix it
- Do not repeat the formula back to the user

Example:
Formula: =SUMIF(B2:B100, "North", C2:C100)
Columns: B=Region, C=Revenue
Explanation: This adds up all the revenue values where the region is "North". It scans through the Region column and whenever it finds "North", it includes that row's revenue in the total."""


def explain_formula(formula: str, cell_ref: str, columns: list) -> dict:
    col_context = ", ".join([f"{chr(65+i)}={col}" for i, col in enumerate(columns[:10])])

    prompt = f"Formula: {formula}\nCell: {cell_ref}\nColumn context: {col_context}"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=200
    )

    explanation = response.choices[0].message.content.strip()

    return {
        "formula": formula,
        "cell_ref": cell_ref,
        "explanation": explanation
    }