from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AetherSprite"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    BASE_DIR: Path = Path(__file__).parent.parent
    OUTPUTS_DIR: Path = BASE_DIR / "outputs"
    MOTION_LIBRARY_DIR: Path = BASE_DIR / "motion_library"

settings = Settings()
