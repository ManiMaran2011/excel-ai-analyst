import pandas as pd
from typing import Dict, Optional

# in-memory store: { session_id: dataframe }
_store: Dict[str, pd.DataFrame] = {}

def save_dataframe(session_id: str, df: pd.DataFrame):
    _store[session_id] = df

def get_dataframe(session_id: str) -> Optional[pd.DataFrame]:
    return _store.get(session_id)

def delete_dataframe(session_id: str):
    if session_id in _store:
        del _store[session_id]

def has_session(session_id: str) -> bool:
    return session_id in _store