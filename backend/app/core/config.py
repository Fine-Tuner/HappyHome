import os
import secrets
from pathlib import Path
from typing import Annotated, Any, Literal

from dotenv import load_dotenv
from pydantic import AnyUrl, BeforeValidator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    load_dotenv(model_config["env_file"])

    API_V1_STR: str = "/api/v1"
    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    DATA_DIR: Path = Path("data")
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # JWT Settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGO: str = "HS512"
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 60 * 30
    REFRESH_TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 30

    # Google SSO Settings
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET")
    BACKEND_CALLBACK_URL: str = "http://localhost:8000/auth/google/callback"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str = "happyhome"
    MONGO_DATABASE: str = "happyhome"
    MONGO_DATABASE_URI: str = "mongodb://localhost:27017"

    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND_URL: str = "redis://localhost:6379/0"

    # Define the static schedule here
    BEAT_SCHEDULE: dict = {
        # "run-example-task-every-minute": {
        #     "task": "app.tasks.example_task",
        #     "schedule": crontab(minute="*"),
        #     "args": ("periodic execution from config",),
        # },
    }

    MYHOME_BASE_URL: str = "http://apis.data.go.kr/1613000/HWSPR02"
    MYHOME_ENDPOINT: str = "/rsdtRcritNtcList"
    MYHOME_DATA_DIR: Path = DATA_DIR / "myhome"

    OPENAI_MAX_RETRIES: int = 3


settings = Settings()  # type: ignore
