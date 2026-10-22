/* CS·사이트 소개 챗봇 — RAG 서버에 질문을 보내고 답변과 함께 참고한 문서 5개의 코사인 유사도를 보여 줌.
   - 로컬 미리보기: 이 PC 의 chatbot/server.py (127.0.0.1:8001)
   - 배포 사이트: Vercel 서버 함수 api/chatbot.py (/api/chatbot)
   서버가 응답하지 않으면(키 미설정 등) 버튼이 나타나지 않음. */
const Chatbot = {
  api: window.CHATBOT_API || (["localhost", "127.0.0.1"].includes(location.hostname) ? "http://127.0.0.1:8001" : "/api/chatbot"),
  busy: false,

  async init() {
    try {
      const res = await fetch(this.api + "/health", { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return;
      this.info = await res.json();
    } catch { return; }
    this.mount();
  },

  mount() {
    const box = document.createElement("div");
    box.className = "cb";
    box.innerHTML = `
      <button class="cb__fab" type="button" aria-expanded="false" aria-controls="cbPanel">${icon("info")}<span>CS 챗봇</span></button>
      <section class="cb__panel" id="cbPanel" hidden aria-label="감자탕 감별사 CS 챗봇">
        <header class="cb__head">
          <div><b>BONE CLUB 챗봇</b><div class="mono cb__sub">${esc(this.info.llm)} · 임베딩 ${esc(this.info.embed)} · 상위 ${this.info.top_k}개</div></div>
          <button class="cb__x" type="button" aria-label="챗봇 닫기">${icon("x")}</button>
        </header>
        <div class="cb__log" aria-live="polite"></div>
        <div class="cb__chips">${["회원가입은 어떻게 해요?", "XP는 어떻게 모아요?", "감자탕 MBTI가 뭐예요?", "탈퇴하고 싶어요"].map((q) => `<button type="button">${q}</button>`).join("")}</div>
        <form class="cb__form"><input class="input" maxlength="500" placeholder="사이트 이용 방법을 물어보세요" aria-label="질문"><button class="btn btn--lime" type="submit">보내기</button></form>
      </section>`;
    document.body.appendChild(box);
    const fab = $(".cb__fab", box), panel = $(".cb__panel", box), input = $("input", box);
    const toggle = (open) => { panel.hidden = !open; fab.setAttribute("aria-expanded", open); if (open) input.focus(); };
    fab.onclick = () => toggle(panel.hidden);
    $(".cb__x", box).onclick = () => toggle(false);
    $(".cb__chips", box).onclick = (e) => { const b = e.target.closest("button"); if (b) this.ask(b.textContent); };
    $(".cb__form", box).onsubmit = (e) => { e.preventDefault(); const q = input.value.trim(); if (q) { input.value = ""; this.ask(q); } };
    this.log = $(".cb__log", box);
    this.say("bot", "안녕하세요! 감자탕 감별사 이용 방법이나 사이트 소개를 물어보세요. 답할 때 참고한 문서와 유사도도 함께 보여 드려요.");
  },

  say(who, html) {
    const el = document.createElement("div");
    el.className = `cb__msg cb__msg--${who}`;
    el.innerHTML = html;
    this.log.appendChild(el);
    this.log.scrollTop = this.log.scrollHeight;
    return el;
  },

  async ask(q) {
    if (this.busy) return;
    this.busy = true;
    this.say("me", esc(q));
    const wait = this.say("bot", '<span class="cb__dots">문서를 찾고 답을 쓰는 중이에요</span>');
    try {
      const res = await fetch(this.api + "/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || res.status);
      wait.innerHTML = `<p>${esc(r.answer).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>
        <details class="cb__src"><summary>참고 문서 ${r.sources.length}개 · 최고 유사도 <b>${r.best_score.toFixed(3)}</b></summary>
          <ol>${r.sources.map((s) => `<li><div class="cb__bar"><i style="width:${Math.max(0, s.score) * 100}%"></i></div>
            <span class="mono">${s.score.toFixed(3)}</span> ${esc(s.section || s.source)}<p>${esc(s.text.slice(0, 160))}…</p></li>`).join("")}</ol>
          <div class="mono cb__sub">코사인 유사도 (1에 가까울수록 질문과 비슷함)${r.model ? ` · 검색 ${r.search_ms}ms · 답변 ${(r.llm_ms / 1000).toFixed(1)}초` : ` · 기준(${this.info.min_score}) 미만이라 답을 지어내지 않았어요`}</div></details>`;
    } catch (ex) {
      wait.innerHTML = /^\d+$|fetch/i.test(ex.message) ? "챗봇 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요." : esc(ex.message);
    }
    this.log.scrollTop = this.log.scrollHeight;
    this.busy = false;
  },
};

(function chatbotStyle() {
  const css = document.createElement("style");
  css.textContent = `
  .cb__fab { position: fixed; right: 20px; bottom: 20px; z-index: 70; display: flex; align-items: center; gap: 6px; background: var(--ink); color: var(--lime); border: var(--line); box-shadow: 4px 4px 0 var(--lime); padding: 12px 16px; font-weight: 800; }
  .cb__panel { position: fixed; right: 20px; bottom: 84px; z-index: 70; width: min(400px, calc(100vw - 32px)); height: min(600px, calc(100vh - 120px)); display: flex; flex-direction: column; background: var(--paper); border: var(--line); box-shadow: var(--shadow-lg); }
  .cb__panel[hidden] { display: none; }
  .cb__head { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--lime); border-bottom: var(--line); }
  .cb__sub { font-size: 11px; opacity: .75; }
  .cb__x { width: 32px; height: 32px; display: grid; place-items: center; }
  .cb__log { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .cb__msg { max-width: 88%; padding: 10px 12px; border: 2px solid var(--ink); line-height: 1.5; overflow-wrap: anywhere; }
  .cb__msg--bot { align-self: flex-start; background: var(--bg); }
  .cb__msg--me { align-self: flex-end; background: var(--ink); color: var(--paper); }
  .cb__src { margin-top: 8px; font-size: 12.5px; }
  .cb__src summary { cursor: pointer; font-weight: 700; }
  .cb__src ol { margin: 8px 0; padding-left: 18px; display: grid; gap: 8px; }
  .cb__src li p { opacity: .7; margin-top: 2px; }
  .cb__bar { height: 6px; background: #e3ddd0; border: 1px solid var(--ink); margin-bottom: 2px; }
  .cb__bar i { display: block; height: 100%; background: var(--green); }
  .cb__chips { display: flex; gap: 6px; overflow-x: auto; padding: 0 14px 10px; }
  .cb__chips button { flex: none; border: 2px solid var(--ink); padding: 4px 10px; font-size: 12.5px; background: var(--bg); }
  .cb__form { display: flex; gap: 8px; padding: 12px 14px; border-top: var(--line); }
  .cb__form .input { flex: 1; min-width: 0; }
  .cb__dots::after { content: "…"; animation: cbDots 1s steps(3) infinite; }
  @keyframes cbDots { 0% { opacity: .2; } 100% { opacity: 1; } }
  @media (max-width: 860px) {
    .cb__fab { right: 16px; bottom: calc(var(--tab-h) + env(safe-area-inset-bottom) + 14px); }
    .cb__panel { right: 16px; bottom: calc(var(--tab-h) + env(safe-area-inset-bottom) + 76px); height: min(560px, calc(100vh - var(--tab-h) - 160px)); }
  }`;
  document.head.appendChild(css);
})();
