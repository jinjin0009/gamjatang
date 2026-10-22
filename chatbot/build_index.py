"""docs/*.md 를 청크로 나누고 임베딩해서 index.json 으로 저장. 문서를 고친 뒤 다시 실행."""
from rag import CHUNK_OVERLAP, CHUNK_SIZE, EMBED_MODEL, INDEX_PATH, build_index, overlap_ratio

chunks = build_index()
print(f"임베딩 모델: {EMBED_MODEL} · 청크 {len(chunks)}개 (크기 {CHUNK_SIZE}자, 겹침 목표 {CHUNK_OVERLAP}자 = {CHUNK_OVERLAP / CHUNK_SIZE:.0%})")

ratios = []
for a, b in zip(chunks, chunks[1:]):
    if a.metadata["source"] == b.metadata["source"]:
        ratios.append(overlap_ratio(a.metadata["raw"], b.metadata["raw"]))
if ratios:
    print(f"이웃 청크 실제 겹침: 최소 {min(ratios):.1%} · 평균 {sum(ratios) / len(ratios):.1%} · 최대 {max(ratios):.1%}")
print(f"저장: {INDEX_PATH}")
