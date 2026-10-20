/* 홈 */
Router.add("/", (app) => {
  const me = Store.me();
  const all = Store.restaurants();
  const marq = ["BONE CLUB", "FIND YOUR TANG.", "국물", "뼈", "볶음밥", "도장깨기", "감자탕 월드컵", "감자탕 MBTI", "노포", "24시"];
  const marqHtml = marq.map((t) => `<span>${t}</span>${icon("bone")}`).join("");

  app.innerHTML = `
  <section class="hero">
    <div class="wrap">
      <div class="hero__copy">
        <div class="kicker">${icon("spark")} VOL.01 — 2026 감자탕 탐험 매거진</div>
        <h1 class="hero__title">FIND<br>YOUR<br><span class="hl">TANG.</span></h1>
        <p class="hero__lead"><b>${SITE.name}</b><br>내 감자탕 취향을 찾고, 전국 맛집을 탐험하고, 후기를 남길수록 레벨이 오르는 감자탕 게임 플랫폼.</p>
        <div class="hero__cta">
          <a class="btn btn--lime btn--lg" href="#/mbti">${icon("spark")} 내 감자탕 MBTI 찾기</a>
          <a class="btn btn--ink btn--lg" href="#/map">${icon("map")} 맛집 탐험 시작하기</a>
        </div>
      </div>
      <div class="hero__art">
        <span class="sticker sticker--1">HOT! BONE MAX</span>
        <span class="sticker sticker--2">100%<br>BONE<br>CLUB</span>
        <span class="sticker sticker--3">${all.length.toLocaleString()}곳 ${USE_REAL ? "실제 가게" : "등록 (예시)"}</span>
        ${heroPotSVG()}
      </div>
    </div>
  </section>
  <div class="marquee" aria-hidden="true"><div class="marquee__in">${marqHtml}${marqHtml}</div></div>

  <section class="sec"><div class="wrap">
    <div class="sec__head">
      <div><div class="kicker">${icon("pin")} TODAY'S EXPLORATION</div><h2 class="h2 mt-s">오늘의 감자탕 탐험</h2></div>
      <div class="tabs" role="tablist" id="todayTabs">
        <button class="is-on" data-t="pick">추천 맛집</button><button data-t="new">신규 등록</button><button data-t="review">인기 후기</button><button data-t="hot">많이 선택한 곳</button>
      </div>
    </div>
    <p class="muted small mb" id="todayDesc"></p>
    <div id="today" class="mt"></div>
  </div></section>

  <section class="sec" style="background:var(--ink);color:var(--bg);border-top:var(--line);border-bottom:var(--line)"><div class="wrap">
    <div class="sec__head"><div><div class="kicker" style="color:var(--lime)">${icon("trophy")} GAME MENU</div><h2 class="h2 mt-s" style="color:var(--lime)">골라 봐, 오늘의 게임</h2></div>
      <p style="opacity:.75">감자탕을 즐기는 네 가지 방법. 플레이할수록 XP가 쌓이고 배지가 열려요.</p></div>
    <div class="grid grid--4" id="games">
      ${[
        { no: "01", t: "TANG MBTI", kr: "감자탕 MBTI", d: "8문항으로 알아보는 내 감자탕 취향 유형", href: "#/mbti", ic: "spark", bg: "var(--lime)" },
        { no: "02", t: "WORLD CUP", kr: "감자탕 월드컵", d: "메뉴 vs 메뉴, 맛집 vs 맛집. 최후의 한 그릇은?", href: "#/worldcup", ic: "trophy", bg: "var(--red)", fg: "var(--bg)" },
        { no: "03", t: "STAMP TOUR", kr: "전국 도장깨기", d: "방문할 때마다 도장 쾅. 지역별 지도를 완성해요", href: "#/stamp", ic: "stamp", bg: "var(--paper)" },
        { no: "04", t: "REVIEW GAME", kr: "감자탕 리뷰 게임", d: "5개 항목 점수로 후기를 남기고 XP 획득", href: "#/map?review=1", ic: "edit", bg: "var(--orange)" },
      ].map((g) => `<a class="card hover game-card" href="${g.href}" style="background:${g.bg};color:${g.fg || "var(--ink)"};box-shadow:6px 6px 0 var(--lime)">
          <span class="game-card__no">GAME ${g.no}</span><span class="game-card__ico" style="color:var(--ink)">${icon(g.ic)}</span>
          <h3>${g.t}</h3><p class="kr" style="font-size:18px">${g.kr}</p><p>${g.d}</p><span class="game-card__go">PLAY ${icon("arrow")}</span></a>`).join("")}
    </div>
  </div></section>

  <section class="sec"><div class="wrap" id="myStatus"></div></section>`;

  /* 오늘의 탐험 탭 */
  const today = $("#today", app);
  const desc = $("#todayDesc", app);
  const showTab = (t) => {
    $$("#todayTabs button", app).forEach((b) => b.classList.toggle("is-on", b.dataset.t === t));
    let html = "";
    if (t === "review") {
      const list = Store.visibleReviews().sort((a, b) => Store.likesOf(b) - Store.likesOf(a)).slice(0, 4);
      desc.textContent = "'유용해요'를 많이 받은 후기 순이에요.";
      html = list.length ? `<div class="grid grid--2">${list.map((r) => reviewCard(r, { showRestaurant: true })).join("")}</div>` : UI.empty("아직 후기가 없어요", "첫 후기를 남겨 보세요!");
    } else {
      let list;
      if (t === "pick") {
        list = all.map((r) => ({ r, s: Store.stats(r.id) })).filter((x) => x.s.count >= 3).sort((a, b) => b.s.overall - a.s.overall).map((x) => x.r);
        desc.textContent = "후기 3개 이상인 식당 중 사용자 평점이 높은 순이에요. (전문가 평가가 아닌 사용자 점수예요)";
        if (!list.length) {
          // 아직 평점이 쌓이지 않았으면: 날짜마다 바뀌는 지역별 랜덤 탐험
          const rnd = seededRandom(Number(new Date().toISOString().slice(0, 10).replace(/-/g, "")));
          const pool = all.slice().sort(() => rnd() - 0.5);
          const regions = new Set();
          list = pool.filter((r) => (regions.has(r.region) ? false : regions.add(r.region)));
          desc.textContent = "아직 후기 3개 이상 쌓인 가게가 없어서, 오늘의 랜덤 탐험 가게를 보여드려요. (매일 바뀌어요 · 첫 후기의 주인공이 되어 보세요)";
        }
      } else if (t === "new") {
        list = all.filter((r) => r.isNew || (!r.real && !r.sample));
        desc.textContent = "관리자가 새로 등록한 식당이에요. 아직 후기가 적어 점수가 바뀔 수 있어요.";
      } else {
        const st = Store.wcStats("restaurant");
        list = all.filter((r) => (st.items[r.id] || {}).picks).sort((a, b) => st.items[b.id].picks - st.items[a.id].picks);
        desc.textContent = `감자탕 맛집 월드컵에서 많이 선택된 순이에요. (총 ${st.sessions}회 참여${st.early ? " · 초기 투표 결과" : ""})`;
      }
      list = list.slice(0, 4);
      const emptyMsg = t === "hot" ? UI.empty("아직 맛집 월드컵 투표가 없어요", "첫 투표를 하면 여기에 순위가 생겨요.", `<a class="btn btn--lime" href="#/worldcup?kind=restaurant">맛집 월드컵 하기</a>`)
        : t === "new" ? UI.empty("새로 등록된 가게가 없어요", "관리자가 직접 확인해 등록한 가게가 여기에 나와요.", `<a class="btn" href="#/map">전체 지도 보기</a>`)
        : UI.empty("표시할 식당이 없어요", "지도에서 전체 식당을 둘러보세요.", `<a class="btn" href="#/map">지도 보기</a>`);
      html = list.length ? `<div class="grid grid--4">${list.map((r) => restaurantCard(r)).join("")}</div>` : emptyMsg;
    }
    today.innerHTML = html;
  };
  $("#todayTabs", app).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showTab(b.dataset.t); });
  bindRestaurantCards(today);
  bindReviewCards(today, () => showTab("review"));
  showTab("pick");

  /* 나의 탐험 현황 */
  const box = $("#myStatus", app);
  if (me) {
    const p = Store.progress(me.id);
    const recent = p.badges.slice(-3).reverse();
    box.innerHTML = `<div class="sec__head"><div><div class="kicker">${icon("user")} MY EXPLORATION</div><h2 class="h2 mt-s">${esc(me.nick)}의 탐험 현황</h2></div><a class="btn" href="#/profile">프로필 전체 보기 ${icon("arrow")}</a></div>
    <div class="status-board">
      <div class="status-board__me">
        <div class="row gap">${avatarHTML(me, 56)}<div><b class="kr" style="font-size:24px">${esc(me.nick)}</b><div class="mt-s">${levelChip(p.level)}</div></div></div>
        <div class="mono small">XP ${p.xp}${p.level.next !== null ? ` / 다음 레벨 ${p.level.next}` : " · MAX"}</div>
        <div class="bar striped"><i style="--w:${p.level.pct}%"></i></div>
        <div class="mono small mt-s" style="color:var(--lime)">최근 획득 배지</div>
        <div class="row gap fw">${recent.length ? recent.map((b) => `<span class="tag tag--lime">${esc(BADGES[b].name)}</span>`).join("") : '<span class="small" style="opacity:.7">아직 없어요. 첫 방문 기록으로 FIRST TANG을 받아 보세요!</span>'}</div>
      </div>
      <div class="status-board__stats">
        <div class="stat"><span class="stat__n">${p.visits.length}</span><span class="stat__l">방문한 감자탕집</span></div>
        <div class="stat"><span class="stat__n">${p.verified.length}</span><span class="stat__l">인증 도장</span></div>
        <div class="stat"><span class="stat__n">${p.xp}</span><span class="stat__l">누적 XP</span></div>
        <div class="stat"><span class="stat__n">LV.${p.level.n}</span><span class="stat__l">${esc(p.level.name)}</span></div>
      </div>
    </div>`;
  } else {
    box.innerHTML = `<div class="invite">
      <div><div class="kicker">${icon("lock")} JOIN BONE CLUB</div><h2 class="h2 mt-s">가입하면 탐험 기록이 쌓여요</h2>
      <p class="mt-s">방문한 감자탕집 수, 도장, XP와 레벨, 배지까지. 로그인하면 여기에서 나의 탐험 현황을 볼 수 있어요.</p></div>
      <div class="row gap fw"><a class="btn btn--ink btn--lg" href="#/login?mode=signup">회원가입</a><a class="btn btn--lg" href="#/login">로그인</a></div>
    </div>`;
  }
});
