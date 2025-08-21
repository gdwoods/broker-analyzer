import os, uuid, hashlib
from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.responses import JSONResponse
from supabase import Client
from rq import Queue
import redis
from .supa import supa, SUPABASE_BUCKET
from .parse_job import parse_csv_job

app = FastAPI()
sb: Client = supa()

# Redis queue for background jobs
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
conn = redis.from_url(redis_url)
q = Queue("csv-jobs", connection=conn)

def sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256(); h.update(b); return h.hexdigest()

@app.get("/health")
def health():
    return {"status": "ok"}

# TEMP auth: we accept user id in a header for MVP. Replace with Supabase JWT later.
@app.post("/upload")
async def upload_statement(
    account_id: str,
    file: UploadFile = File(...),
    x_user_id: str = Header(None)
):
    if not x_user_id:
        raise HTTPException(401, "Missing X-User-Id header (temporary MVP auth)")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    content = await file.read()
    digest = sha256_bytes(content)
    storage_key = f"{x_user_id}/{uuid.uuid4()}.csv"

    # 1) Upload to private bucket
    up = sb.storage.from_(SUPABASE_BUCKET).upload(storage_key, content, {"content-type": "text/csv"})
    if up is None:
        raise HTTPException(500, "Upload to storage failed")

    # 2) Create statements row
    st = {
        "user_id": x_user_id,
        "account_id": account_id,
        "source_file": storage_key,
        "source_sha256": digest,
    }
    res = sb.table("brok.statements").insert(st).execute()
    statement_id = res.data[0]["statement_id"]

    # 3) Enqueue background parsing job
    q.enqueue(parse_csv_job, x_user_id, account_id, statement_id, storage_key)

    return JSONResponse({"ok": True, "statement_id": statement_id, "storage_key": storage_key})
