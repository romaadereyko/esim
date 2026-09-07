from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HISTORY_FILE = "/app/data/history.json"

class HistoryItem(BaseModel):
    id: int
    date: str
    qr: str
    comment: Optional[str] = ""

class HistoryPost(BaseModel):
    qr: str
    comment: Optional[str] = ""

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_history(data):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.get("/api/history")
async def get_history():
    return load_history()

@app.post("/api/history")
async def add_history(item: HistoryPost):
    history = load_history()
    new_item = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().isoformat(),
        "qr": item.qr,
        "comment": item.comment or ""
    }
    history.insert(0, new_item)
    save_history(history)
    return new_item

@app.delete("/api/history/{id}")
async def delete_history(id: int):
    history = load_history()
    new_history = [h for h in history if h["id"] != id]
    if len(new_history) == len(history):
        raise HTTPException(status_code=404, detail="Item not found")
    save_history(new_history)
    return {"status": "ok"}

@app.put("/api/history/{id}")
async def update_comment(id: int, comment: str):
    history = load_history()
    found = False
    for item in history:
        if item["id"] == id:
            item["comment"] = comment
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Item not found")
    save_history(history)
    return {"status": "ok"}

@app.get("/api/ping")
async def ping():
    return {"status": "ok"}
