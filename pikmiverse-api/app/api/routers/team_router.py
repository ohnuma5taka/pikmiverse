import copy

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket_manager import websocket_manager
from app.utils import json_util
from app.core.constant import SUBMIT_UNIT_SCORE, TARGET_SCORE, pikmiverse_command_map
from app.core.constant import team_map

router = APIRouter(prefix="/teams", tags=["チーム"])


@router.get("", response_model=dict)
def get_team_map() -> dict:
    return team_map


@router.get("/target-score", response_model=int)
def get_target_score() -> int:
    return TARGET_SCORE


@router.get("/init-data", response_model=None)
def init_data() -> None:
    for name in team_map:
        team_map[name]["score"] = {}


@router.get("/{name:str}", response_model=dict)
def get_team(name: str) -> dict:
    team = team_map[name]
    return {"name": name, "easy": team["easy"], "score": sum(team["score"].values())}


@router.get("/{name:str}/score/{ws_id:str}", response_model=dict)
def get_team_id(name: str, ws_id: str) -> dict:
    score = team_map[name]["score"][ws_id]
    scores = sorted(team_map[name]["score"].values(), reverse=True)
    return {"score": score, "rank": scores.index(score) + 1}


@router.websocket("/{name:str}/{user_id:str}")
async def ws_item(name: str, user_id: str, websocket: WebSocket):
    try:
        await websocket_manager.connect(f"/{name}", websocket)
        team_map[name]["score"][user_id] = 0
        while True:
            try:
                req_str = await websocket.receive_text()
                req_data = json_util.loads(req_str)["data"]
                team_map[name]["score"][user_id] += int(req_data["increment"])
                req_data["id"] = user_id
                team_score = sum(team_map[name]["score"].values())
                req_data["score"] = team_score
                await websocket_manager.broadcast(f"/{name}", data=req_data)

                if team_score >= team_map[name]["next_submit_score"]:
                    team_map[name]["next_submit_score"] += SUBMIT_UNIT_SCORE
                    data = copy.deepcopy(pikmiverse_command_map["static_white_value"])
                    data["devices"] = [team_map[name]["device"]]
                    data["value"] = min(team_score / TARGET_SCORE, 1)
                    await websocket_manager.broadcast("/pikmiverse", data=data)

                if team_score >= TARGET_SCORE and not team_map[name]["cleared"]:
                    team_map[name]["cleared"] = True
                    data = copy.deepcopy(pikmiverse_command_map["blink_rainbow_edge"])
                    data["devices"] = [team_map[name]["device"]]
                    await websocket_manager.broadcast("/pikmiverse", data=data)

            except WebSocketDisconnect:
                break
    finally:
        await websocket_manager.disconnect(websocket)
