from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.formula_agent import explain_formula
from memory.session_store import get_dataframe

router = APIRouter()

class FormulaRequest(BaseModel):
    session_id: str
    formula: str
    cell_ref: str

@router.post("/formula/explain")
def explain_formula_route(req: FormulaRequest):
    df = get_dataframe(req.session_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please re-upload your file."
        )

    if not req.formula.startswith("="):
        raise HTTPException(
            status_code=400,
            detail="Not a valid formula — formulas must start with ="
        )

    columns = df.columns.tolist()
    result = explain_formula(req.formula, req.cell_ref, columns)
    return result