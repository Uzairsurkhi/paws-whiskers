"""In-memory stand-in for Motor when MONGO_URL is not set (e.g. first Vercel deploy)."""

from __future__ import annotations

import re
from copy import deepcopy
from uuid import uuid4


def _match(doc: dict, query: dict) -> bool:
    if not query:
        return True
    if "$or" in query:
        return any(_match(doc, part) for part in query["$or"])
    for key, expected in query.items():
        if key == "$or":
            continue
        value = doc.get(key)
        if isinstance(expected, dict):
            if "$regex" in expected:
                flags = re.I if "i" in str(expected.get("$options", "")) else 0
                if not re.search(str(expected["$regex"]), str(value or ""), flags):
                    return False
            if "$exists" in expected:
                exists = expected["$exists"]
                if exists and key not in doc:
                    return False
                if not exists and key in doc:
                    return False
            if "$gte" in expected and not (value is not None and value >= expected["$gte"]):
                return False
            if "$in" in expected and value not in expected["$in"]:
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
    def __init__(self):
        self._docs: list[dict] = []

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
        return type("InsertOneResult", (), {"inserted_id": stored["_id"]})()

    async def insert_many(self, docs: list[dict]):
        for doc in docs:
            await self.insert_one(doc)

    async def update_one(self, query, update, upsert=False):
        for i, doc in enumerate(self._docs):
            if _match(doc, query):
                self._apply(doc, update)
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        if upsert:
            base = deepcopy(query)
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
        return type("UpdateResult", (), {"matched_count": n, "modified_count": n})()

    async def find_one_and_update(self, query, update):
        for doc in self._docs:
            if _match(doc, query):
                self._apply(doc, update)
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
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def delete_many(self, query):
        initial = len(self._docs)
        self._docs = [d for d in self._docs if not _match(d, query)]
        return type("DeleteResult", (), {"deleted_count": initial - len(self._docs)})()

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
    def __init__(self):
        self._cols: dict[str, MemoryCollection] = {}

    def __getattr__(self, name: str):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._cols:
            self._cols[name] = MemoryCollection()
        return self._cols[name]


class MemoryClient:
    def __init__(self):
        self._dbs: dict[str, MemoryDatabase] = {}

    def __getitem__(self, name: str):
        if name not in self._dbs:
            self._dbs[name] = MemoryDatabase()
        return self._dbs[name]

    def close(self):
        pass
