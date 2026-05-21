from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    BOT_TOKEN: str
    LAPTU_CHANNEL_ID: int
    SECRET_KEY: str
    ADMIN_IDS: str  # "123,456" — парсим в список
    ENVIRONMENT: str = "development"
    TWA_URL: str = "http://localhost:5173"
    DOMAIN: str = "localhost"
    BOT_PROXY: str = ""  # socks5://user:pass@host:port  (пусто = без прокси)

    @property
    def admin_ids_list(self) -> List[int]:
        return [int(x.strip()) for x in self.ADMIN_IDS.split(",")]

    model_config = {"env_file": "../.env", "extra": "ignore"}


settings = Settings()
