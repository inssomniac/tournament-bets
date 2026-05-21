from pydantic_settings import BaseSettings
from typing import List


class BotSettings(BaseSettings):
    BOT_TOKEN: str
    LAPTU_CHANNEL_ID: int
    TWA_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    ADMIN_IDS: str = ""

    @property
    def admin_ids_list(self) -> List[int]:
        if not self.ADMIN_IDS:
            return []
        return [int(x.strip()) for x in self.ADMIN_IDS.split(",")]

    model_config = {"env_file": "../.env"}


settings = BotSettings()
