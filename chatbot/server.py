"""챗봇 API 서버 — 사이트의 채팅창(js/chatbot.js)이 여기에 질문을 보냄.

실행: .venv\\Scripts\\python.exe server.py   (또는 run.ps1)  →  http://127.0.0.1:8001
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import EMBED_MODEL, LLM_MODEL, TOP_K, answer, load_index

app = FastAPI(title="감자탕 감별사 챗봇")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8090", "http://127.0.0.1:8090", "https://gamjatang-club.vercel.app"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
store = load_index()


class Ask(BaseModel):
    question: str


@app.get("/health")
def health():
    return {"ok": True, "llm": LLM_MODEL, "embed": EMBED_MODEL, "top_k": TOP_K}


@app.post("/chat")
def chat(body: Ask):
    q = body.question.strip()
    if not q:
        raise HTTPException(400, "질문이 비어 있어요.")
    return answer(store, q[:500])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
