from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from memory.session_store import get_dataframe, save_dataframe
from agents.cleaner_agent import run_cleaning

router = APIRouter()

class CleanRequest(BaseModel):
    session_id: str

@router.post("/clean")
def clean_file(req: CleanRequest):
    df = get_dataframe(req.session_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please re-upload your file."
        )

    result = run_cleaning(df)

    # save cleaned dataframe back to session store
    save_dataframe(req.session_id, result["cleaned_df"])

    return {
        "cleaning_plan": result["cleaning_plan"],
        "diff": result["diff"],
        "original_row_count": result["original_row_count"],
        "cleaned_row_count": result["cleaned_row_count"],
        "changes_count": result["changes_count"]
    }