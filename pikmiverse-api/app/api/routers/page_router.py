from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket_manager import websocket_manager

router = APIRouter(prefix="/page", tags=["ページ"])


@router.post("/{page:str}", response_model=None)
async def post(page: str) -> None:
    await websocket_manager.broadcast("/page", data={"page": page})


@router.websocket("")
async def ws(websocket: WebSocket):
    try:
        await websocket_manager.connect("/page", websocket)
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        await websocket_manager.disconnect(websocket)
