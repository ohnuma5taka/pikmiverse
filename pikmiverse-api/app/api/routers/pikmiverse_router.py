import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket_manager import websocket_manager
from app.core.constant import pikmiverse_command_map, pikmiverse_poor_light_commands

router = APIRouter(prefix="/pikmiverse", tags=["装置"])


@router.post("/{command:str}", response_model=None)
async def post(command: str) -> None:
    if command == "poor_light":
        for cmd in pikmiverse_poor_light_commands:
            for data in cmd["commands"]:
                await websocket_manager.broadcast("/pikmiverse", data=data)
                await asyncio.sleep(cmd["command_delay"])
            await asyncio.sleep(cmd["delay"])

    else:
        await websocket_manager.broadcast(
            "/pikmiverse", data=pikmiverse_command_map[command]
        )


@router.websocket("")
async def ws(websocket: WebSocket):
    try:
        await websocket_manager.connect("/pikmiverse", websocket)
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        await websocket_manager.disconnect(websocket)
