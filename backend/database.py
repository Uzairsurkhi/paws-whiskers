import logging
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

_mongo_url = (
    os.environ.get("MONGO_URL")
    or os.environ.get("MONGODB_URI")
    or os.environ.get("MONGODB_URL")
    or ""
).strip()
_db_name = os.environ.get("DB_NAME", "paws_whiskers")
_local_mongo = any(h in _mongo_url for h in ("localhost", "127.0.0.1", "0.0.0.0"))

if _mongo_url and not _local_mongo:
    from motor.motor_asyncio import AsyncIOMotorClient

    client = AsyncIOMotorClient(_mongo_url, serverSelectionTimeoutMS=5000)
    db = client[_db_name]
    logger.info("Using MongoDB at %s / %s", _mongo_url.split("@")[-1], _db_name)
else:
    from memory_db import MemoryClient, default_persist_path

    persist = default_persist_path()
    client = MemoryClient(persist_path=persist)
    db = client[_db_name]
    if _mongo_url and _local_mongo:
        logger.warning("MONGO_URL points at localhost — using file-backed store %s", persist)
    else:
        logger.warning(
            "No MONGO_URL/MONGODB_URI set — accounts and orders are saved to %s. "
            "Set a MongoDB Atlas URL in production so data survives deploys.",
            persist,
        )
