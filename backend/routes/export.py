import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from memory.session_store import get_dataframe

router = APIRouter()

@router.get("/export/{session_id}")
def export_file(session_id: str, format: str = "xlsx"):
    df = get_dataframe(session_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please re-upload your file."
        )

    if format == "csv":
        content = df.to_csv(index=False)
        return StreamingResponse(
            iter([content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=cleaned_export.csv"
            }
        )
    else:
        output = io.BytesIO()
        with io.BytesIO() as output:
            df.to_excel(output, index=False, engine="openpyxl")
            output.seek(0)
            content = output.read()

        return StreamingResponse(
            iter([content]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=cleaned_export.xlsx"
            }
        )