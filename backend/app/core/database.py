from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal = None


def _init_engine():
    global _engine, _SessionLocal
    if _engine is None:
        from app.core.config import settings
        _engine = create_engine(settings.DATABASE_URL)
        _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)


def get_db():
    _init_engine()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
