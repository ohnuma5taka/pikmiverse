from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket_manager import websocket_manager
from app.utils import json_util

router = APIRouter(prefix="/pikmiverse", tags=["装置"])

devices = list(range(1, 17))
pikmiverse_command_map = {
    "turn_off_all": {"devices": devices, "action": "off", "parts": ["arm", "edge"]},
    "open_all": {"devices": devices, "action": "open"},
    "white_static_all": {
        "devices": devices,
        "action": "on",
        "parts": ["arm"],
        "color": "#ffffff",
        "type": "static",
    },
    "rainbow_sparkle_all": {
        "devices": devices,
        "action": "on",
        "parts": ["arm"],
        "color": "rainbow",
        "type": "sparkle",
    },
    "purple_sparkle_odd": {
        "devices": [x for x in devices if x % 2 == 0],
        "action": "on",
        "parts": ["arm"],
        "color": "#874da1",
        "type": "sparkle",
    },
    "pink_sparkle_even": {
        "devices": [x for x in devices if x % 2 == 0],
        "action": "on",
        "parts": ["arm"],
        "color": "#ff59ac",
        "type": "sparkle",
    },
    "static_white_value": {
        "devices": [],  # 動的
        "action": "on",
        "parts": ["arm"],
        "color": "#ffffff",
        "type": "static",
        "value": 0,  # 動的
    },
    "blink_rainbow_edge": {
        "devices": [],  # 動的
        "action": "on",
        "parts": ["edge"],
        "color": "rainbow",
        "type": "blink",
    },
}


@router.post("", response_model=None)
async def post(body: dict) -> None:
    await websocket_manager.broadcast("/pikmiverse", data=body)


@router.websocket("")
async def ws(websocket: WebSocket):
    try:
        await websocket_manager.connect("/pikmiverse", websocket)
        while True:
            try:
                req_str = await websocket.receive_text()
                req_data = json_util.loads(req_str)
                await websocket_manager.broadcast("/pikmiverse", data=req_data)
            except WebSocketDisconnect:
                break
    finally:
        await websocket_manager.disconnect(websocket)
