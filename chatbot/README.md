# 감자탕 감별사 CS·사이트 소개 챗봇 (로컬 RAG)

질문 → `docs/*.md` 에서 코사인 유사도가 가장 높은 청크 5개를 찾음 → 로컬 LLM(Ollama)이 그 내용만으로 답함. 채팅창에 참고한 청크 5개와 각각의 유사도가 함께 보여요.

| 항목 | 값 |
|---|---|
| Python | 3.12.10 (pyenv-win, `.python-version`) + 가상환경 `.venv` |
| 프레임워크 | LangChain (`langchain-ollama`, `InMemoryVectorStore`) + FastAPI |
| 임베딩 | `bge-m3` (Ollama, 한국어 지원) |
| LLM | `exaone3.5:2.4b` (Ollama) — `bench.py` 비교 1위, 결과는 `bench-result.md` |
| 청크 | 400자, 겹침 60자(15%) — 실제 이웃 청크 겹침 11.6~15.2% |
| 검색 | 코사인 유사도 상위 5개. 최고 유사도가 0.45 미만이면 답을 지어내지 않고 "찾지 못했어요" |

## 실행
1. Ollama 가 켜져 있어야 해요 (`ollama list` 에 `bge-m3`, `exaone3.5:2.4b`).
2. 서버 켜기: `powershell -ExecutionPolicy Bypass -File run.ps1` → http://127.0.0.1:8001
3. 사이트를 로컬(8090)로 열면 오른쪽 아래에 "CS 챗봇" 버튼이 나와요. 서버가 꺼져 있으면 버튼이 안 나와요.

## 문서 고치기
`docs/` 의 md 파일을 고친 뒤 `.venv\Scripts\python.exe build_index.py` 로 인덱스를 다시 만들고 서버를 재시작.

## 처음부터 설치
```
pyenv install 3.12.10
pyenv local 3.12.10
%USERPROFILE%\.pyenv\pyenv-win\versions\3.12.10\python.exe -m venv .venv
.venv\Scripts\python.exe -m pip install langchain langchain-ollama langchain-text-splitters fastapi "uvicorn[standard]" numpy
ollama pull bge-m3
ollama pull exaone3.5:2.4b
```
(사용자 폴더 이름이 한글이라 `pyenv which python` 경로가 깨져요 → 위처럼 전체 경로로 실행)

## 모델 다시 비교
`.venv\Scripts\python.exe bench.py` (질문 9개 × 후보 4개, 이 PC에서 약 15분). 다른 모델은 `python bench.py llama3.2:3b` 처럼 이름을 주면 돼요.

## 한계
LLM 이 이 PC 에서 돌기 때문에 배포 사이트(Vercel) 방문자는 쓸 수 없어요. 배포 사이트에서 버튼은 숨겨져 있어요. 공개하려면 서버를 외부에서 접속 가능한 곳에 두고 `window.CHATBOT_API` 에 주소를 넣어야 해요.
