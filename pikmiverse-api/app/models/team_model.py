from pydantic import Field
from sqlmodel import Session
from app.db.entities.team_entity import Team
from app.models.base.app_base_model import AppBaseModel


class TeamModel(AppBaseModel[Team]):
    name: str = Field(..., title="名前")
    score: int = Field(..., title="スコア")
    easy: bool = Field(False, title="イージーモード")

    @staticmethod
    def to_model(entity: Team, session: Session | None = None) -> "TeamModel":
        return TeamModel(name=entity.name, score=entity.score, easy=entity.easy)

    def to_entity(self) -> Team:
        return Team(name=self.name, score=self.score, easy=self.easy)
