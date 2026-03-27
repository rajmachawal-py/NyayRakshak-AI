from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

root = Path(__file__).resolve().parent
load_dotenv(root / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")

ASYNC_DATABASE_URL = DATABASE_URL.replace(
    "postgresql://",
    "postgresql+asyncpg://",
    1,
)

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
