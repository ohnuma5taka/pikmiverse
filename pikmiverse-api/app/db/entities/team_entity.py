from sqlalchemy import Column, String
from sqlmodel import Field

from app.core.env import env
from app.db.entities.base.app_base_entity import AppBaseEntity


class Team(AppBaseEntity, table=True):
    __tablename__ = "teams"  # type: ignore[assignment]
    __table_args__ = {"schema": env.POSTGRES_SCHEMA}

    name: str = Field(
        title="名前",
        sa_column=Column(String, primary_key=True),
    )
    score: int = Field(title="スコア", default=0)
    easy: bool = Field(title="イージーモード", default=False)
