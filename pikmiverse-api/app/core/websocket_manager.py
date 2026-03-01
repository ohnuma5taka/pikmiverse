import asyncio
from fastapi.websockets import WebSocketState
import redis.asyncio as redis
from fastapi import WebSocket, WebSocketDisconnect

from app.utils import json_util


class Connection:
    def __init__(self, websocket: WebSocket, channel: str, task=None):
        self.id = websocket.headers.get("sec-websocket-key")
        self.websocket = websocket
        self.channel = channel
        self.task = task
        self.ready_event = asyncio.Event()


class WebsocketManager:
    connection_map: dict[str, Connection]

    def __init__(self):
        self.connection_map = {}
        url = "redis://localhost:6379/0"
        self.redis = redis.Redis.from_url(url, decode_responses=True)

    async def _subscribe(self, connection: Connection):
        try:
            await connection.ready_event.wait()
            pubsub = self.redis.pubsub()
            await pubsub.subscribe(connection.channel)
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = dict(id=connection.id, data=json_util.loads(message["data"]))
                    await connection.websocket.send_text(json_util.dumps(data))
        except asyncio.CancelledError:
            await pubsub.unsubscribe(connection.channel)
            await pubsub.close()
            raise
        except WebSocketDisconnect:
            raise
        finally:
            await pubsub.close()

    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        key = websocket.headers.get("sec-websocket-key") or ""
        connection = Connection(websocket, channel)
        subscribe_task = asyncio.create_task(self._subscribe(connection))
        connection.task = subscribe_task
        connection.ready_event.set()
        self.connection_map[key] = connection
        await self.redis.setex(
            f"pikmiverse:ws-{key}",
            1,
            channel,
        )

    async def broadcast(self, channel: str, data: dict):
        await self.redis.publish(channel, json_util.dumps(data))

    async def disconnect(self, websocket: WebSocket):
        key = websocket.headers.get("sec-websocket-key")
        if key in self.connection_map:
            task = self.connection_map[key].task
            if task is not None:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
            del self.connection_map[key]
            await self.redis.delete(f"pikmiverse:ws-{key}")
        if websocket.application_state != WebSocketState.DISCONNECTED:
            try:
                await websocket.close()
            except RuntimeError:
                pass


websocket_manager = WebsocketManager()
