from db.supabase_client import supabase
from typing import List, Dict

MAX_HISTORY = 20  # last 20 messages sent to GPT-4

def save_message(session_id: str, role: str, content: str):
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content
    }).execute()

def load_history(session_id: str) -> List[Dict]:
    result = supabase.table("messages") \
        .select("role, content") \
        .eq("session_id", session_id) \
        .order("created_at", desc=False) \
        .limit(MAX_HISTORY) \
        .execute()

    return result.data if result.data else []

def clear_history(session_id: str):
    supabase.table("messages") \
        .delete() \
        .eq("session_id", session_id) \
        .execute()