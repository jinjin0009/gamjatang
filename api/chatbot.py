"""배포 사이트용 챗봇 API — Vercel 서버 함수 (https://gamjatang-club.vercel.app/api/chatbot)

로직은 chatbot/rag.py 를 그대로 씀: Upstage 임베딩 → 코사인 유사도 상위 5개 → ChatGPT 답변.
키는 Vercel 프로젝트 환경 변수(UPSTAGE_API_KEY, OPENAI_API_KEY, OPENAI_MODEL)에 넣음. 둘 중 하나라도 없으면 503 → 채팅창 버튼이 안 보임.
GET = 상태 확인, POST {"question"} = 질문. (vercel.json 이 /api/chatbot/* 를 이 파일로 보내서 경로는 따지지 않음)
"""
import os
import sys
import time
from collections import defaultdict, deque
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "chatbot"))

app = FastAPI()
READY = bool(os.getenv("UPSTAGE_API_KEY") and os.getenv("OPENAI_API_KEY"))
MAX_QUESTION = 300
RATE_LIMIT, RATE_WINDOW = 20, 3600  # 한 사람(IP)당 1시간에 20번 — 유료 API 요금이 갑자기 늘지 않게
_hits: dict[str, deque] = defaultdict(deque)
_store = None


def _rag():
    global _store
    import rag
    if _store is None:
        _store = rag.load_index()
    return rag, _store


def _limited(ip: str) -> bool:
    now, q = time.time(), _hits[ip]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return True
    q.append(now)
    return False


@app.api_route("/{path:path}", methods=["GET", "POST"])
async def chatbot(request: Request, path: str = ""):
    if not READY:
        return JSONResponse({"ok": False, "error": "챗봇 키가 설정되지 않았어요."}, status_code=503)
    rag, store = _rag()
    if request.method == "GET":
        return {"ok": True, "llm": f"{rag.LLM_PROVIDER}:{rag.LLM_MODEL}", "embed": f"{rag.EMBED_PROVIDER}:{rag.EMBED_MODEL}",
                "top_k": rag.TOP_K, "min_score": rag.MIN_SCORE}

    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "")).split(",")[0].strip()
    if _limited(ip):
        return JSONResponse({"error": "질문이 너무 많아요. 1시간 뒤에 다시 물어봐 주세요."}, status_code=429)
    try:
        body = await request.json()
    except Exception:
        body = {}
    q = str(body.get("question") or "").strip()
    if not q:
        return JSONResponse({"error": "질문이 비어 있어요."}, status_code=400)
    return rag.answer(store, q[:MAX_QUESTION])
