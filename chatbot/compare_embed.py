"""임베딩 비교 — Upstage vs Ollama bge-m3. 같은 질문으로 검색만 해서 정답 문단을 찾는지와 코사인 유사도를 비교.

실행: python compare_embed.py   (index-upstage.json, index-ollama.json 이 있어야 함)
결과: embed-compare.md
"""
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_upstage import UpstageEmbeddings

from rag import HERE, TOP_K

PROVIDERS = {
    "upstage": UpstageEmbeddings(model="embedding"),
    "ollama": OllamaEmbeddings(model="bge-m3"),
}

# (질문, 정답이 들어 있는 소제목의 일부)
IN_DOMAIN = [
    ("비밀번호를 잊어버렸어요", "비밀번호를 잊어버렸어요"),
    ("방문 인증하면 XP 몇 점 받아요?", "XP는 어떻게 모아요"),
    ("레벨 3이 되려면 XP가 얼마나 필요해요?", "레벨은 어떻게 올라가요"),
    ("서울에 등록된 감자탕집은 몇 곳이에요?", "등록된 감자탕집 수"),
    ("다른 휴대폰에서 로그인하면 내 기록이 안 보여요", "로그인이 안 돼요"),
    ("탈퇴는 어떻게 해요?", "계정을 삭제"),
    ("월드컵은 최대 몇 강까지 할 수 있어요?", "감자탕 월드컵"),
    ("감자탕이랑 뼈해장국은 뭐가 달라요?", "감자탕 상식"),
    ("국물 좋아하는 사람은 MBTI 뭐 나와요?", "감자탕 MBTI"),
    ("가게 정보는 어디서 가져와요?", "가게 정보 출처"),
    ("후기 고치면 XP 또 줘요?", "후기를 수정하면"),
    ("앱 다운로드 어디서 해요?", "앱이 있나요"),
]
OFF_TOPIC = ["오늘 날씨 어때?", "주식 추천해줘", "파이썬 리스트 정렬하는 법", "고객센터 전화번호 알려주세요"]


def main():
    stores = {p: InMemoryVectorStore.load(str(HERE / f"index-{p}.json"), emb) for p, emb in PROVIDERS.items()}
    stats = {p: {"top1": 0, "top5": 0, "in": [], "off": []} for p in stores}
    rows = []
    for q, want in IN_DOMAIN:
        row = [q]
        for p, s in stores.items():
            hits = s.similarity_search_with_score(q, k=TOP_K)
            secs = [d.page_content for d, _ in hits]  # 소제목이 청크 중간에 있어도 찾도록 청크 전체를 봄
            rank = next((i + 1 for i, t in enumerate(secs) if want in t), None)
            stats[p]["top1"] += rank == 1
            stats[p]["top5"] += rank is not None
            stats[p]["in"].append(hits[0][1])
            row.append(f"{f'{rank}위' if rank else '5위 밖'} · {hits[0][1]:.3f}")
        rows.append(row)
    for q in OFF_TOPIC:
        for p, s in stores.items():
            stats[p]["off"].append(s.similarity_search_with_score(q, k=1)[0][1])

    n = len(IN_DOMAIN)
    lines = ["# 임베딩 비교: Upstage vs bge-m3", "",
             f"관련 질문 {n}개 · 관련 없는 질문 {len(OFF_TOPIC)}개 · 코사인 유사도 상위 {TOP_K}개 검색", "",
             "| 임베딩 | 정답 문단 1위 | 정답 문단 5위 안 | 관련 질문 최고 유사도 (최저~평균) | 관련 없는 질문 최고 유사도 (평균~최고) | 구분 여유 |",
             "|---|---|---|---|---|---|"]
    for p, st in stats.items():
        lo, avg = min(st["in"]), sum(st["in"]) / n
        off_avg, off_hi = sum(st["off"]) / len(st["off"]), max(st["off"])
        lines.append(f"| {p} | {st['top1']}/{n} | {st['top5']}/{n} | {lo:.3f} ~ {avg:.3f} | {off_avg:.3f} ~ {off_hi:.3f} | {lo - off_hi:+.3f} |")
    lines += ["", "구분 여유 = 관련 질문 중 가장 낮은 점수 − 관련 없는 질문 중 가장 높은 점수. 양수면 기준선 하나로 깔끔하게 나뉨.", "",
              "## 질문별 (정답 문단 순위 · 1위 유사도)", "", "| 질문 | " + " | ".join(stores) + " |", "|---|" + "---|" * len(stores)]
    lines += ["| " + " | ".join(r) + " |" for r in rows]
    lines += ["", "## 관련 없는 질문의 최고 유사도", "", "| 질문 | " + " | ".join(stores) + " |", "|---|" + "---|" * len(stores)]
    lines += [f"| {q} | " + " | ".join(f"{stats[p]['off'][i]:.3f}" for p in stores) + " |" for i, q in enumerate(OFF_TOPIC)]
    out = "\n".join(lines) + "\n"
    (HERE / "embed-compare.md").write_text(out, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
