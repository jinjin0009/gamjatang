"""감자탕 감별사 CS·사이트 소개 챗봇 — RAG 핵심 로직 (LangChain + Ollama)

흐름: docs/*.md → 청크(앞뒤 15% 겹침) → 임베딩(Upstage 또는 Ollama bge-m3) → 코사인 유사도 상위 5개 → 로컬 LLM 답변
"""
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore

# Ollama·텍스트 분할기는 쓸 때만 불러옴 → Vercel 서버 함수(api/chatbot.py)는 Upstage·OpenAI 패키지만 있으면 됨

HERE = Path(__file__).parent
DOCS_DIR = HERE / "docs"
load_dotenv(HERE.parent / ".env")  # gamjatang/.env 의 UPSTAGE_API_KEY

# 임베딩: .env 에 UPSTAGE_API_KEY 가 있으면 Upstage(문서는 embedding-passage, 질문은 embedding-query), 없으면 Ollama bge-m3
EMBED_PROVIDER = os.getenv("CHATBOT_EMBED_PROVIDER") or ("upstage" if os.getenv("UPSTAGE_API_KEY") else "ollama")
EMBED_MODEL = {"upstage": "embedding", "ollama": "bge-m3"}[EMBED_PROVIDER]
INDEX_PATH = HERE / f"index-{EMBED_PROVIDER}.json"  # 임베딩마다 벡터 길이가 달라 인덱스를 따로 둠
# 답변: .env 에 OPENAI_API_KEY 가 있으면 ChatGPT(OPENAI_MODEL), 없으면 Ollama exaone3.5:2.4b (bench.py 비교 1위)
LLM_PROVIDER = os.getenv("CHATBOT_LLM_PROVIDER") or ("openai" if os.getenv("OPENAI_API_KEY") else "ollama")
OLLAMA_LLM = "exaone3.5:2.4b"
LLM_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini") if LLM_PROVIDER == "openai" else os.getenv("CHATBOT_LLM_MODEL", OLLAMA_LLM)
CHUNK_SIZE = 400
CHUNK_OVERLAP = 60  # 400자의 15% — 앞뒤 청크가 겹쳐야 문장이 잘려도 유사도가 덜 떨어짐
TOP_K = 5
# 가장 비슷한 청크가 이보다 낮으면 LLM 을 부르지 않고 "모른다"고 답함 (임베딩마다 점수 분포가 달라 따로 맞춤)
MIN_SCORE = float(os.getenv("CHATBOT_MIN_SCORE") or {"upstage": 0.26, "ollama": 0.45}[EMBED_PROVIDER])

PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "너는 '감자탕 감별사' 사이트의 고객센터 챗봇이야.\n"
     "아래 [참고 문서]에 있는 내용만으로 한국어 해요체로 짧고 정확하게 답해.\n"
     "질문이 문서와 다른 말로 쓰였어도 같은 상황을 다룬 내용이 있으면 그 내용으로 답해. (예: '다른 휴대폰' = '다른 기기')\n"
     "문서 어디에도 관련 내용이 없을 때만 지어내지 말고 '그 내용은 안내 문서에서 찾지 못했어요.'라고 답해.\n"
     "숫자(XP, 곳 수, 점수)는 문서에 적힌 그대로 쓰고, '문서에 따르면' 같은 말은 붙이지 마.\n\n"
     "[참고 문서]\n{context}"),
    ("human", "{question}"),
])


def split_documents() -> list[Document]:
    """문서를 청크로 나눔. 단어(띄어쓰기) 단위로 잘라 실제 겹침이 CHUNK_OVERLAP 에 가깝게 맞춰짐."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[" ", ""],
        add_start_index=True,
    )
    chunks = []
    for path in sorted(DOCS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        for doc in splitter.create_documents([text], metadatas=[{"source": path.name}]):
            # 청크가 시작되는 위치의 소제목(## ...)을 붙여 두면 짧은 질문과도 잘 맞음
            start = doc.metadata["start_index"]
            heading = next((ln[3:].strip() for ln in reversed(text[:start + 1].splitlines()) if ln.startswith("## ")), "")
            doc.metadata["section"] = heading
            doc.metadata["raw"] = doc.page_content
            if heading and not doc.page_content.lstrip().startswith("## "):
                doc.page_content = f"## {heading}\n{doc.page_content}"
            chunks.append(doc)
    return chunks


def overlap_ratio(a: str, b: str) -> float:
    """앞 청크의 끝과 뒤 청크의 시작이 몇 % 겹치는지 (앞 청크 길이 기준 — 문서 끝의 짧은 청크에 휘둘리지 않게)."""
    for n in range(min(len(a), len(b)), 0, -1):
        if a.endswith(b[:n]):
            return n / len(a)
    return 0.0


def embeddings():
    if EMBED_PROVIDER == "upstage":
        from langchain_upstage import UpstageEmbeddings
        return UpstageEmbeddings(model=EMBED_MODEL)
    from langchain_ollama import OllamaEmbeddings
    return OllamaEmbeddings(model=EMBED_MODEL)


def build_index() -> list[Document]:
    chunks = split_documents()
    store = InMemoryVectorStore(embeddings())
    store.add_documents(chunks)
    store.dump(str(INDEX_PATH))
    return chunks


def load_index() -> InMemoryVectorStore:
    if not INDEX_PATH.exists():
        build_index()
    return InMemoryVectorStore.load(str(INDEX_PATH), embeddings())


def make_llm(model: str | None = None):
    """model 을 주면(bench.py) 그 Ollama 모델, 안 주면 LLM_PROVIDER 기본 모델."""
    if model is None and LLM_PROVIDER == "openai":
        from langchain_openai import ChatOpenAI
        if LLM_MODEL.startswith(("gpt-5", "o")):  # 추론 모델은 temperature 를 못 바꿈 → 생각 단계를 최소로
            return ChatOpenAI(model=LLM_MODEL, reasoning_effort="minimal", max_tokens=1000, timeout=60)
        return ChatOpenAI(model=LLM_MODEL, temperature=0.1, max_tokens=400, timeout=60)
    from langchain_ollama import ChatOllama
    return ChatOllama(model=model or LLM_MODEL, temperature=0.1, num_predict=320, num_ctx=4096, keep_alive="30m")


def retrieve(store: InMemoryVectorStore, question: str, k: int = TOP_K) -> list[tuple[Document, float]]:
    """InMemoryVectorStore 의 점수는 코사인 유사도 (1 에 가까울수록 비슷함)."""
    return store.similarity_search_with_score(question, k=k)


def answer(store: InMemoryVectorStore, question: str, model: str | None = None) -> dict:
    t0 = time.perf_counter()
    hits = retrieve(store, question)
    t_search = time.perf_counter() - t0
    sources = [{
        "rank": i + 1,
        "score": round(float(score), 4),
        "source": doc.metadata.get("source"),
        "section": doc.metadata.get("section"),
        "text": doc.metadata.get("raw", doc.page_content),
    } for i, (doc, score) in enumerate(hits)]

    best = sources[0]["score"] if sources else 0.0
    if best < MIN_SCORE:
        return {"answer": "그 내용은 안내 문서에서 찾지 못했어요. 감자탕 감별사 이용 방법이나 사이트 소개에 대해 물어봐 주세요.",
                "best_score": best, "sources": sources, "model": None,
                "search_ms": round(t_search * 1000), "llm_ms": 0}

    context = "\n\n".join(f"[문서 {s['rank']} · 유사도 {s['score']:.2f}]\n{doc.page_content}"
                          for s, (doc, _) in zip(sources, hits))
    t1 = time.perf_counter()
    msg = (PROMPT | make_llm(model)).invoke({"context": context, "question": question})
    llm_s = time.perf_counter() - t1
    meta = msg.response_metadata or {}
    eval_count, eval_ns = meta.get("eval_count") or 0, meta.get("eval_duration") or 0  # Ollama 만 줌
    if not eval_ns and msg.usage_metadata:  # OpenAI 는 전체 응답 시간으로 계산
        eval_count, eval_ns = msg.usage_metadata.get("output_tokens", 0), llm_s * 1e9
    return {
        "answer": msg.content.strip(),
        "best_score": best,
        "sources": sources,
        "model": model or LLM_MODEL,
        "search_ms": round(t_search * 1000),
        "llm_ms": round(llm_s * 1000),
        "tokens_per_sec": round(eval_count / (eval_ns / 1e9), 1) if eval_ns else None,
    }
