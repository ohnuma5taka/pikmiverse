from contextlib import asynccontextmanager
import uuid
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from starlette.middleware.cors import CORSMiddleware
import uvicorn

from app.api.api import api_router
from app.core.env import env
from app.core.logger import app_logger, request_id_ctx
from app.core.timeout_middleware import TimeoutMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=env.APP_NAME + ("" if env.APP_MODE == "prod" else f"-{env.APP_MODE}"),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
timeout_routes = {r"^/xxx/\d+/yyy$": 300}  # 特定のAPIのみタイムアウトを300秒に設定
app.add_middleware(TimeoutMiddleware, timeout_routes=timeout_routes, default_timeout=30)

app.include_router(api_router, prefix=env.API_PATH_PREFIX)


@app.exception_handler(RequestValidationError)
async def handler(request: Request, exc: RequestValidationError):
    app_logger.error("Request validation error")
    return Response(content=str(exc), status_code=422, media_type="application/json")


async def _safe_read_body(request: Request) -> str | None:
    try:
        body_bytes = await request.body()
        if not body_bytes:
            return None
        text = body_bytes.decode("utf-8", errors="replace")
        if len(text) > 1000:
            return text[:1000] + "...(truncated)"
        return text
    except Exception:
        return None


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    rid = str(uuid.uuid4())
    request_id_ctx.set(rid)

    client = request.client.host if request.client else "unknown"
    request_body = await _safe_read_body(request)
    port = str(request.client.port)  # type: ignore
    path = str(request.url.path)
    query_path = path + (f"?{str(request.url.query)}" if request.url.query else "")
    body_length = len(request_body) if request_body else 0
    app_logger.info(
        f'Req - {client}:{port} - "{request.method} {query_path}" body_length: {body_length}',
    )
    try:
        response = await call_next(request)
        app_logger.info(
            f'Res - {client}:{port} - "{request.method} {query_path}" {response.status_code}',
        )
        return response
    except Exception as e:
        app_logger.error(
            f'Error - {client}:{port} - "{request.method} {query_path}" {e}',
        )
        raise


@app.get("/", summary="ヘルスチェック", response_model=dict)
async def check_healthy():
    return dict(
        status="ok",
        mode=env.APP_MODE,
        version=env.APP_VERSION,
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None,
        access_log=False,
    )
