import io
import polars as pl
from datetime import datetime
from supabase import Client
from .supa import supa, SUPABASE_BUCKET

def parse_csv_job(user_id: str, account_id: str, statement_id: str, storage_key: str):
    sb: Client = supa()

    # 1) Download the CSV bytes from Supabase Storage
    data = sb.storage.from_(SUPABASE_BUCKET).download(storage_key)
    buf = io.BytesIO(data)

    # 2) Read with Polars
    df = pl.read_csv(buf, ignore_errors=True)

    # Minimal MVP: just count rows and mark the statement;
    # you'll expand to write brok.executions and brok.fees here.
    row_count = df.height

    # Example: upsert a few execution rows if you have known columns:
    # (Replace these with your broker's actual headers)
    # expected = {"Time":"exec_time", "Symbol":"symbol", "Side":"side", "Qty":"qty", "Price":"price", "Fee":"fee"}
    # if set(expected.keys()).issubset(set(df.columns)):
    #     execs = (df
    #         .select([
    #             pl.col("Time").str.strptime(pl.Datetime, strict=False).alias("exec_time"),
    #             pl.col("Symbol").alias("symbol"),
    #             pl.col("Side").str.to_lowercase().alias("side"),
    #             pl.col("Qty").cast(pl.Float64).alias("qty"),
    #             pl.col("Price").cast(pl.Float64).alias("price"),
    #             pl.col("Fee").cast(pl.Float64).alias("fees_total"),
    #         ])
    #     )
    #     rows = [
    #         {
    #            "user_id": user_id, "statement_id": statement_id, "account_id": account_id,
    #            "symbol": r["symbol"], "side": r["side"], "qty": r["qty"], "price": r["price"],
    #            "exec_time": r["exec_time"], "fees_total": r["fees_total"]
    #         } for r in execs.to_dicts()
    #     ]
    #     if rows:
    #         sb.table("brok.executions").insert(rows).execute()

    sb.table("brok.statements")\
      .update({"row_count": row_count})\
      .eq("statement_id", statement_id).execute()

    return {"ok": True, "rows": row_count}
