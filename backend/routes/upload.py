import uuid
import pandas as pd
from io import BytesIO
from fastapi import APIRouter, UploadFile, File, HTTPException
from memory.session_store import save_dataframe
from db.supabase_client import supabase

router = APIRouter()

ALLOWED_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv"
]

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx, .xls, or .csv files are allowed"
        )

    contents = await file.read()

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(contents))
        else:
            df = pd.read_excel(BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    # replace NaN with None so JSON serialization works
    df = df.where(pd.notnull(df), None)

    session_id = str(uuid.uuid4())

    save_dataframe(session_id, df)

    # save session metadata to supabase
    supabase.table("sessions").insert({
        "id": session_id,
        "file_name": file.filename,
        "original_columns": df.columns.tolist(),
        "row_count": len(df)
    }).execute()

    return {
        "session_id": session_id,
        "file_name": file.filename,
        "row_count": len(df),
        "columns": df.columns.tolist(),
        "preview": df.head(10).to_dict(orient="records")
    }


@router.get("/session/{session_id}")
def get_session(session_id: str):
    result = supabase.table("sessions") \
        .select("file_name, original_columns, row_count") \
        .eq("id", session_id) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "file_name": result.data["file_name"],
        "columns": result.data["original_columns"],
        "row_count": result.data["row_count"]
    }