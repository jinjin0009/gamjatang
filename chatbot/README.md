# 감자탕 감별사 CS·사이트 소개 챗봇 (로컬 RAG)

질문 → `docs/*.md` 에서 코사인 유사도가 가장 높은 청크 5개를 찾음 → LLM(ChatGPT, 키가 없으면 로컬 Ollama)이 그 내용만으로 답함. 채팅창에 참고한 청크 5개와 각각의 유사도가 함께 보여요.

| 항목 | 값 |
|---|---|
| Python | 3.12.10 (pyenv-win, `.python-version`) + 가상환경 `.venv` |
| 프레임워크 | LangChain (`langchain-ollama`, `InMemoryVectorStore`) + FastAPI |
| 임베딩 | `.env` 에 `UPSTAGE_API_KEY` 가 있으면 Upstage(`embedding-passage`/`embedding-query`), 없으면 `bge-m3` (Ollama). 인덱스는 `index-upstage.json` / `index-ollama.json` 로 따로 저장 |
| LLM | `.env` 에 `OPENAI_API_KEY` 가 있으면 ChatGPT(`OPENAI_MODEL`, 지금 `gpt-5-mini`, 평균 1.4초, 시험 10/10). 없으면 `exaone3.5:2.4b` (Ollama, `bench.py` 비교 1위, 평균 24초, 결과는 `bench-result.md`). Ollama 로 되돌리려면 `CHATBOT_LLM_PROVIDER=ollama` |
| 청크 | 400자, 겹침 60자(15%) — 실제 이웃 청크 겹침 11.6~15.2% |
| 검색 | 코사인 유사도 상위 5개. 최고 유사도가 기준(bge-m3 0.45, Upstage 0.30 임시값) 미만이면 답을 지어내지 않고 "찾지 못했어요" |

## Upstage 임베딩 쓰기
1. https://console.upstage.ai/api-keys 에서 키를 만들어 `gamjatang/.env` 의 `UPSTAGE_API_KEY=` 뒤에 붙여 넣기 (가입 시 무료 크레딧, 다 쓰면 유료)
2. `.venv\Scripts\python.exe build_index.py` → `index-upstage.json` 생성 (문서 조각이 Upstage 서버로 전송됨)
3. 서버 재시작. 채팅창 위쪽에 `임베딩 upstage:embedding` 으로 표시됨
4. Upstage 점수 분포에 맞게 `CHATBOT_MIN_SCORE` 기준값을 다시 맞출 것
- Ollama 로 되돌리려면 `CHATBOT_EMBED_PROVIDER=ollama` (또는 키를 비움)

## 실행
1. `.env` 에 Upstage·OpenAI 키가 없으면 Ollama 가 켜져 있어야 해요 (`ollama list` 에 `bge-m3`, `exaone3.5:2.4b`).
2. 서버 켜기: `powershell -ExecutionPolicy Bypass -File run.ps1` → http://127.0.0.1:8001
3. 사이트를 로컬(8090)로 열면 오른쪽 아래에 "CS 챗봇" 버튼이 나와요. 서버가 꺼져 있으면 버튼이 안 나와요.

## 문서 고치기
`docs/` 의 md 파일을 고친 뒤 `.venv\Scripts\python.exe build_index.py` 로 인덱스를 다시 만들고 서버를 재시작.

## 다른 PC 에서 쓰기
1. 저장소를 받고 `gamjatang/chatbot` 에서 `powershell -ExecutionPolicy Bypass -File setup.ps1` (pyenv-win 필요)
2. 처음이면 `gamjatang/.env` 가 `.env.example` 로 만들어짐 → `UPSTAGE_API_KEY`, `OPENAI_API_KEY` 붙여 넣기 (키는 git 에 없음)
3. `powershell -ExecutionPolicy Bypass -File run.ps1` → 첫 실행 때 인덱스(`index-*.json`)를 자동으로 만듦
4. 다른 창에서 `gamjatang` 폴더의 `powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8090` → http://localhost:8090/index.html
- 키를 비우면 Ollama 를 써요. 그때는 `ollama pull bge-m3`, `ollama pull exaone3.5:2.4b` 필요

## 처음부터 설치 (수동)
```
pyenv install 3.12.10
pyenv local 3.12.10
%USERPROFILE%\.pyenv\pyenv-win\versions\3.12.10\python.exe -m venv .venv
.venv\Scripts\python.exe -m pip install langchain langchain-ollama langchain-upstage langchain-openai langchain-text-splitters python-dotenv fastapi "uvicorn[standard]" numpy
ollama pull bge-m3
ollama pull exaone3.5:2.4b
```
(사용자 폴더 이름이 한글이라 `pyenv which python` 경로가 깨져요 → 위처럼 전체 경로로 실행)

## 모델 다시 비교
`.venv\Scripts\python.exe bench.py` (질문 9개 × 후보 4개, 이 PC에서 약 15분). 다른 모델은 `python bench.py llama3.2:3b` 처럼 이름을 주면 돼요.

## 비용
Upstage 임베딩(질문마다 1번)과 ChatGPT 답변(질문마다 1번)은 유료 API 예요. 무료로만 쓰려면 두 키를 `.env` 에서 비우면 Ollama 로 돌아가요.

## 배포 사이트 (Vercel)
- `api/chatbot.py` (Vercel 서버 함수, 무료 요금제) 가 `rag.py` 를 그대로 써서 답해요. 패키지는 저장소 맨 위 `requirements.txt`, 설정은 `vercel.json`.
- 인덱스는 `chatbot/index-upstage.json` 을 git 에 올려서 씀 → `docs/` 를 고치면 `build_index.py` 다시 실행하고 함께 commit.
- 키는 Vercel 프로젝트 Settings → Environment Variables 에 `UPSTAGE_API_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL` 로 넣고 다시 배포(Redeploy). 키가 없으면 `/api/chatbot` 이 503 을 주고 채팅창 버튼이 안 보여요.
- 요금 보호: IP 당 1시간 20번, 질문 300자까지. (서버 함수가 여러 개 뜨면 제한이 나뉘어 완벽하진 않음 → OpenAI·Upstage 콘솔에서 월 사용 한도도 걸어 둘 것)
