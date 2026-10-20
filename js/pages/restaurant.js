/* 식당 상세 · 방문 기록/인증 · 후기 작성(게임) · 후기 상세 */

const VISIT_TEXT = {
  none: ["아직 방문 기록이 없어요", "방문하고 도장을 받아 보세요."],
  self: ["방문 기록 도장 (미인증)", "직접 남긴 방문 기록이에요. 영수증 인증을 요청하면 인증 도장과 XP를 받을 수 있어요."],
  pending: ["방문 인증 확인 중", "관리자가 영수증을 확인하고 있어요. 승인되면 인증 도장으로 바뀌어요."],
  verified: ["방문 인증 완료!", "인증 도장을 받았어요."],
  rejected: ["방문 인증 반려", "영수증을 확인하지 못했어요. 다시 요청할 수 있어요."],
};

Router.add("/r/:id", (app, { id }) => {
  const r = Store.restaurant(id);
  if (!r) {
    app.innerHTML = `<div class="wrap">${UI.empty("식당을 찾을 수 없어요", "삭제됐거나 주소가 잘못됐어요.", `<a class="btn btn--lime" href="#/map">지도에서 찾기</a>`)}</div>`;
    return;
  }
  let sortBy = "new";

  const draw = () => {
    if (cleanup) cleanup();
    const st = Store.stats(id);
    const me = Store.me();
    const visit = me ? Store.visitOf(id) : null;
    const vs = visit ? visit.status : "none";
    const mine = Store.myReviewFor(id);
    const saved = Store.isSaved(id);
    document.title = `${r.name} — ${r.district || r.region} 감자탕 | 감자탕 감별사야`;
    const reviews = Store.visibleReviews((x) => x.rid === id).sort((a, b) => (sortBy === "new" ? b.date.localeCompare(a.date) : Store.likesOf(b) - Store.likesOf(a)));

    app.innerHTML = `<div class="wrap">
      <nav class="crumb"><a href="#/map">MAP</a> / <a href="#/map?region=${encodeURIComponent(r.region)}">${esc(r.region)}</a> / <span>${esc(r.name)}</span></nav>
      <section class="detail-hero">
        <div class="detail-hero__img">${thumbHTML(r)}${r.sample ? '<span class="sample-flag">예시 데이터 · 가상 식당</span>' : ""}</div>
        <div>
          <div class="row gap-s fw">${r.isNew ? '<span class="tag tag--lime">NEW</span>' : ""}${r.oldSchool ? '<span class="tag">노포</span>' : ""}${r.since ? `<span class="tag tag--ghost">SINCE ${r.since}</span>` : ""}${r.open24 ? '<span class="tag tag--ink">24H</span>' : ""}${r.brothStyle ? `<span class="tag">국물 ${esc(r.brothStyle)}</span>` : ""}</div>
          <h1 class="detail-hero__name">${esc(r.name)}</h1>
          <p class="muted">${esc(r.intro || "")}</p>
          ${r.real ? `<p class="small muted mt-s">${icon("info")} 가게 정보 출처: ${r.sourceUrl ? `<a class="link" href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">OpenStreetMap</a>` : "OpenStreetMap"} (© OpenStreetMap contributors). 폐업·이전 등으로 실제와 다를 수 있어요.</p>` : ""}
          <div class="score-big">
            <span class="score-big__n">${fmt1(st.overall)}</span>
            <div>${bonesHTML(st.overall, "lg")}<div class="small mt-s">사용자 후기 <b>${st.count}</b>개 · 방문 인증 <b>${st.verified}</b>회</div>
              ${!st.count ? `<div class="small" style="font-weight:800">${icon("flag")} 아직 후기가 없어요 — 첫 감별사가 되면 '개척자' 미션 달성!</div>` : st.lowSample ? `<div class="small" style="color:var(--red);font-weight:800">${icon("info")} 후기가 ${st.count}개뿐이라 점수가 바뀔 수 있어요 (표본 적음)</div>` : ""}</div>
          </div>
          <div class="action-row">
            <a class="btn btn--lime btn--lg" href="#/write/${r.id}">${icon("edit")} ${mine ? "내 후기 수정하기" : "REVIEW & EARN XP"}</a>
            <button class="btn btn--lg" id="visitBtn">${icon("stamp")} ${vs === "none" ? "방문 기록·인증" : "도장 상태"}</button>
            <button class="btn btn--lg ${saved ? "btn--red" : ""}" id="saveBtn" aria-pressed="${saved}">${icon("heart")} ${saved ? "저장됨" : "저장"}</button>
            <button class="btn btn--lg btn--ghost" id="shareBtn" aria-label="공유">${icon("share")}</button>
          </div>
          <div class="my-stamp-bar">
            ${stampHTML(r, vs === "none" ? null : vs === "rejected" ? null : vs)}
            <div><b>${me ? VISIT_TEXT[vs][0] : "로그인하면 도장을 모을 수 있어요"}</b><div class="small" style="opacity:.8">${me ? VISIT_TEXT[vs][1] : "방문 기록과 인증 도장은 계정에 저장돼요."}</div></div>
          </div>
        </div>
      </section>

      <section class="sec two-col">
        <div>
          <h2 class="h3 mb">${icon("info")} INFO</h2>
          <dl class="info-grid mt">
            <div class="info-cell">${icon("pin")}<div><dt>주소</dt><dd>${r.address ? esc(r.address) : '<span class="unk">미확인</span>'}${r.sample ? ' <span class="small muted">(가상 주소)</span>' : ""}</dd></div></div>
            <div class="info-cell">${icon("clock")}<div><dt>영업시간</dt><dd>${r.hours ? esc(r.hours) : '<span class="unk">미확인</span>'}</dd></div></div>
            <div class="info-cell">${icon("phone")}<div><dt>전화번호</dt><dd>${r.phone ? esc(r.phone) + (r.sample ? ' <span class="small muted">(예시 번호)</span>' : "") : '<span class="unk">미확인</span>'}</dd></div></div>
            <div class="info-cell">${icon("coin")}<div><dt>가격대</dt><dd>${r.price ? priceLabel(r.price) + " " + ["", "저렴", "보통", "높은 편"][r.price] : '<span class="unk">미확인</span>'}</dd></div></div>
            <div class="info-cell">${icon("car")}<div><dt>주차</dt><dd>${r.parking === null || r.parking === undefined ? '<span class="unk">미확인</span>' : r.parking ? "주차 가능" : "주차 불가"}</dd></div></div>
            <div class="info-cell">${icon("user")}<div><dt>혼밥</dt><dd>${r.solo === null || r.solo === undefined ? '<span class="unk">미확인</span>' : r.solo ? "혼밥 가능" : "혼밥 불편"}</dd></div></div>
            <div class="info-cell" style="grid-column:1/-1;border-right:0">${icon("pot")}<div style="flex:1"><dt>메뉴</dt><dd>${(r.menus || []).length ? `<ul class="menu-list">${r.menus.map(([n, p]) => `<li><span>${esc(n)}</span><b class="mono">${won(p)}</b></li>`).join("")}</ul>` : '<span class="unk">미확인</span> <span class="small muted">— 메뉴·가격은 방문 후기와 관리자 확인으로 채워져요</span>'}</dd></div></div>
          </dl>
          <h2 class="h3 mt-l">${icon("bone")} SCORE BREAKDOWN</h2>
          <p class="small muted mt-s">사용자가 매긴 항목별 1~5점의 평균이에요. 전체 평점 = 항목별 평균의 평균.</p>
          <div class="score-rows mt card pad">${SCORE_ITEMS.map((it) => {
            const x = st.items[it.key];
            return `<div class="score-row"><div class="score-row__l"><b>${it.en}</b><span>${it.kr} · ${x.n}명 평가</span></div>
              <div class="bar ${it.key === "broth" ? "bar--red" : it.key === "meat" ? "bar--ink" : ""}"><i style="--w:${x.avg ? x.avg * 20 : 0}%"></i></div><span class="score-row__n">${fmt1(x.avg)}</span></div>`;
          }).join("")}</div>
        </div>
        <div>
          <h2 class="h3">${icon("map")} LOCATION</h2>
          <div class="mini-map mt" id="miniMap"></div>
          <div class="row gap fw mt">
            ${r.mapUrl ? `<a class="btn btn--sm" href="${esc(r.mapUrl)}" target="_blank" rel="noopener">${icon("external")} 네이버 지도에서 보기·길찾기</a>${r.homepage ? `<a class="btn btn--sm" href="${esc(r.homepage)}" target="_blank" rel="noopener">${icon("external")} 홈페이지</a>` : ""}`
              : `<button class="btn btn--sm" disabled>${icon("external")} 길찾기 링크 없음</button><span class="small muted">예시 식당이라 외부 지도 링크가 없어요.</span>`}
          </div>
        </div>
      </section>

      <section class="sec" style="padding-top:0">
        <div class="sec__head"><div><div class="kicker">${icon("edit")} REVIEWS</div><h2 class="h2 mt-s">후기 ${reviews.length}</h2></div>
          <div class="tabs" id="rvSort"><button data-s="new" class="${sortBy === "new" ? "is-on" : ""}">최신순</button><button data-s="like" class="${sortBy === "like" ? "is-on" : ""}">유용한 순</button></div></div>
        <div class="stack" id="rvList">${reviews.length ? reviews.map((x) => reviewCard(x)).join("")
          : UI.empty("아직 후기가 없어요", "첫 후기를 남기면 이 식당의 첫 감별사가 돼요!", `<a class="btn btn--lime" href="#/write/${r.id}">첫 후기 쓰기</a>`)}</div>
      </section>
    </div>`;

    const mm = createMap($("#miniMap", app), { restaurants: [r], showLabels: false });
    mm.focus(r, 70);
    $(".kmap__note", app).textContent = "간이 지도";

    $("#saveBtn", app).onclick = () => {
      if (needLogin("관심 맛집 저장은 로그인 후 이용할 수 있어요")) return;
      const on = Store.toggleSaved(id);
      UI.toast(on ? "관심 맛집에 저장했어요" : "관심 맛집에서 뺐어요");
      draw();
    };
    $("#shareBtn", app).onclick = () => shareLink(r.name, `${r.name} — 감자탕 감별사야`, "/r/" + id);
    $("#visitBtn", app).onclick = () => { if (!needLogin("방문 기록은 로그인 후 남길 수 있어요")) visitModal(id, draw); };
    $("#rvSort", app).onclick = (e) => { const b = e.target.closest("button"); if (b) { sortBy = b.dataset.s; draw(); } };
    bindReviewCards($("#rvList", app), draw);
    cleanup = () => mm.destroy();
  };
  let cleanup = null;
  draw();
  return () => cleanup && cleanup();
});

/* 방문 기록 / 인증 요청 모달 */
function visitModal(rid, onDone) {
  const r = Store.restaurant(rid);
  const v = Store.visitOf(rid);
  const vs = v ? v.status : "none";
  if (vs === "pending" || vs === "verified") {
    UI.modal(`<div class="center" style="display:flex;flex-direction:column;align-items:center;gap:10px">${stampHTML(r, vs)}<h3 class="modal__title">${VISIT_TEXT[vs][0]}</h3><p class="muted">${VISIT_TEXT[vs][1]}</p><p class="small mono">${fmtDate(v.date)} 기록</p></div>`);
    return;
  }
  let choice = vs === "self" || vs === "rejected" ? "pending" : "self";
  let receipt = null;
  const m = UI.modal(`<div class="kicker">${icon("stamp")} STAMP</div><h3 class="modal__title">${esc(r.name)} 도장 받기</h3>
    <div class="stack-s mt">
      ${vs === "none" ? `<button class="visit-opt is-on" data-c="self">${stampHTML(r, "self")}<div><b>방문 기록만 남기기</b><div class="small">점선 '기록 도장'을 받아요. 도장깨기 진행률에는 반영되지만 XP는 없어요.</div></div></button>` : ""}
      <button class="visit-opt ${choice === "pending" ? "is-on" : ""}" data-c="pending">${stampHTML(r, "verified")}<div><b>영수증으로 방문 인증 요청</b><div class="small">관리자 확인 후 '인증 도장'과 +${Store.config().xp.verified} XP를 받아요. 확인 전에는 인증 완료로 표시되지 않아요.</div></div></button>
    </div>
    <div class="field mt" id="rcptField" ${choice === "pending" ? "" : "hidden"}>
      <span class="field__l">영수증 사진 (JPG·PNG·WEBP, 5MB 이하)</span>
      <div class="upload"><label class="btn btn--sm">${icon("camera")} 사진 선택<input type="file" accept="image/jpeg,image/png,image/webp" hidden id="rcpt"></label><img class="upload__prev" id="rcptPrev" hidden alt="영수증 미리보기"></div>
      <span class="field__hint">프로토타입: 사진은 이 브라우저에만 저장되고 서버로 전송되지 않아요.</span>
      <span class="field__err" id="rcptErr"></span>
    </div>
    <button class="btn btn--lime btn--block btn--lg mt" id="doVisit">${icon("stamp")} 도장 쾅!</button>`);
  const box = m.el;
  $$(".visit-opt", box).forEach((b) => (b.onclick = () => {
    choice = b.dataset.c;
    $$(".visit-opt", box).forEach((x) => x.classList.toggle("is-on", x === b));
    $("#rcptField", box).hidden = choice !== "pending";
  }));
  $("#rcpt", box).onchange = async (e) => {
    try { receipt = await readImage(e.target.files[0], 600); $("#rcptPrev", box).src = receipt; $("#rcptPrev", box).hidden = false; $("#rcptErr", box).textContent = ""; }
    catch (err) { $("#rcptErr", box).textContent = err.message; }
  };
  $("#doVisit", box).onclick = () => {
    if (choice === "pending" && !receipt) { $("#rcptErr", box).textContent = "인증 요청에는 영수증 사진이 필요해요."; return; }
    Store.recordVisit(rid, choice, receipt);
    m.close();
    stampCeremony(r, choice);
    onDone && onDone();
  };
}

/* 도장 찍히는 연출 */
function stampCeremony(r, status) {
  const m = UI.modal(`<div class="center" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:10px 0">
    <div class="kicker">${status === "pending" ? "VERIFICATION REQUESTED" : "STAMP GET!"}</div>
    <div class="stamp-in" style="width:150px;height:150px">${stampHTML(r, status === "pending" ? "pending" : "self").replace('class="stamp', 'style="width:150px;height:150px" class="stamp')}</div>
    <h3 class="modal__title">${esc(r.name)}</h3>
    <p class="muted">${status === "pending" ? "인증 요청을 보냈어요. 관리자 확인 후 인증 도장으로 바뀌어요." : "방문 기록 도장을 받았어요. 도장깨기 지도에 표시돼요."}</p>
    <div class="row gap fw center"><a class="btn btn--lime" href="#/stamp">도장깨기 보기</a><button class="btn" data-x>닫기</button></div></div>`);
  $("[data-x]", m.el).onclick = m.close;
  $$("a", m.el).forEach((a) => a.addEventListener("click", m.close));
}

/* ---------------- 후기 작성 (게임형 4단계) ---------------- */
Router.add("/write/:rid", (app, { rid }) => {
  const r = Store.restaurant(rid);
  if (!r) { app.innerHTML = `<div class="wrap">${UI.empty("식당을 찾을 수 없어요", "지도에서 다시 골라 주세요.", `<a class="btn" href="#/map">지도</a>`)}</div>`; return; }
  const existing = Store.myReviewFor(rid);
  const visit = Store.visitOf(rid);
  const cfg = Store.config();
  const S = existing ? {
    items: new Set(Object.keys(existing.scores)), scores: { ...existing.scores }, opts: JSON.parse(JSON.stringify(existing.opts || { best: [] })),
    text: existing.text, photo: existing.photo, visit: "none", receipt: null,
  } : { items: new Set(["broth", "meat", "value"]), scores: {}, opts: { solo: "", parking: "", revisit: null, best: [] }, text: "", photo: null, visit: visit ? "none" : "self", receipt: null };
  if (!S.opts.best) S.opts.best = [];
  let stage = 1;
  const STAGES = ["평가 항목 선택", "항목별 점수", "후기 · 사진", "방문 인증"];

  // 이 지역에서 처음 남기는 기록인지 (새 지역 보너스 미리보기용)
  const p = Store.progress(Store.me().id);
  const myRegions = new Set(p.visits.map((v) => (Store.restaurant(v.rid) || {}).region).concat(p.reviews.map((x) => (Store.restaurant(x.rid) || {}).region)));
  const firstInRegion = !myRegions.has(r.region);

  const draw = () => {
    app.innerHTML = `<div class="wrap narrow" style="padding-top:28px;padding-bottom:60px">
      <nav class="crumb" style="padding-top:0"><a href="#/r/${r.id}">${icon("back")} ${esc(r.name)}</a></nav>
      <div class="kicker">${icon("edit")} ${existing ? "EDIT REVIEW" : "REVIEW & EARN XP"}</div>
      <h1 class="h2 mt-s"><span class="kr">${esc(r.name)}</span> 감별하기</h1>
      ${existing ? `<p class="proto-note mt">${icon("info")} 이미 남긴 후기를 수정하는 중이에요. 같은 식당 후기 보상은 1번만 받을 수 있어서, 수정해도 기본 XP가 다시 지급되지 않아요. (사진을 추가·삭제하면 사진 보너스만 반영)</p>` : ""}
      <div class="stage-head mt">
        <span class="mono" style="font-weight:700">STAGE ${stage}/4</span>
        <div class="stage-dots">${STAGES.map((_, i) => `<i class="${i + 1 < stage ? "on" : i + 1 === stage ? "cur" : ""}"></i>`).join("")}</div>
        <b>${STAGES[stage - 1]}</b>
      </div>
      <div class="card pad q-anim" id="stageBox"></div>
      <div class="row gap mt">
        ${stage > 1 ? `<button class="btn" id="prev">${icon("back")} 이전</button>` : `<a class="btn" href="#/r/${r.id}">취소</a>`}
        <span class="spacer"></span>
        <span class="field__err" id="err"></span>
        <button class="btn ${stage === 4 ? "btn--lime btn--lg" : "btn--ink"}" id="next">${stage === 4 ? (existing ? "수정 완료" : "후기 등록하고 XP 받기") : "다음"} ${icon("arrow")}</button>
      </div>
    </div>`;
    const box = $("#stageBox", app);

    if (stage === 1) {
      box.innerHTML = `<p class="muted mb">평가할 항목을 골라 주세요. (2개 이상) 볶음밥을 안 먹었다면 빼도 돼요.</p>
        <div class="item-pick mt">${SCORE_ITEMS.map((it) => `<button class="item-tog ${S.items.has(it.key) ? "is-on" : ""}" data-k="${it.key}" aria-pressed="${S.items.has(it.key)}">
          <span class="check">${S.items.has(it.key) ? icon("check") : ""}</span>${icon(it.icon)}<b>${it.en}</b><span class="small">${it.kr}</span></button>`).join("")}</div>`;
      box.onclick = (e) => {
        const b = e.target.closest("[data-k]");
        if (!b) return;
        const k = b.dataset.k;
        if (S.items.has(k)) { S.items.delete(k); delete S.scores[k]; } else S.items.add(k);
        draw();
      };
    }

    if (stage === 2) {
      const labels = ["", "별로", "아쉬움", "보통", "좋음", "최고"];
      box.innerHTML = SCORE_ITEMS.filter((it) => S.items.has(it.key)).map((it) => `<div class="rate-row">
        <div class="rate-row__l"><b>${it.en}</b><span class="small muted">${it.kr} · <b data-lbl="${it.key}">${S.scores[it.key] ? S.scores[it.key] + "점 " + labels[S.scores[it.key]] : "점수를 골라 주세요"}</b></span></div>
        <div class="rate-btns" role="radiogroup" aria-label="${it.kr} 점수">${[1, 2, 3, 4, 5].map((n) => `<button class="rate-btn ${S.scores[it.key] >= n ? "on" : ""}" data-k="${it.key}" data-n="${n}" role="radio" aria-checked="${S.scores[it.key] === n}" aria-label="${n}점">${icon("bone")}</button>`).join("")}</div>
      </div>`).join("");
      box.onclick = (e) => {
        const b = e.target.closest("[data-n]");
        if (!b) return;
        const k = b.dataset.k, n = +b.dataset.n;
        S.scores[k] = n;
        $$(`[data-k="${k}"]`, box).forEach((x) => { x.classList.toggle("on", +x.dataset.n <= n); x.setAttribute("aria-checked", +x.dataset.n === n); });
        b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
        $(`[data-lbl="${k}"]`, box).textContent = `${n}점 ${labels[n]}`;
      };
    }

    if (stage === 3) {
      const seg = (key, opts) => `<div class="seg" data-seg="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(S.opts[key]) === v ? "is-on" : ""}">${l}</button>`).join("")}</div>`;
      box.innerHTML = `<div class="stack">
        <div class="field"><label for="txt">한 줄 감별평 (10~300자)</label>
          <textarea class="textarea" id="txt" maxlength="300" placeholder="국물, 고기, 볶음밥… 오늘의 감자탕은 어땠나요?">${esc(S.text)}</textarea>
          <span class="field__hint"><span id="len">${S.text.length}</span>/300</span></div>
        <div class="field"><span class="field__l">사진 (선택 · +${cfg.xp.photo} XP)</span>
          <div class="upload"><label class="btn btn--sm">${icon("camera")} ${S.photo ? "사진 바꾸기" : "사진 추가"}<input type="file" id="photo" accept="image/jpeg,image/png,image/webp" hidden></label>
          ${S.photo ? `<img class="upload__prev" src="${S.photo}" alt="후기 사진 미리보기"><button class="chip-btn" id="rmPhoto">${icon("trash")} 삭제</button>` : ""}</div>
          <span class="field__hint">JPG·PNG·WEBP, 5MB 이하. 프로토타입: 사진은 서버로 올라가지 않고 이 브라우저에만 저장돼요.</span><span class="field__err" id="photoErr"></span></div>
        <div class="field"><span class="field__l">혼밥하기 좋은가요? (선택)</span>${seg("solo", [["good", "좋아요"], ["bad", "불편해요"], ["", "모르겠어요"]])}</div>
        <div class="field"><span class="field__l">주차가 편리한가요? (선택)</span>${seg("parking", [["good", "편리해요"], ["bad", "불편해요"], ["", "모르겠어요"]])}</div>
        <div class="field"><span class="field__l">재방문 의사 (선택)</span>${seg("revisit", [["true", "또 갈래요"], ["false", "한 번이면 충분"]])}</div>
        <div class="field"><span class="field__l">가장 좋았던 점 (최대 2개)</span><div class="chips wrap-chips" id="best">${BEST_POINTS.map((b) => `<button type="button" class="chip ${S.opts.best.includes(b) ? "is-on" : ""}" data-b="${b}">${b}</button>`).join("")}</div></div>
      </div>`;
      $("#txt", box).oninput = (e) => { S.text = e.target.value; $("#len", box).textContent = S.text.length; };
      $("#photo", box).onchange = async (e) => {
        try { S.photo = await readImage(e.target.files[0]); draw(); } catch (err) { $("#photoErr", box).textContent = err.message; }
      };
      if ($("#rmPhoto", box)) $("#rmPhoto", box).onclick = () => { S.photo = null; draw(); };
      $$("[data-seg]", box).forEach((sg) => (sg.onclick = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const k = sg.dataset.seg;
        S.opts[k] = k === "revisit" ? b.dataset.v === "true" : b.dataset.v;
        $$("button", sg).forEach((x) => x.classList.toggle("is-on", x === b));
      }));
      $("#best", box).onclick = (e) => {
        const b = e.target.closest("[data-b]");
        if (!b) return;
        const v = b.dataset.b;
        if (S.opts.best.includes(v)) S.opts.best = S.opts.best.filter((x) => x !== v);
        else if (S.opts.best.length < 2) S.opts.best.push(v);
        else { UI.toast("최대 2개까지 고를 수 있어요"); return; }
        b.classList.toggle("is-on");
      };
    }

    if (stage === 4) {
      const vs = visit ? visit.status : null;
      let opts;
      if (!vs) {
        opts = [["self", "방문 기록만 남기기", "점선 기록 도장 · XP 없음"], ["pending", "영수증으로 인증 요청", `관리자 승인 후 인증 도장 +${cfg.xp.verified} XP`], ["none", "도장 없이 후기만", "방문 기록을 남기지 않아요"]];
      } else if (vs === "self" || vs === "rejected") {
        opts = [["none", "지금 도장 상태 유지", vs === "self" ? "기록 도장 유지" : "인증 반려 상태"], ["pending", "영수증으로 인증 요청", `관리자 승인 후 +${cfg.xp.verified} XP`]];
      } else opts = null;
      const xpRows = [];
      if (!existing) xpRows.push(["기본 후기 작성", cfg.xp.review]);
      if (S.photo && !(existing && existing.photo)) xpRows.push(["사진 후기 보너스", cfg.xp.photo]);
      if (existing && existing.photo && !S.photo) xpRows.push(["사진 삭제", -cfg.xp.photo]);
      if (firstInRegion && !existing) xpRows.push([`새 지역(${r.region}) 첫 기록`, cfg.xp.newRegion]);
      const total = xpRows.reduce((a, b) => a + b[1], 0);
      box.innerHTML = `${opts ? `<p class="muted">방문 인증 방법을 골라 주세요. 실제 방문이 확인되지 않으면 '인증 완료'로 표시되지 않아요.</p>
        <div class="stack-s mt">${opts.map(([v, t, d]) => `<button class="visit-opt ${S.visit === v ? "is-on" : ""}" data-v="${v}">${stampHTML(r, v === "none" ? null : v === "pending" ? "verified" : "self")}<div><b>${t}</b><div class="small">${d}</div></div></button>`).join("")}</div>
        <div class="field mt" id="rcptField" ${S.visit === "pending" ? "" : "hidden"}><span class="field__l">영수증 사진</span>
          <div class="upload"><label class="btn btn--sm">${icon("camera")} 영수증 선택<input type="file" id="rcpt" accept="image/jpeg,image/png,image/webp" hidden></label>${S.receipt ? `<img class="upload__prev" src="${S.receipt}" alt="영수증">` : ""}</div>
          <span class="field__hint">프로토타입: 영수증은 관리자 화면(이 브라우저)에서만 확인돼요.</span><span class="field__err" id="rcptErr"></span></div>`
        : `<div class="row gap">${stampHTML(r, vs)}<div><b>${VISIT_TEXT[vs][0]}</b><p class="small muted">${VISIT_TEXT[vs][1]}</p></div></div>`}
        <div class="xp-preview mt"><div class="kicker">${icon("spark")} 예상 획득 XP</div>
          <ul>${xpRows.length ? xpRows.map(([l, x]) => `<li><span>${l}</span><span>${x > 0 ? "+" : ""}${x}</span></li>`).join("") : "<li><span>수정은 추가 XP가 없어요</span><span>0</span></li>"}
          <li class="total"><span>합계</span><span>${total > 0 ? "+" : ""}${total} XP</span></li></ul>
          ${S.visit === "pending" ? `<p class="small mt-s">+ 인증 승인 시 ${cfg.xp.verified} XP 추가 · 미션 달성 시 보너스 XP</p>` : '<p class="small mt-s">+ 미션 달성 시 보너스 XP</p>'}</div>`;
      $$(".visit-opt", box).forEach((b) => (b.onclick = () => { S.visit = b.dataset.v; draw(); }));
      if ($("#rcpt", box)) $("#rcpt", box).onchange = async (e) => {
        try { S.receipt = await readImage(e.target.files[0], 600); draw(); } catch (err) { $("#rcptErr", box).textContent = err.message; }
      };
    }

    if ($("#prev", app)) $("#prev", app).onclick = () => { stage--; draw(); };
    $("#next", app).onclick = () => {
      const err = $("#err", app);
      if (stage === 1 && S.items.size < 2) { err.textContent = "2개 이상 골라 주세요"; return; }
      if (stage === 2 && [...S.items].some((k) => !S.scores[k])) { err.textContent = "모든 항목에 점수를 매겨 주세요"; return; }
      if (stage === 3 && S.text.trim().length < 10) { err.textContent = "후기를 10자 이상 써 주세요"; $("#txt", app).focus(); return; }
      if (stage === 4) { submit(); return; }
      stage++; draw();
    };
  };

  const submit = () => {
    const err = $("#err", app);
    if (S.visit === "pending" && !S.receipt) { err.textContent = "인증 요청에는 영수증 사진이 필요해요"; return; }
    const scores = {};
    S.items.forEach((k) => (scores[k] = S.scores[k]));
    const payload = { rid, scores, opts: S.opts, text: S.text.trim(), photo: S.photo, visit: S.visit, receipt: S.receipt };
    const btn = $("#next", app);
    btn.disabled = true; btn.textContent = "저장 중…";
    let out;
    try { out = existing ? Store.updateReview(existing.id, payload) : Store.addReview(payload); }
    catch (e) { btn.disabled = false; btn.textContent = "다시 시도"; err.textContent = e.message; return; }
    rewardScreen(r, out, !!existing, S.visit);
  };

  const rewardScreen = (r, out, edited, visitChoice) => {
    const ev = out.events;
    const p2 = Store.progress(Store.me().id);
    app.innerHTML = `<div class="wrap narrow"><div class="reward">
      <div class="kicker">${edited ? "REVIEW UPDATED" : "REVIEW COMPLETE"}</div>
      <div class="reward__xp mt">+<span id="xpN">0</span><small> XP</small></div>
      <p class="muted">${edited ? "후기를 수정했어요." : `${esc(r.name)} 감별 완료!`} 지금 총 <b>${p2.xp} XP</b> · ${levelChip(p2.level)}</p>
      ${visitChoice === "self" || visitChoice === "pending" ? `<div class="stamp-in" style="width:120px;height:120px;margin:24px auto 0">${stampHTML(r, visitChoice === "pending" ? "pending" : "self").replace('class="stamp', 'style="width:120px;height:120px" class="stamp')}</div>
        <p class="small mt-s">${visitChoice === "pending" ? `인증 요청 완료 — 승인되면 +${Store.config().xp.verified} XP` : "기록 도장을 받았어요"}</p>` : ""}
      ${ev.missions.length ? `<div class="stack-s mt">${ev.missions.map((m) => `<div class="tag tag--ink" style="font-size:13px;padding:6px 10px">MISSION CLEAR · ${esc(m.title)} +${m.xp}</div>`).join("")}</div>` : ""}
      <div class="row gap fw center mt-l">
        <a class="btn btn--lime btn--lg" href="#/r/${r.id}">식당으로</a><a class="btn btn--lg" href="#/profile?tab=reviews">내 후기 보기</a><a class="btn btn--lg" href="#/stamp">도장깨기</a>
      </div></div></div>`;
    UI.countUp($("#xpN", app), Math.max(0, ev.xpGained));
    if (ev.xpGained > 0) {
      const f = document.createElement("div");
      f.className = "float-xp"; f.textContent = `+${ev.xpGained} XP`;
      f.style.left = "50%"; f.style.top = "40%"; f.style.marginLeft = "-60px";
      document.body.appendChild(f); setTimeout(() => f.remove(), 1400);
    }
    App.renderChrome(Router.parse().path);
  };

  draw();
}, { auth: true, authMsg: "후기를 남기고 XP를 받으려면 로그인해 주세요." });

/* ---------------- 후기 상세 ---------------- */
Router.add("/review/:id", (app, { id }) => {
  const draw = () => {
    const rv = Store.review(id);
    const visible = rv && Store.visibleReviews((x) => x.id === id).length;
    if (!rv || !visible) {
      app.innerHTML = `<div class="wrap narrow">${UI.empty("후기를 볼 수 없어요", "삭제됐거나 비공개로 바뀐 후기예요.", `<a class="btn" href="#/map">지도로</a>`)}</div>`;
      return;
    }
    const r = Store.restaurant(rv.rid);
    app.innerHTML = `<div class="wrap narrow" style="padding-bottom:40px">
      <nav class="crumb">${r ? `<a href="#/r/${r.id}">${icon("back")} ${esc(r.name)}</a>` : ""}</nav>
      <div class="kicker">${icon("edit")} REVIEW</div><h1 class="h2 mt-s mb">감별 리포트</h1>
      <div class="mt" id="one">${reviewCard(rv, { showRestaurant: true, link: false })}</div>
      ${r ? `<div class="mt-l"><h2 class="h3 mb">이 식당</h2><div class="grid grid--2 mt" id="rc">${restaurantCard(r)}</div></div>` : ""}
    </div>`;
    bindReviewCards($("#one", app), () => (Store.review(id) ? draw() : Router.go(r ? "/r/" + r.id : "/")));
    if ($("#rc", app)) bindRestaurantCards($("#rc", app));
  };
  draw();
});
