from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any

from app.core.websocket_manager import websocket_manager
from app.utils import json_util

router = APIRouter(prefix="/teams", tags=["チーム"])

team_map: Dict[str, Dict[str, Any]] = {
    "A": {"easy": False, "score": {}},
    "B": {"easy": False, "score": {}},
    "C": {"easy": True, "score": {}},
}


@router.get("", response_model=dict)
def get_team_map() -> dict:
    return team_map


@router.get("/init-data", response_model=dict)
def init_data() -> dict:
    return team_map


@router.get("/{name:str}", response_model=dict)
def get_team(name: str) -> dict:
    team = team_map[name]
    return {"name": name, "easy": team["easy"], "score": sum(team["score"].values())}


@router.get("/{name:str}/score/{ws_id:str}", response_model=dict)
def get_team_id(name: str, ws_id: str) -> dict:
    score = team_map[name]["score"][ws_id]
    scores = sorted(team_map[name]["score"].values(), reverse=True)
    return {"score": score, "rank": scores.index(score) + 1}


@router.websocket("/{name:str}")
async def ws_item(name: str, websocket: WebSocket):
    try:
        await websocket_manager.connect(f"/{name}", websocket)
        ws_id = websocket.headers.get("sec-websocket-key") or ""
        team_map[name]["score"][ws_id] = 0
        while True:
            try:
                req_str = await websocket.receive_text()
                req_data = json_util.loads(req_str)["data"]
                team_map[name]["score"][ws_id] += int(req_data["increment"])
                req_data["id"] = ws_id
                req_data["score"] = sum(team_map[name]["score"].values())
                await websocket_manager.broadcast(f"/{name}", data=req_data)
            except WebSocketDisconnect:
                break
    finally:
        await websocket_manager.disconnect(websocket)
