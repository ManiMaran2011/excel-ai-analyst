from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from memory.session_store import get_dataframe
from agents.insight_agent import generate_insights, suggest_chart

router = APIRouter()

class InsightRequest(BaseModel):
    session_id: str

class ChartRequest(BaseModel):
    columns: list
    rows: list

@router.post("/insights")
def get_insights(req: InsightRequest):
    df = get_dataframe(req.session_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please re-upload your file."
        )

    insights = generate_insights(df)
    return {"insights": insights}

@router.post("/chart-suggest")
def get_chart_suggestion(req: ChartRequest):
    suggestion = suggest_chart(req.columns, req.rows)
    return suggestion