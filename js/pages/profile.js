/* 개인 프로필 — 내 프로필(/profile) · 다른 사용자 공개 프로필(/u/:id) */

const PROFILE_TABS = [
  ["overview", "OVERVIEW"], ["reviews", "MY REVIEWS"], ["stamps", "STAMP COLLECTION"], ["type", "MY TANG TYPE"], ["saved", "SAVED PLACES"], ["settings", "SETTINGS"],
];
const ACT_ICON = { join: "spark", review: "edit", stamp: "stamp", mission: "flag", badge: "trophy", level: "spark", mbti: "user" };

function profileData(u) {
  const sample = !Store.db.users[u.id];
  if (sample) {
    const reviews = SAMPLE_REVIEWS.filter((r) => r.uid === u.id);
    const lv = levelOf(u.sampleXp, Store.config().levels);
    return { sample: true, xp: u.sampleXp, level: lv, reviews, visits: [], verified: [], badges: [], missions: [], regions: [], activity: [] };
  }
  const p = Store.progress(u.id);
  return Object.assign(p, { reviews: Store.visibleReviews((r) => r.uid === u.id && !r.sample), activity: Store.db.activity.filter((a) => a.uid === u.id) });
}

function renderProfile(app, u, isMe, tab) {
  const d = profileData(u);
  const mbti = Store.mbtiOf(u.id);
  const t = mbti ? MBTI_TYPES[mbti.type] : null;
  const saved = isMe ? Store.savedOf(u.id) : [];
  const tabs = isMe ? PROFILE_TABS : PROFILE_TABS.filter(([k]) => ["overview", "reviews", "type"].includes(k));
  if (!tabs.find(([k]) => k === tab)) tab = "overview";
  const tabLabel = (k, l) => (isMe ? l : l.replace("MY ", ""));

  app.innerHTML = `<div class="wrap" style="padding:32px 24px 60px">
    ${!isMe ? `<nav class="crumb" style="padding-top:0">${icon("user")} 공개 프로필${d.sample ? " · 예시 사용자" : ""}</nav>` : ""}
    <section class="profile-head">
      ${avatarHTML(u, 96)}
      <div style="min-width:0">
        <div class="row gap-s fw">${levelChip(d.level)}${t ? `<span class="tag" style="background:${t.color};color:${t.ink}">${t.name}</span>` : ""}</div>
        <h1 class="profile-head__name mt-s">${esc(u.nick)}</h1>
        <p class="mt-s">${esc(u.bio || (isMe ? "한 줄 소개를 써 보세요 (SETTINGS)" : ""))}</p>
        <p class="small muted mono mt-s">JOINED ${fmtDate(u.joined)}</p>
      </div>
      <div class="xp-box"><div class="row" style="justify-content:space-between"><span class="mono small" style="font-weight:700">XP ${d.xp}</span><span class="mono small">${d.level.next !== null ? `NEXT ${d.level.next}` : "MAX LEVEL"}</span></div>
        <div class="bar striped"><i style="--w:${d.level.pct}%"></i></div>
        <p class="small muted mt-s">${d.level.next !== null ? `다음 레벨 ${LEVEL_NAMES[d.level.n]}까지 ${d.level.next - d.xp} XP` : "최고 레벨 달성!"}</p></div>
    </section>
    <div class="count-strip">
      <div><b>${d.sample ? "-" : d.visits.length}</b><span>방문 식당</span></div>
      <div><b>${d.sample ? "-" : d.verified.length}</b><span>인증 도장</span></div>
      <div><b>${d.sample ? "-" : d.badges.length}</b><span>배지</span></div>
      <div><b>${d.reviews.length}</b><span>후기</span></div>
      <div><b>${t ? t.key : "-"}</b><span>MBTI</span></div>
    </div>
    <div class="tabs mt-l" id="ptabs">${tabs.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? "is-on" : ""}">${tabLabel(k, l)}</button>`).join("")}</div>
    <div class="mt" id="pbody"></div>
  </div>`;

  const body = $("#pbody", app);
  const go = (k) => {
    $$("#ptabs button", app).forEach((b) => b.classList.toggle("is-on", b.dataset.t === k));
    if (isMe) history.replaceState(null, "", "#/profile?tab=" + k);
    tab = k;
    drawTab();
  };
  $("#ptabs", app).onclick = (e) => { const b = e.target.closest("button"); if (b) go(b.dataset.t); };

  const drawTab = () => {
    if (tab === "overview") {
      const recent = d.sample ? [] : d.visits.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
      body.innerHTML = `<div class="two-col">
        <div>
          <h2 class="h3">${icon("trophy")} ${isMe ? "대표 배지" : "배지"}</h2>
          <div class="card pad mt"><div class="badge-row">${d.sample ? '<p class="muted small">예시 사용자는 배지 정보가 없어요.</p>'
            : Object.keys(BADGES).map((b) => badgeHTML(b, { locked: !d.badges.includes(b) })).join("")}</div></div>
          <h2 class="h3 mt-l">${icon("pin")} 최근 방문</h2>
          <div class="mt">${recent.length ? `<div class="grid grid--2" id="recentR">${recent.map((v) => restaurantCard(Store.restaurant(v.rid))).join("")}</div>`
            : UI.empty("방문 기록이 없어요", d.sample ? "예시 사용자예요." : "식당 상세 화면에서 '방문 기록·인증'으로 도장을 받아 보세요.", isMe ? `<a class="btn btn--sm btn--lime" href="#/map">맛집 찾기</a>` : "")}</div>
        </div>
        <div>
          <h2 class="h3">${icon("clock")} 최근 활동</h2>
          <div class="card pad mt">${d.activity.length ? `<ul class="activity">${d.activity.slice(0, 12).map((a) => `<li>${icon(ACT_ICON[a.type] || "spark")}<span>${esc(a.text)}</span><span class="small muted mono">${fmtDate(a.date)}</span></li>`).join("")}</ul>` : '<p class="muted small">아직 활동이 없어요.</p>'}</div>
          ${isMe && !d.sample ? `<h2 class="h3 mt-l">${icon("spark")} XP 내역</h2><div class="card pad mt"><ul class="activity">${d.xpLog.length ? d.xpLog.slice().reverse().slice(0, 12).map((x) => `<li>${icon("spark")}<span>${esc(x.src)}</span><b class="mono">+${x.xp}</b></li>`).join("") : '<li><span></span><span class="muted small">후기·인증·미션으로 XP를 모아요</span><span></span></li>'}</ul></div>` : ""}
        </div>
      </div>`;
      if ($("#recentR", body)) bindRestaurantCards($("#recentR", body));
    }

    if (tab === "reviews") {
      const list = d.reviews.slice().sort((a, b) => b.date.localeCompare(a.date));
      const priv = isMe && u.reviewVisibility === "private";
      body.innerHTML = `${priv ? `<p class="proto-note mb">${icon("eyeoff")} 후기 공개 범위가 '나만 보기'예요. 다른 사람에게는 보이지 않고 식당 평점에도 반영되지 않아요.</p>` : ""}
        ${list.length ? `<div class="stack mt" id="rvs">${list.map((r) => reviewCard(r, { showRestaurant: true })).join("")}</div>`
          : UI.empty("작성한 후기가 없어요", isMe ? "식당 상세에서 REVIEW & EARN XP로 첫 후기를 남겨 보세요." : "아직 공개된 후기가 없어요.", isMe ? `<a class="btn btn--sm btn--lime" href="#/map?review=1">후기 쓸 식당 찾기</a>` : "")}`;
      if ($("#rvs", body)) bindReviewCards($("#rvs", body), () => renderProfile(app, Store.me(), true, "reviews"));
    }

    if (tab === "stamps") {
      const total = Store.restaurants().length;
      body.innerHTML = `<div class="row gap fw"><div class="kpi"><span class="mono small">도장깨기 진행률</span><b>${total ? Math.round((d.visits.length / total) * 100) : 0}%</b></div>
        <div class="kpi"><span class="mono small">완료 미션</span><b>${d.missions.filter((m) => m.done).length}/${d.missions.length}</b></div>
        <a class="btn" href="#/stamp">${icon("map")} 도장깨기 지도</a></div>
        <h2 class="h3 mt-l">획득한 도장</h2>
        <div class="stamp-grid mt">${d.visits.length ? d.visits.map((v) => { const r = Store.restaurant(v.rid); return `<a class="stamp-tile" href="#/r/${r.id}">${stampHTML(r, v.status)}<b>${esc(r.name)}</b><span class="small muted">${fmtDate(v.date)}</span></a>`; }).join("")
          : `<div style="grid-column:1/-1">${UI.empty("아직 도장이 없어요", "식당에 방문하고 도장을 받아 보세요.")}</div>`}</div>
        <h2 class="h3 mt-l">미션 현황</h2><div class="mt">${d.missions.map(missionRow).join("")}</div>`;
    }

    if (tab === "type") {
      body.innerHTML = t ? `<div class="result-hero" style="background:${t.color};color:${t.ink}"><div>${typeArtSVG(t, 140)}</div>
          <div><div class="kicker">${mbti.sample ? "TANG TYPE" : `${fmtDate(mbti.date)} 저장`}</div><h2 class="result-hero__name mt-s" style="font-size:clamp(30px,5vw,48px)">${t.name}</h2>
          <p class="kr mt-s" style="font-size:22px">${t.kr}</p><p class="mt-s">${t.one} · 좋아하는 것: ${t.likes.join(", ")}</p>
          <div class="row gap fw mt"><a class="btn btn--ink" href="#/map?preset=${t.key}">${icon("map")} 취향 맞춤 맛집 찾기</a>${isMe ? `<a class="btn" href="#/mbti/test">${icon("refresh")} 다시 테스트</a>` : ""}</div></div></div>`
        : UI.empty("아직 MBTI 결과가 없어요", isMe ? "테스트하고 결과를 저장하면 취향 맞춤 맛집을 추천해 드려요." : "이 사용자는 아직 테스트하지 않았어요.", isMe ? `<a class="btn btn--lime" href="#/mbti">MBTI 테스트 하기</a>` : "");
    }

    if (tab === "saved") {
      const rs = saved.map((s) => Store.restaurant(s.rid)).filter(Boolean);
      body.innerHTML = rs.length ? `<div class="grid grid--4" id="sv">${rs.map((r) => restaurantCard(r)).join("")}</div>`
        : UI.empty("저장한 맛집이 없어요", "카드의 하트 버튼을 누르면 여기에 모여요.", `<a class="btn btn--sm btn--lime" href="#/map">맛집 둘러보기</a>`);
      if ($("#sv", body)) bindRestaurantCards($("#sv", body), () => drawTab());
    }

    if (tab === "settings") drawSettings(body, app);
  };
  drawTab();
}

function drawSettings(body, app) {
  const me = Store.me();
  const colors = ["#E8381B", "#C7FF3D", "#FF7A1A", "#3D5AFE", "#2BB673", "#F2C14E", "#B983FF", "#151515"];
  let img = me.avatarImg, color = me.color;
  body.innerHTML = `<div class="two-col">
    <div class="card pad">
      <h2 class="h3">${icon("user")} 프로필 수정</h2>
      <div class="stack mt">
        <div class="field"><span class="field__l">프로필 이미지</span>
          <div class="row gap fw"><span id="avPrev">${avatarHTML(me, 72)}</span>
            <label class="btn btn--sm">${icon("camera")} 사진 올리기<input type="file" id="av" accept="image/jpeg,image/png,image/webp" hidden></label>
            <button class="chip-btn" id="avRm">${icon("trash")} 사진 삭제</button></div>
          <span class="field__hint">JPG·PNG·WEBP, 5MB 이하. 사진이 없으면 아래 색으로 표시돼요.</span><span class="field__err" id="avErr"></span>
          <div class="color-dots mt-s" id="colors">${colors.map((c) => `<button style="background:${c}" data-c="${c}" class="${c === color ? "is-on" : ""}" aria-label="색 ${c}"></button>`).join("")}</div></div>
        <div class="field"><label for="nick">닉네임 (2~12자)</label><input class="input" id="nick" maxlength="12" value="${esc(me.nick)}"></div>
        <div class="field"><label for="bio">한 줄 소개</label><input class="input" id="bio" maxlength="40" value="${esc(me.bio)}" placeholder="예) 국물 첫 숟갈로 모든 걸 판단합니다"></div>
        <span class="field__err" id="pErr"></span>
        <button class="btn btn--lime" id="saveProf">${icon("check")} 저장</button>
      </div>
    </div>
    <div>
      <div class="card pad">
        <h2 class="h3">${icon("eye")} 공개 범위</h2>
        <div class="setting-row"><div><b>프로필 공개</b><p class="small muted">끄면 다른 사람이 내 프로필을 볼 수 없어요.</p></div><button class="switch ${me.isPublic ? "is-on" : ""}" id="swPub" role="switch" aria-checked="${me.isPublic}" aria-label="프로필 공개"></button></div>
        <div class="setting-row"><div><b>후기 공개 범위</b><p class="small muted">'나만 보기'면 후기가 식당 화면과 평점에서 빠져요.</p></div>
          <div class="seg" id="rvVis"><button data-v="public" class="${me.reviewVisibility !== "private" ? "is-on" : ""}">전체 공개</button><button data-v="private" class="${me.reviewVisibility === "private" ? "is-on" : ""}">나만 보기</button></div></div>
        <p class="small muted mt-s">이메일·비밀번호 같은 계정 정보는 어떤 경우에도 공개되지 않아요.</p>
      </div>
      <div class="card pad mt">
        <h2 class="h3">${icon("cog")} 계정</h2>
        <div class="setting-row"><div><b>이메일</b><p class="small muted">${esc(me.email)} (본인에게만 보여요)</p></div></div>
        <div class="setting-row"><div><b>비밀번호 재설정</b><p class="small muted">백엔드 연결 후 이메일로 재설정 링크를 보내요.</p></div><a class="btn btn--sm" href="#/login?mode=reset">재설정</a></div>
        <div class="setting-row"><div><b>로그아웃</b></div><button class="btn btn--sm" id="logout">${icon("logout")} 로그아웃</button></div>
        <div class="setting-row"><div><b style="color:var(--red)">계정 삭제</b><p class="small muted">후기·도장·저장 목록이 모두 지워져요. 되돌릴 수 없어요.</p></div><button class="btn btn--sm btn--red" id="delAcc">${icon("trash")} 계정 삭제</button></div>
      </div>
    </div>
  </div>`;

  const refreshPrev = () => { $("#avPrev", body).innerHTML = avatarHTML(Object.assign({}, me, { avatarImg: img, color }), 72); };
  $("#av", body).onchange = async (e) => {
    try { img = await readImage(e.target.files[0], 300); $("#avErr", body).textContent = ""; refreshPrev(); } catch (err) { $("#avErr", body).textContent = err.message; }
  };
  $("#avRm", body).onclick = () => { img = null; refreshPrev(); };
  $("#colors", body).onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b) return; color = b.dataset.c; $$("#colors button", body).forEach((x) => x.classList.toggle("is-on", x === b)); refreshPrev(); };
  $("#saveProf", body).onclick = () => {
    try {
      if (Store.updateProfile({ nick: $("#nick", body).value, bio: $("#bio", body).value.trim(), avatarImg: img, color })) {
        UI.toast("프로필을 저장했어요");
        renderProfile(app, Store.me(), true, "settings");
        App.renderChrome("/profile");
      }
    } catch (err) { $("#pErr", body).textContent = err.message; }
  };
  $("#swPub", body).onclick = (e) => {
    const on = !Store.me().isPublic;
    Store.updateProfile({ isPublic: on });
    e.currentTarget.classList.toggle("is-on", on);
    e.currentTarget.setAttribute("aria-checked", on);
    UI.toast(on ? "프로필을 공개했어요" : "프로필을 비공개로 바꿨어요");
  };
  $("#rvVis", body).onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    Store.updateProfile({ reviewVisibility: b.dataset.v });
    $$("#rvVis button", body).forEach((x) => x.classList.toggle("is-on", x === b));
    UI.toast(b.dataset.v === "private" ? "후기를 나만 보기로 바꿨어요" : "후기를 전체 공개로 바꿨어요");
  };
  $("#logout", body).onclick = () => { Store.logout(); UI.toast("로그아웃했어요"); Router.go("/"); };
  $("#delAcc", body).onclick = async () => {
    const ok = await UI.confirm("정말 계정을 삭제할까요?", "후기, 방문 도장, 저장한 맛집, MBTI 결과가 모두 삭제되고 되돌릴 수 없어요.", "영구 삭제", true);
    if (!ok) return;
    Store.deleteAccount();
    UI.toast("계정을 삭제했어요");
    Router.go("/");
  };
}

Router.add("/profile", (app, _p, query) => {
  renderProfile(app, Store.me(), true, query.tab || "overview");
}, { auth: true, authMsg: "내 프로필에서 탐험 기록, 후기, 도장, 배지를 볼 수 있어요." });

Router.add("/u/:id", (app, { id }) => {
  const me = Store.me();
  if (me && me.id === id) { Router.go("/profile"); return; }
  const u = Store.user(id);
  if (!u) { app.innerHTML = `<div class="wrap">${UI.empty("사용자를 찾을 수 없어요", "탈퇴했거나 없는 사용자예요.", `<a class="btn" href="#/">홈으로</a>`)}</div>`; return; }
  if (u.isPublic === false) {
    app.innerHTML = `<div class="wrap narrow"><div class="gate card"><div class="gate__ico">${icon("eyeoff")}</div><h2 class="h2">비공개 프로필이에요</h2><p class="muted mt-s">${esc(u.nick)} 님은 프로필을 공개하지 않았어요.</p></div></div>`;
    return;
  }
  renderProfile(app, u, false, "overview");
});
