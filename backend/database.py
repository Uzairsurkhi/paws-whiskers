import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

_mongo_url = (os.environ.get("MONGO_URL") or "").strip()
_db_name = os.environ.get("DB_NAME", "paws_whiskers")
_local_mongo = any(h in _mongo_url for h in ("localhost", "127.0.0.1", "0.0.0.0"))

if _mongo_url and not _local_mongo:
    from motor.motor_asyncio import AsyncIOMotorClient

    client = AsyncIOMotorClient(_mongo_url)
    db = client[_db_name]
else:
    from memory_db import MemoryClient

    client = MemoryClient()
    db = client[_db_name]
