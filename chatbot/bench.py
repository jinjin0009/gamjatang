"""이 PC 에 맞는 로컬 LLM 고르기 — 같은 질문을 후보 모델마다 돌려 정확도·속도·메모리를 비교.

실행: python bench.py [모델 ...]   (모델을 안 주면 CANDIDATES 전부)
결과: bench-result.md
"""
import sys
import time

import ollama

from rag import answer, load_index

CANDIDATES = ["exaone3.5:2.4b", "qwen2.5:3b", "qwen2.5:1.5b", "gemma3:1b"]

# (질문, 답에 꼭 들어가야 할 말들)
QUESTIONS = [
    ("비밀번호를 잊어버렸어요", ["메일"]),
    ("방문 인증하면 XP 몇 점 받아요?", ["30"]),
    ("레벨 3이 되려면 XP가 얼마나 필요해요?", ["300"]),
    ("서울에 등록된 감자탕집은 몇 곳이에요?", ["778"]),
    ("다른 휴대폰에서 로그인하면 내 기록이 안 보여요", ["브라우저"]),
    ("탈퇴는 어떻게 해요?", ["계정 삭제"]),
    ("월드컵은 최대 몇 강까지 할 수 있어요?", ["16"]),
    ("감자탕이랑 뼈해장국은 뭐가 달라요?", ["뚝배기"]),
    ("고객센터 전화번호 알려주세요", ["찾지 못했"]),  # 문서에 없음 → 지어내면 실패
]


def ram_gb(model: str) -> float:
    for m in ollama.ps().models:
        if m.model == model:
            return m.size / 1024**3
    return 0.0


def run(model: str, store) -> dict:
    ollama.generate(model=model, prompt="안녕", keep_alive="10m", options={"num_predict": 1})  # 처음 불러오는 시간은 따로 뺌
    rows = []
    for q, must in QUESTIONS:
        r = answer(store, q, model=model)
        ok = all(w in r["answer"] for w in must)
        rows.append({"q": q, "ok": ok, "ms": r["llm_ms"], "tps": r.get("tokens_per_sec") or 0, "ans": r["answer"], "best": r["best_score"]})
        print(f"  [{'O' if ok else 'X'}] {r['llm_ms'] / 1000:5.1f}s  {q} → {r['answer'][:70]!r}", flush=True)
    mem = ram_gb(model)
    ollama.generate(model=model, prompt="", keep_alive=0)  # 다음 모델을 위해 메모리 비움
    timed = [r for r in rows if r["ms"]]
    return {
        "model": model,
        "acc": sum(r["ok"] for r in rows) / len(rows),
        "avg_s": sum(r["ms"] for r in timed) / len(timed) / 1000,
        "tps": sum(r["tps"] for r in timed) / len(timed),
        "ram": mem,
        "rows": rows,
    }


def main():
    models = sys.argv[1:] or CANDIDATES
    store = load_index()
    results = []
    for m in models:
        print(f"\n=== {m} ===", flush=True)
        results.append(run(m, store))

    # 정확도 우선, 같으면 빠른 순
    results.sort(key=lambda r: (-r["acc"], r["avg_s"]))
    lines = ["# 로컬 LLM 비교 결과", "",
             f"질문 {len(QUESTIONS)}개 · 임베딩 bge-m3 · 코사인 유사도 상위 5개 청크를 넣고 답하게 함", "",
             "| 순위 | 모델 | 정답률 | 평균 답변 시간 | 생성 속도 | 메모리 |", "|---|---|---|---|---|---|"]
    for i, r in enumerate(results, 1):
        lines.append(f"| {i} | {r['model']} | {r['acc']:.0%} | {r['avg_s']:.1f}초 | {r['tps']:.1f} 토큰/초 | {r['ram']:.1f} GB |")
    lines += ["", "## 질문별 답변"]
    for r in results:
        lines += ["", f"### {r['model']}", "", "| 결과 | 질문 | 최고 유사도 | 답변 |", "|---|---|---|---|"]
        for x in r["rows"]:
            lines.append(f"| {'O' if x['ok'] else 'X'} | {x['q']} | {x['best']:.3f} | {x['ans'].replace(chr(10), ' ').replace('|', '/')} |")
    out = "\n".join(lines) + "\n"
    with open("bench-result.md", "w", encoding="utf-8") as f:
        f.write(out)
    print("\n" + "\n".join(lines[:6 + len(results)]))


if __name__ == "__main__":
    main()
