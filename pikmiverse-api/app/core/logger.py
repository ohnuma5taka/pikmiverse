# --- コンテキスト変数とフィルタ ---
from contextvars import ContextVar
import logging
from logging.config import dictConfig

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="no-rid")


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        rid = request_id_ctx.get()
        record.request_id = "" if rid == "no-rid" else rid
        return True


# --- ロギング設定 ---
dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {"request_id": {"()": RequestIdFilter}},
        "formatters": {
            "default": {
                "format": "%(asctime)s.%(msecs)03d pikmiverse_%(levelname)-5s [%(request_id)s] %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            },
            "compact": {
                "format": "%(asctime)s %(levelname)s [%(request_id)s] %(message)s",
                "datefmt": "%H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "filters": ["request_id"],
                "level": "INFO",
            },
        },
        "loggers": {
            # アプリ用ロガー
            "app": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
            # uvicorn 系も出すならレベルを調整
            "uvicorn.error": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }
)

logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
app_logger = logging.getLogger("app")
