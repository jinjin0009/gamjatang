/* 감자탕 월드컵 — 메뉴 / 맛집 토너먼트 */

function menuArtSVG(m) {
  const dark = ["#151515", "#3D5AFE", "#E8381B"].includes(m.color);
  const fg = dark ? "#F5F0E6" : "#151515";
  return `<svg class="menu-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill="${m.color}"/>
    <g opacity=".15" fill="${fg}">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i % 6) * 70 + 20}" cy="${Math.floor(i / 6) * 64 + 20}" r="5"/>`).join("")}</g>
    <g transform="translate(200 170)">
      <ellipse rx="120" ry="28" fill="${dark ? "#E8381B" : "#151515"}" stroke="${fg}" stroke-width="6"/>
      <path d="M-120 0h240l-14 70c-5 22-24 36-46 36h-120c-22 0-41-14-46-36z" fill="${fg}"/>
      <g transform="translate(-40 -80) rotate(-22)" fill="#F5F0E6" stroke="#151515" stroke-width="5"><rect y="16" width="18" height="78" rx="4"/><circle cx="1" cy="13" r="12"/><circle cx="17" cy="13" r="12"/></g>
      <g transform="translate(36 -86) rotate(20)" fill="#F5F0E6" stroke="#151515" stroke-width="5"><rect y="16" width="18" height="84" rx="4"/><circle cx="1" cy="13" r="12"/><circle cx="17" cy="13" r="12"/></g>
    </g>
    <text x="22" y="52" font-family="Black Han Sans, sans-serif" font-size="40" fill="${fg}">${esc(m.name.slice(0, 2))}</text>
  </svg>`;
}

const WC = {
  itemsOf(kind) {
    if (kind === "menu") return WC_MENU.map((m) => ({ id: m.id, name: m.name, sub: m.sub, art: menuArtSVG(m) }));
    // 그림은 실제로 화면에 그릴 때만 만듦 (식당이 수백 곳이라)
    return Store.restaurants().map((r) => ({ id: r.id, name: r.name, sub: `${r.region} · ${r.district}${r.sample ? " · 예시" : ""}`, get art() { return thumbSVG(r); } }));
  },
  find(kind, id) {
    if (kind === "restaurant") { const r = Store.restaurant(id); return r && { id: r.id, name: r.name, sub: `${r.region} · ${r.district}`, get art() { return thumbSVG(r); } }; }
    return this.itemsOf(kind).find((x) => x.id === id);
  },
  roundName(n) { return n === 2 ? "결승" : `${n}강`; },
};

Router.add("/worldcup", (app, _p, query) => {
  let kind = query.kind === "restaurant" ? "restaurant" : "menu";
  let size = 8;

  const setup = () => {
    const n = WC.itemsOf(kind).length;
    const sizes = [4, 8, 16].filter((s) => s <= n);
    if (!sizes.includes(size)) size = sizes[sizes.length - 1] || 4;
    app.innerHTML = `<div class="wrap" style="padding:40px 24px 60px">
      <div class="kicker">${icon("trophy")} TANG WORLD CUP</div>
      <h1 class="h1 mt-s">최후의<br><span class="hl">한 그릇</span>은?</h1>
      <p class="mt" style="max-width:560px">두 개 중 더 끌리는 쪽을 고르세요. 끝까지 살아남은 하나가 오늘의 우승! 결과는 다른 사용자들의 선택과 비교해 볼 수 있어요.</p>

      <h2 class="h3 mt-l">1. 월드컵 종류</h2>
      <div class="grid grid--2 mt" id="kinds">
        ${[["menu", "감자탕 메뉴 월드컵", `우거지 vs 묵은지, 국물파 vs 볶음밥파 · ${WC_MENU.length}개 메뉴`, "pot"], ["restaurant", "감자탕 맛집 월드컵", `등록된 식당 ${Store.restaurants().length.toLocaleString()}곳 중에서 대결${USE_REAL ? "" : " (예시 식당)"}`, "pin"]].map(([k, t, d, ic]) => `
          <button class="card hover game-card" data-k="${k}" style="min-height:0;text-align:left;${kind === k ? "background:var(--ink);color:var(--lime)" : ""}">
            <span class="game-card__ico" style="color:var(--ink);margin-top:0">${icon(ic)}</span><h3 class="kr" style="font-family:var(--kr);font-weight:400">${t}</h3><p>${d}</p>
            ${kind === k ? `<span class="tag tag--lime" style="position:absolute;top:16px;right:16px">${icon("check")} 선택됨</span>` : ""}</button>`).join("")}
      </div>

      <h2 class="h3 mt-l">2. 참가 수</h2>
      <div class="tabs mt" id="sizes">${sizes.map((s) => `<button data-s="${s}" class="${s === size ? "is-on" : ""}">${s}강</button>`).join("")}</div>
      <p class="small muted mt-s">${kind === "restaurant" ? `등록된 ${n}곳 중 ` : ""}${size}개 항목이 무작위로 뽑혀 ${size - 1}번 대결해요.</p>

      <div class="row gap fw mt-l">
        <button class="btn btn--red btn--lg" id="start">${icon("trophy")} 월드컵 시작</button>
        <a class="btn btn--lg" href="#/worldcup/stats/${kind}">${icon("grid")} 전체 투표 순위 보기</a>
      </div>
      ${Store.me() ? "" : `<p class="proto-note mt">${icon("info")} 로그인하지 않아도 플레이할 수 있지만, 투표 통계에는 로그인한 사용자의 결과만 반영돼요. (중복 참여 방지: 같은 월드컵은 하루 1회 반영)</p>`}
    </div>`;
    $("#kinds", app).onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) { kind = b.dataset.k; history.replaceState(null, "", "#/worldcup?kind=" + kind); setup(); } };
    $("#sizes", app).onclick = (e) => { const b = e.target.closest("[data-s]"); if (b) { size = +b.dataset.s; setup(); } };
    $("#start", app).onclick = () => play();
  };

  const play = () => {
    const pool = WC.itemsOf(kind).sort(() => Math.random() - 0.5).slice(0, size);
    let round = pool, next = [], idx = 0;
    const matches = [];
    const drawMatch = () => {
      const a = round[idx], b = round[idx + 1];
      const total = round.length / 2, cur = idx / 2 + 1;
      app.innerHTML = `<div class="wrap" style="padding:28px 24px 60px">
        <div class="row gap fw" style="justify-content:space-between">
          <div><div class="kicker">${kind === "menu" ? "MENU" : "RESTAURANT"} WORLD CUP</div><div class="round-label">${WC.roundName(round.length)} <span class="mono" style="font-size:.5em">${cur}/${total}</span></div></div>
          <button class="btn btn--sm" id="quit">${icon("x")} 그만하기</button>
        </div>
        <div class="bar striped mt"><i style="--w:${Math.round((matches.length / (size - 1)) * 100)}%"></i></div>
        <div class="wc-pick mt-l q-anim">
          ${[a, b].map((it, i) => `${i === 1 ? '<div class="wc-vs">VS</div>' : ""}<button class="wc-item" data-pick="${it.id}"><div class="wc-item__art">${it.art}</div><div class="wc-item__b"><h3>${esc(it.name)}</h3><p class="small muted">${esc(it.sub)}</p></div></button>`).join("")}
        </div>
        <p class="center small muted mt">더 끌리는 쪽을 누르세요</p>
      </div>`;
      $("#quit", app).onclick = async () => { if (await UI.confirm("월드컵을 그만할까요?", "지금까지의 선택은 저장되지 않아요.", "그만하기")) setup(); };
      $(".wc-pick", app).onclick = (e) => {
        const btn = e.target.closest("[data-pick]");
        if (!btn || app.dataset.lock) return;
        app.dataset.lock = "1";
        const win = btn.dataset.pick;
        $$("[data-pick]", app).forEach((x) => x.classList.add(x === btn ? "is-win" : "is-lose"));
        matches.push({ round: round.length, a: a.id, b: b.id, win });
        next.push(win === a.id ? a : b);
        setTimeout(() => {
          delete app.dataset.lock;
          idx += 2;
          if (idx >= round.length) {
            if (next.length === 1) return finish(next[0]);
            round = next; next = []; idx = 0;
            UI.toast(`${WC.roundName(round.length)} 진출!`);
          }
          drawMatch();
        }, 520);
      };
    };
    const finish = (winner) => {
      const saved = Store.saveWorldCup(kind, size, matches, winner.id);
      result(winner, matches, saved);
    };
    drawMatch();
  };

  const result = (winner, matches, saved) => {
    UI.confetti(90);
    const st = Store.wcStats(kind);
    const r = kind === "restaurant" ? Store.restaurant(winner.id) : null;
    const menu = kind === "menu" ? WC_MENU.find((m) => m.id === winner.id) : null;
    const mapLink = menu ? (menu.preset ? "#/map?" + new URLSearchParams(menu.preset) : "#/map?q=" + encodeURIComponent(menu.search)) : null;
    const it = st.items[winner.id] || { appear: 0, picks: 0, wins: 0 };
    const rounds = [...new Set(matches.map((m) => m.round))];
    app.innerHTML = `<div class="wrap" style="padding:32px 24px 60px">
      <div class="kicker">${icon("trophy")} WINNER</div>
      <div class="wc-winner mt">
        <div class="wc-item is-win" style="pointer-events:none"><div class="wc-item__art">${winner.art}</div><div class="wc-item__b"><h3>${esc(winner.name)}</h3><p class="small muted">${esc(winner.sub)}</p></div></div>
        <div>
          <h1 class="h1"><span class="kr">${esc(winner.name)}</span></h1>
          <p class="mt">${size}강을 뚫고 오늘의 우승! ${st.sessions - (saved.counted ? 1 : 0) > 0 ? `지금까지 이 항목은 대결에서 <b>${it.appear ? Math.round((it.picks / it.appear) * 100) : 0}%</b> 선택됐고, <b>${it.wins}번</b> 우승했어요.` : "아직 다른 사용자의 투표가 없어요. 당신이 첫 투표자예요!"}</p>
          <p class="small muted mt-s">전체 ${st.sessions}회 참여 기준${st.early ? " · <b style='color:var(--red)'>초기 투표 결과</b> (참여가 적어 순위가 크게 바뀔 수 있어요)" : ""}. 사용자 투표 결과이며 전문가 평가나 객관적 순위가 아니에요.</p>
          <div class="proto-note mt">${icon(saved.counted ? "check" : "info")} ${saved.counted ? "이번 결과가 투표 통계에 반영됐어요." : saved.reason === "today" ? "오늘 이미 이 월드컵에 참여해서, 이번 결과는 통계에 반영되지 않았어요. (하루 1회)" : "로그인하지 않아 통계에는 반영되지 않았어요. 로그인하면 내 투표가 집계돼요."}</div>
          <div class="row gap fw mt">
            <button class="btn btn--red" id="again">${icon("refresh")} 다시 하기</button>
            <button class="btn" id="share">${icon("share")} 결과 공유</button>
            ${r ? `<a class="btn btn--lime" href="#/r/${r.id}">${icon("pin")} 맛집 상세 보기</a>` : ""}
            ${mapLink ? `<a class="btn btn--lime" href="${mapLink}">${icon("map")} 이 메뉴 맛집 찾기</a>` : ""}
          </div>
        </div>
      </div>

      <div class="grid grid--2 mt-l">
        <div class="card pad"><div class="kicker">${icon("list")} 나의 대결 기록</div>
          ${rounds.map((rd) => `<h3 class="h3 mt" style="font-size:16px">${WC.roundName(rd)}</h3><ul class="bracket-log mt-s" style="padding:0;list-style:none">${matches.filter((m) => m.round === rd).map((m) => {
            const A = WC.find(kind, m.a), B = WC.find(kind, m.b), W = m.win === m.a ? A : B, L = m.win === m.a ? B : A;
            return `<li><span class="w">${esc(W.name)}</span> ${icon("check")} <span class="l">${esc(L.name)}</span></li>`;
          }).join("")}</ul>`).join("")}
        </div>
        <div class="card pad"><div class="kicker">${icon("grid")} 다른 사용자의 선택 비율</div>
          <p class="small muted mt-s">대결에서 선택된 비율 · 총 ${st.sessions}회 참여${st.early ? " · 초기 투표 결과" : ""}</p>
          <div id="ranks" class="mt-s">${rankRows(kind, st, 8)}</div>
          <a class="link small mt" style="display:inline-block" href="#/worldcup/stats/${kind}">전체 순위 보기 →</a>
        </div>
      </div>
    </div>`;
    $("#again", app).onclick = () => play();
    $("#share", app).onclick = () => shareLink("감자탕 월드컵", `나의 감자탕 월드컵 우승은 "${winner.name}"! 너의 최후의 한 그릇은?`, "/worldcup?kind=" + kind);
  };

  setup();
  return () => delete app.dataset.lock;
});

function rankRows(kind, st, limit) {
  const rows = Object.entries(st.items).map(([id, x]) => ({ id, ...x, rate: x.appear ? x.picks / x.appear : 0, it: WC.find(kind, id) }))
    .filter((x) => x.it).sort((a, b) => b.rate - a.rate || b.wins - a.wins).slice(0, limit);
  if (!rows.length) return UI.empty("아직 투표가 없어요", "첫 번째 참가자가 되어 보세요!");
  return rows.map((x, i) => `<div class="rank-row"><span class="rank-row__no">${i + 1}</span>
    <span>${kind === "restaurant" ? `<a class="link" href="#/r/${x.id}">${esc(x.it.name)}</a>` : esc(x.it.name)}<span class="small muted mono"> · 우승 ${x.wins}</span></span>
    <div class="bar ${i === 0 ? "bar--red" : ""}"><i style="--w:${Math.round(x.rate * 100)}%"></i></div><span class="rank-row__pct">${Math.round(x.rate * 100)}%</span></div>`).join("");
}

Router.add("/worldcup/stats/:kind", (app, { kind }) => {
  if (!["menu", "restaurant"].includes(kind)) { Router.go("/worldcup"); return; }
  const st = Store.wcStats(kind);
  app.innerHTML = `<div class="wrap narrow" style="padding:32px 24px 60px">
    <nav class="crumb" style="padding-top:0"><a href="#/worldcup?kind=${kind}">${icon("back")} 월드컵</a></nav>
    <div class="kicker">${icon("grid")} VOTE STATS</div>
    <h1 class="h2 mt-s">${kind === "menu" ? "메뉴" : "맛집"} 월드컵 투표 순위</h1>
    <div class="tabs mt"><a href="#/worldcup/stats/menu" class="${kind === "menu" ? "is-on" : ""}">메뉴</a><a href="#/worldcup/stats/restaurant" class="${kind === "restaurant" ? "is-on" : ""}">맛집</a></div>
    <div class="row gap fw mt"><span class="tag tag--ink">총 ${st.sessions}회 참여</span><span class="tag">이 브라우저 실제 집계 ${st.real}회</span>${st.early ? '<span class="tag tag--red">초기 투표 결과</span>' : ""}</div>
    <p class="proto-note mt">${icon("info")} 대결에서 선택된 비율(선택 수 ÷ 출전 수) 순이에요. 사용자 투표일 뿐 전문가 평가나 객관적인 맛 순위가 아니에요. 로그인 사용자의 하루 1회 참여만 집계돼요.</p>
    <div class="card pad mt">${rankRows(kind, st, 50)}</div>
  </div>`;
});
