from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from memory.chat_memory import save_message, load_history
from memory.session_store import get_dataframe
from agents.nl_agent import run_nl_query

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str
    message: str

@router.post("/chat")
def chat(req: ChatRequest):
    df = get_dataframe(req.session_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please re-upload your file."
        )

    # load history from supabase
    history = load_history(req.session_id)

    # save user message
    save_message(req.session_id, "user", req.message)

    # run nl agent
    result = run_nl_query(df, req.message, history)

    # build assistant reply text
    if result["type"] == "dataframe":
        reply = f"Found {result['row_count']} rows matching your query."
    elif result["type"] == "scalar":
        reply = f"Result: {result['value']}"
    else:
        reply = f"Sorry, I couldn't process that: {result['message']}"

    # save assistant message
    save_message(req.session_id, "assistant", reply)

    return {
        "reply": reply,
        "result": result,
        "history": load_history(req.session_id)
    }

@router.get("/chat/history/{session_id}")
def get_history(session_id: str):
    history = load_history(session_id)
    return {"history": history}