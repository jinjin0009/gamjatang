/* 감자탕 MBTI — 소개 · 질문 진행 · 결과 계산 · 결과 공유 */

/* 결과 계산: 선택지 점수를 유형별로 더해 가장 높은 유형 (동점이면 MBTI_ORDER 순서) */
function calcMbti(answers) {
  const scores = {};
  MBTI_ORDER.forEach((k) => (scores[k] = 0));
  answers.forEach((ai, qi) => {
    const a = MBTI_QUESTIONS[qi] && MBTI_QUESTIONS[qi].a[ai];
    if (a) Object.entries(a.s).forEach(([k, v]) => (scores[k] += v));
  });
  let best = MBTI_ORDER[0];
  MBTI_ORDER.forEach((k) => { if (scores[k] > scores[best]) best = k; });
  return { type: best, scores };
}

Router.add("/mbti", (app) => {
  const me = Store.me();
  const saved = me ? Store.mbtiOf(me.id) : null;
  app.innerHTML = `<div class="wrap" style="padding:40px 24px 60px">
    <div class="result-hero" style="background:var(--lime)">
      <div>${typeArtSVG(MBTI_TYPES.SOUP, 150)}</div>
      <div>
        <div class="kicker">${icon("spark")} TANG MBTI · ${MBTI_QUESTIONS.length} QUESTIONS · 약 1분</div>
        <h1 class="h1 mt-s">당신의<br>감자탕 유형은?</h1>
        <p class="mt">국물파? 뼈파? 볶음밥 최종보스? ${MBTI_QUESTIONS.length}개 질문으로 감자탕 취향을 분석하고, 취향에 맞는 맛집 필터까지 바로 연결해 드려요.</p>
        <div class="row gap fw mt">
          <a class="btn btn--ink btn--lg" href="#/mbti/test">${icon("arrow")} 테스트 시작</a>
          ${saved && !saved.sample ? `<a class="btn btn--lg" href="#/mbti/result/${saved.type}">내 결과 다시 보기 (${MBTI_TYPES[saved.type].name})</a>` : ""}
        </div>
      </div>
    </div>
    <div class="sec__head mt-l"><div><div class="kicker">ALL TYPES</div><h2 class="h2 mt-s">${MBTI_ORDER.length}가지 감자탕 유형</h2></div></div>
    <div class="type-grid">${MBTI_ORDER.map((k) => { const t = MBTI_TYPES[k]; return `<a class="type-mini" href="#/mbti/result/${k}" style="background:${t.color};color:${t.ink}"><span>${icon(t.icon)}</span><b>${t.name}</b><span class="small">${t.one}</span></a>`; }).join("")}</div>
  </div>`;
});

Router.add("/mbti/test", (app) => {
  const answers = [];
  let qi = 0;
  const draw = () => {
    const q = MBTI_QUESTIONS[qi];
    const pct = Math.round((qi / MBTI_QUESTIONS.length) * 100);
    app.innerHTML = `<div class="wrap"><div class="quiz">
      <div class="quiz__top">
        ${qi > 0 ? `<button class="btn btn--sm" id="back" aria-label="이전 질문">${icon("back")}</button>` : `<a class="btn btn--sm" href="#/mbti" aria-label="그만하기">${icon("x")}</a>`}
        <div class="bar quiz__bar striped" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="--w:${pct}%"></i></div>
        <span class="mono" style="font-weight:700">${String(qi + 1).padStart(2, "0")}/${String(MBTI_QUESTIONS.length).padStart(2, "0")}</span>
      </div>
      <div class="q-anim">
        <div class="kicker">QUESTION ${qi + 1}</div>
        <h1 class="quiz__q">${esc(q.q)}</h1>
        <div class="quiz__opts">${q.a.map((a, i) => `<button class="opt ${answers[qi] === i ? "is-picked" : ""}" data-i="${i}"><span class="opt__k">${"ABCD"[i]}</span>${esc(a.t)}</button>`).join("")}</div>
      </div>
    </div></div>`;
    // 진행률 바가 이전 값에서 자연스럽게 늘어나도록
    const bar = $(".quiz__bar i", app);
    bar.style.setProperty("--w", Math.round((Math.max(0, qi - 1) / MBTI_QUESTIONS.length) * 100) + "%");
    requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty("--w", pct + "%")));
    if ($("#back", app)) $("#back", app).onclick = () => { qi--; draw(); };
    $(".quiz__opts", app).onclick = (e) => {
      const b = e.target.closest("[data-i]");
      if (!b || app.dataset.lock) return;
      app.dataset.lock = "1";
      b.classList.add("is-picked");
      answers[qi] = +b.dataset.i;
      setTimeout(() => {
        delete app.dataset.lock;
        if (qi < MBTI_QUESTIONS.length - 1) { qi++; draw(); }
        else finish();
      }, 260);
    };
  };
  const finish = () => {
    app.innerHTML = `<div class="wrap"><div class="quiz center"><div class="kicker">ANALYZING</div><h1 class="quiz__q">국물 농도 측정 중…</h1>
      <div class="bar striped" style="height:26px"><i style="--w:0%"></i></div><div class="loading-dots"><span></span><span></span><span></span></div></div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $(".bar i", app).style.setProperty("--w", "100%")));
    const res = calcMbti(answers);
    try { sessionStorage.setItem("bc_mbti_last", JSON.stringify(res)); } catch (e) {}
    setTimeout(() => Router.go("/mbti/result/" + res.type), 1000);
  };
  draw();
  return () => delete app.dataset.lock;
});

Router.add("/mbti/result/:type", (app, { type }, query) => {
  const t = MBTI_TYPES[type];
  if (!t) { Router.go("/mbti"); return; }
  let last = null;
  try { last = JSON.parse(sessionStorage.getItem("bc_mbti_last")); } catch (e) {}
  const fresh = last && last.type === type;
  const me = Store.me();

  // 로그인 후 돌아왔을 때 자동 저장
  if (query.save && me) {
    Store.saveMbti(type, fresh ? last.scores : null);
    UI.toast("프로필에 MBTI 결과를 저장했어요");
    history.replaceState(null, "", "#/mbti/result/" + type);
  }
  document.title = `${t.name}(${t.kr}) — 감자탕 MBTI 결과 | 감자탕 감별사`;
  const mine = me && Store.mbtiOf(me.id);
  const isSaved = mine && !mine.sample && mine.type === type;
  const mission = MISSIONS.find((m) => m.id === t.mission);
  const total = fresh ? Object.values(last.scores).reduce((a, b) => a + b, 0) || 1 : 1;

  app.innerHTML = `<div class="wrap" style="padding:32px 24px 60px">
    <div class="kicker">${fresh ? "YOUR TANG TYPE" : "TANG TYPE"}</div>
    <div class="result-hero mt-s" style="background:${t.color};color:${t.ink}">
      <div>${typeArtSVG(t, 180)}</div>
      <div>
        <div class="kicker">${fresh ? "당신의 감자탕 유형은" : "감자탕 유형"}</div>
        <h1 class="result-hero__name mt-s">${t.name}</h1>
        <p class="kr mt-s" style="font-size:26px">${t.kr} — ${t.one}</p>
        <p class="mt" style="max-width:560px">${t.desc}</p>
      </div>
    </div>

    <div class="grid grid--3 mt-l">
      <div class="card pad"><div class="kicker">${icon("heart")} 선호하는 감자탕</div><ul class="mt-s" style="padding-left:18px;font-weight:700">${t.likes.map((l) => `<li>${l}</li>`).join("")}</ul></div>
      <div class="card pad"><div class="kicker">${icon("filter")} 어울리는 맛집 필터</div><p class="mt-s" style="font-weight:700">${t.filterLabel}</p>
        <a class="btn btn--lime btn--block mt" href="#/map?preset=${type}">${icon("map")} 내 취향 맛집 찾기</a></div>
      <div class="card pad"><div class="kicker">${icon("flag")} 추천 탐험 미션</div><p class="mt-s" style="font-weight:700">${mission ? esc(mission.title) : "-"}</p><p class="small muted">${mission ? esc(mission.desc) + ` · +${mission.xp} XP` : ""}</p>
        <a class="btn btn--block mt" href="#/stamp">${icon("stamp")} 미션 보러 가기</a></div>
    </div>

    ${fresh ? `<div class="card pad mt-l"><div class="kicker">${icon("grid")} 나의 취향 분포</div><div class="score-rows mt">${MBTI_ORDER.map((k) => {
      const v = last.scores[k]; return `<div class="score-row"><div class="score-row__l"><b>${MBTI_TYPES[k].name}</b><span>${MBTI_TYPES[k].kr}</span></div><div class="bar ${k === type ? "" : "bar--ink"}"><i style="--w:${Math.round((v / total) * 100)}%"></i></div><span class="score-row__n">${Math.round((v / total) * 100)}%</span></div>`;
    }).join("")}</div></div>` : ""}

    <div class="row gap fw mt-l">
      <button class="btn btn--ink btn--lg" id="saveP" ${isSaved ? "disabled" : ""}>${icon("user")} ${isSaved ? "프로필에 저장됨" : "프로필에 저장"}</button>
      <button class="btn btn--lg" id="saveImg">${icon("download")} 결과 이미지 저장</button>
      <button class="btn btn--lg" id="share">${icon("share")} 공유하기</button>
      <a class="btn btn--lg" href="#/mbti/test">${icon("refresh")} 다시 하기</a>
      <a class="btn btn--lg btn--red" href="#/worldcup">${icon("trophy")} 월드컵 하러 가기</a>
    </div>

    <h2 class="h3 mt-l">다른 유형 구경하기</h2>
    <div class="type-grid mt">${MBTI_ORDER.filter((k) => k !== type).map((k) => { const x = MBTI_TYPES[k]; return `<a class="type-mini" href="#/mbti/result/${k}" style="background:${x.color};color:${x.ink}"><span>${icon(x.icon)}</span><b>${x.name}</b><span class="small">${x.one}</span></a>`; }).join("")}</div>
  </div>`;

  $("#saveP", app).onclick = () => {
    if (!Store.me()) {
      UI.toast("로그인하면 결과가 프로필에 저장돼요");
      Router.go("/login?next=" + encodeURIComponent(`/mbti/result/${type}?save=1`));
      return;
    }
    Store.saveMbti(type, fresh ? last.scores : null);
    UI.toast("프로필에 MBTI 결과를 저장했어요");
    Router.render();
  };
  $("#share", app).onclick = () => shareLink("감자탕 MBTI", `나의 감자탕 유형은 ${t.name} (${t.kr})! 너는 무슨 탕이야?`, "/mbti/result/" + type);
  $("#saveImg", app).onclick = () => downloadTypeCard(t);
});

/* 결과 카드 이미지를 캔버스로 그려 PNG 로 저장 */
function downloadTypeCard(t) {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1350;
  const g = c.getContext("2d");
  const draw = () => {
    g.fillStyle = "#F5F0E6"; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = "#151515"; g.fillRect(60, 60, 980, 1250);
    g.fillStyle = t.color; g.fillRect(40, 40, 980, 1250);
    g.lineWidth = 10; g.strokeStyle = "#151515"; g.strokeRect(40, 40, 980, 1250);
    g.fillStyle = t.ink;
    g.font = "700 34px 'Space Mono', monospace";
    g.fillText("감자탕 감별사 · BONE CLUB", 100, 140);
    g.fillText("MY TANG TYPE", 100, 190);
    g.font = "110px 'Archivo Black', sans-serif";
    const words = t.name.split(" ");
    let y = 420;
    let line = "";
    words.forEach((w) => {
      const test = line ? line + " " + w : w;
      if (g.measureText(test).width > 860 && line) { g.fillText(line, 100, y); y += 120; line = w; } else line = test;
    });
    g.fillText(line, 100, y);
    g.font = "64px 'Black Han Sans', sans-serif";
    g.fillText(t.kr, 100, y + 110);
    g.font = "600 38px 'Pretendard', sans-serif";
    // 설명 줄바꿈
    let ly = y + 210, l2 = "";
    [...t.desc].forEach((ch) => {
      if (g.measureText(l2 + ch).width > 860) { g.fillText(l2, 100, ly); ly += 56; l2 = ch.trimStart(); } else l2 += ch;
    });
    if (l2) g.fillText(l2, 100, ly);
    // 하단 스티커
    g.save(); g.translate(720, 1180); g.rotate(-0.08);
    g.fillStyle = "#C7FF3D"; g.fillRect(0, 0, 300, 90); g.strokeRect(0, 0, 300, 90);
    g.fillStyle = "#151515"; g.font = "40px 'Archivo Black', sans-serif"; g.fillText("FIND YOUR", 22, 46); g.fillText("TANG.", 22, 84);
    g.restore();
    const a = document.createElement("a");
    a.download = `감자탕MBTI_${t.key}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
    UI.toast("결과 이미지를 저장했어요");
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(draw);
}
