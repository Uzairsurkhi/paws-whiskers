"""File-backed stand-in for Motor when MONGO_URL is not set."""

from __future__ import annotations

import json
import logging
import os
import re
from copy import deepcopy
from pathlib import Path
from uuid import uuid4

logger = logging.getLogger(__name__)


def _match(doc: dict, query: dict) -> bool:
    if not query:
        return True
    if "$or" in query:
        return any(_match(doc, part) for part in query["$or"])
    for key, expected in query.items():
        if key == "$or":
            continue
        value = doc.get(key) if "." not in key else _nested_get(doc, key)
        if isinstance(expected, dict):
            if "$regex" in expected:
                flags = re.I if "i" in str(expected.get("$options", "")) else 0
                if not re.search(str(expected["$regex"]), str(value or ""), flags):
                    return False
            if "$exists" in expected:
                exists = expected["$exists"]
                present = key in doc if "." not in key else _nested_get(doc, key) is not None
                if exists and not present:
                    return False
                if not exists and present:
                    return False
            if "$gte" in expected and not (value is not None and value >= expected["$gte"]):
                return False
            if "$in" in expected and value not in expected["$in"]:
                return False
            if "$ne" in expected and value == expected["$ne"]:
                return False
        elif value != expected:
            return False
    return True


def _project(doc: dict, projection: dict | None) -> dict:
    out = deepcopy(doc)
    if not projection:
        return out
    if all(v == 0 for v in projection.values()):
        for k in projection:
            out.pop(k, None)
        return out
    keep = {k for k, v in projection.items() if v}
    if keep:
        out = {k: v for k, v in out.items() if k in keep or k == "_id"}
        if projection.get("_id") == 0:
            out.pop("_id", None)
    elif projection.get("_id") == 0:
        out.pop("_id", None)
    return out


def _nested_get(doc: dict, dotted: str):
    cur = doc
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


class MemoryCursor:
    def __init__(self, docs: list[dict], query: dict, projection: dict | None):
        self._docs = [d for d in docs if _match(d, query)]
        self._projection = projection

    def sort(self, key, direction=-1):
        reverse = direction == -1
        self._docs.sort(key=lambda d: _nested_get(d, key) or "", reverse=reverse)
        return self

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return deepcopy(next(self._iter))
        except StopIteration:
            raise StopAsyncIteration

    async def to_list(self, length: int | None = None):
        docs = self._docs[:length] if length else self._docs
        return [_project(d, self._projection) for d in docs]


class MemoryCollection:
    def __init__(self, on_change=None):
        self._docs: list[dict] = []
        self._on_change = on_change

    def _changed(self):
        if self._on_change:
            self._on_change()

    async def find_one(self, query=None, projection=None, sort=None):
        docs = [d for d in self._docs if _match(d, query or {})]
        if sort:
            key, direction = sort[0]
            docs.sort(key=lambda d: _nested_get(d, key) or "", reverse=direction == -1)
        if not docs:
            return None
        return _project(docs[0], projection)

    def find(self, query=None, projection=None):
        return MemoryCursor(self._docs, query or {}, projection)

    async def insert_one(self, doc: dict):
        stored = deepcopy(doc)
        stored.setdefault("_id", str(uuid4()))
        self._docs.append(stored)
        self._changed()
        return type("InsertOneResult", (), {"inserted_id": stored["_id"]})()

    async def insert_many(self, docs: list[dict]):
        for doc in docs:
            stored = deepcopy(doc)
            stored.setdefault("_id", str(uuid4()))
            self._docs.append(stored)
        self._changed()

    async def update_one(self, query, update, upsert=False):
        for doc in self._docs:
            if _match(doc, query):
                self._apply(doc, update)
                self._changed()
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        if upsert:
            base = deepcopy(query)
            base.pop("$or", None)
            self._apply(base, update)
            await self.insert_one(base)
            return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    async def update_many(self, query, update):
        n = 0
        for doc in self._docs:
            if _match(doc, query):
                self._apply(doc, update)
                n += 1
        if n:
            self._changed()
        return type("UpdateResult", (), {"matched_count": n, "modified_count": n})()

    async def find_one_and_update(self, query, update):
        for doc in self._docs:
            if _match(doc, query):
                self._apply(doc, update)
                self._changed()
                return deepcopy(doc)
        return None

    async def count_documents(self, query=None):
        return sum(1 for d in self._docs if _match(d, query or {}))

    async def create_index(self, *args, **kwargs):
        return None

    async def delete_one(self, query):
        for i, doc in enumerate(self._docs):
            if _match(doc, query):
                del self._docs[i]
                self._changed()
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def delete_many(self, query):
        initial = len(self._docs)
        self._docs = [d for d in self._docs if not _match(d, query)]
        deleted = initial - len(self._docs)
        if deleted:
            self._changed()
        return type("DeleteResult", (), {"deleted_count": deleted})()

    @staticmethod
    def _apply(doc: dict, update: dict):
        if "$set" in update:
            doc.update(update["$set"])
        if "$setOnInsert" in update:
            for k, v in update["$setOnInsert"].items():
                doc.setdefault(k, v)
        if "$unset" in update:
            for k in update["$unset"]:
                doc.pop(k, None)
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = (doc.get(k) or 0) + v
        if "$push" in update:
            for k, v in update["$push"].items():
                if k not in doc or not isinstance(doc[k], list):
                    doc[k] = []
                doc[k].append(deepcopy(v))


class MemoryDatabase:
    def __init__(self, on_change=None):
        self._cols: dict[str, MemoryCollection] = {}
        self._on_change = on_change

    def __getattr__(self, name: str):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._cols:
            self._cols[name] = MemoryCollection(on_change=self._on_change)
        return self._cols[name]


class MemoryClient:
    def __init__(self, persist_path: Path | None = None):
        self._dbs: dict[str, MemoryDatabase] = {}
        self._persist_path = persist_path
        self._load()

    def __getitem__(self, name: str):
        if name not in self._dbs:
            self._dbs[name] = MemoryDatabase(on_change=self._save)
        return self._dbs[name]

    def close(self):
        self._save()

    def _load(self):
        if not self._persist_path or not self._persist_path.exists():
            return
        try:
            payload = json.loads(self._persist_path.read_text())
        except Exception as e:
            logger.error("Could not load persisted store %s: %s", self._persist_path, e)
            return
        for dbn, cols in (payload or {}).items():
            database = MemoryDatabase(on_change=self._save)
            for col, docs in (cols or {}).items():
                collection = MemoryCollection(on_change=self._save)
                collection._docs = list(docs or [])
                database._cols[col] = collection
            self._dbs[dbn] = database
        logger.info("Loaded persisted store from %s", self._persist_path)

    def _save(self):
        if not self._persist_path:
            return
        try:
            self._persist_path.parent.mkdir(parents=True, exist_ok=True)
            payload = {
                dbn: {name: col._docs for name, col in database._cols.items()}
                for dbn, database in self._dbs.items()
            }
            tmp = self._persist_path.with_suffix(".tmp")
            tmp.write_text(json.dumps(payload, default=str))
            tmp.replace(self._persist_path)
        except Exception as e:
            logger.error("Could not persist store %s: %s", self._persist_path, e)


def default_persist_path() -> Path:
    custom = (os.environ.get("DATA_FILE") or "").strip()
    if custom:
        return Path(custom)
    return Path(__file__).parent / "data" / "store.json"
