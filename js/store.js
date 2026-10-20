/* =========================================================
   Store — 프로토타입용 데이터 계층
   지금은 이 브라우저의 localStorage 에만 저장합니다.
   표 구조(users, reviews, visits ...)는 PRD 16장 데이터 구조와 같게 맞춰 두어
   다음 단계에서 Supabase 테이블로 그대로 옮길 수 있게 했습니다.
   ========================================================= */

const DB_KEY = "bc_db_v1";
const SESSION_KEY = "bc_session";

function emptyDb() {
  return {
    users: {},          // Users
    reviews: [],        // Reviews
    visits: [],         // UserVisits (+ 도장 상태)
    reactions: [],      // ReviewReactions
    reports: [],        // 후기 신고
    saved: [],          // SavedRestaurants
    mbti: [],           // UserMBTIResults
    wc: [],             // WorldCupSessions (+ votes)
    activity: [],       // 활동 기록
    rest: { added: [], edited: {}, deleted: [] }, // 관리자 식당 수정분
    hidden: [],         // 관리자가 숨긴 후기 id
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  };
}

const uid = (p = "id") => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowIso = () => new Date().toISOString();

const Store = {
  db: null,

  load() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) { db = null; }
    const base = emptyDb();
    this.db = db ? Object.assign(base, db) : base;
    this.db.rest = Object.assign({ added: [], edited: {}, deleted: [] }, this.db.rest);
    this._cache = null;
  },

  /* 저장 실패(용량 초과·사생활 보호 모드 등) 시 다시 시도할 수 있게 알림 */
  save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.db));
      return true;
    } catch (e) {
      UI.toast("저장에 실패했어요. 사진 용량이 크거나 브라우저 저장 공간이 부족할 수 있어요.", { type: "error", action: { label: "다시 시도", fn: () => this.save() && UI.toast("저장했어요") } });
      return false;
    }
  },

  resetAll() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.load();
  },

  /* ---------------- 계정 ---------------- */
  sessionId() { try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; } },
  me() { const id = this.sessionId(); return (id && this.db.users[id]) || null; },
  isAdmin() { const m = this.me(); return !!m && m.role === "admin"; },
  user(id) { return this.db.users[id] || SAMPLE_USERS.find((u) => u.id === id) || null; },
  findByEmail(email) { return Object.values(this.db.users).find((u) => u.email === email.trim().toLowerCase()); },
  nickTaken(nick, exceptId) {
    const n = nick.trim();
    return SAMPLE_USERS.some((u) => u.nick === n) || Object.values(this.db.users).some((u) => u.nick === n && u.id !== exceptId);
  },

  signup({ email, nick }) {
    const e = email.trim().toLowerCase();
    if (this.findByEmail(e)) throw new Error("이미 가입된 이메일이에요. 로그인해 주세요.");
    if (this.nickTaken(nick)) throw new Error("이미 쓰고 있는 닉네임이에요.");
    const colors = ["#E8381B", "#C7FF3D", "#FF7A1A", "#3D5AFE", "#2BB673", "#F2C14E"];
    const u = {
      id: uid("u"), email: e, nick: nick.trim(), bio: "", color: colors[Math.floor(Math.random() * colors.length)],
      avatarImg: null, joined: nowIso(), isPublic: true, reviewVisibility: "public",
      role: ADMIN_EMAILS.includes(e) ? "admin" : "user",
    };
    this.db.users[u.id] = u;
    localStorage.setItem(SESSION_KEY, u.id);
    this.log(u.id, "join", "BONE CLUB에 가입했어요");
    this.save();
    return u;
  },

  login({ email }) {
    const u = this.findByEmail(email);
    if (!u) throw new Error("가입되지 않은 이메일이에요. 회원가입을 먼저 해 주세요.");
    localStorage.setItem(SESSION_KEY, u.id);
    return u;
  },

  logout() { localStorage.removeItem(SESSION_KEY); },

  updateProfile(patch) {
    const m = this.me();
    if (!m) throw new Error("로그인이 필요해요.");
    if (patch.nick !== undefined) {
      const n = patch.nick.trim();
      if (n.length < 2 || n.length > 12) throw new Error("닉네임은 2~12자로 정해 주세요.");
      if (this.nickTaken(n, m.id)) throw new Error("이미 쓰고 있는 닉네임이에요.");
      patch.nick = n;
    }
    ["nick", "bio", "color", "avatarImg", "isPublic", "reviewVisibility"].forEach((k) => { if (patch[k] !== undefined) m[k] = patch[k]; });
    return this.save();
  },

  deleteAccount() {
    const m = this.me();
    if (!m) return;
    const d = this.db, mine = (x) => x.uid !== m.id;
    const myReviewIds = d.reviews.filter((r) => r.uid === m.id).map((r) => r.id);
    d.reviews = d.reviews.filter(mine);
    d.visits = d.visits.filter(mine);
    d.reactions = d.reactions.filter((x) => mine(x) && !myReviewIds.includes(x.reviewId));
    d.reports = d.reports.filter(mine);
    d.saved = d.saved.filter(mine);
    d.mbti = d.mbti.filter(mine);
    d.activity = d.activity.filter(mine);
    d.wc.forEach((s) => { if (s.uid === m.id) s.uid = null; }); // 투표 통계는 익명으로 남김
    delete d.users[m.id];
    this.logout();
    this.save();
  },

  log(uidv, type, text) {
    this.db.activity.unshift({ id: uid("a"), uid: uidv, type, text, date: nowIso() });
    this.db.activity = this.db.activity.slice(0, 300);
  },

  config() { return this.db.config || DEFAULT_CONFIG; },

  /* ---------------- 식당 ---------------- */
  /* 기본 식당 목록: 실제 데이터(data-real.js)가 있으면 그것, 없으면 가상 예시 */
  baseRestaurants() {
    if (this._base) return this._base;
    this._base = USE_REAL ? REAL_RESTAURANTS.map(realToRestaurant) : RESTAURANTS_BASE.map((x) => Object.assign({ sample: true }, x));
    return this._base;
  },
  restaurants() {
    const r = this.db.rest;
    if (this._cache) return this._cache; // 관리자 수정·삭제·초기화 때 비움
    const base = this.baseRestaurants().filter((x) => !r.deleted.includes(x.id)).map((x) => (r.edited[x.id] ? Object.assign({}, x, r.edited[x.id]) : x));
    this._cache = base.concat(r.added.filter((x) => !r.deleted.includes(x.id)));
    this._byId = new Map(this._cache.map((x) => [x.id, x]));
    return this._cache;
  },
  restaurant(id) { this.restaurants(); return this._byId.get(id) || null; },

  saveRestaurant(data) {
    const r = this.db.rest;
    if (data.id && RESTAURANTS_BASE.some((x) => x.id === data.id)) r.edited[data.id] = data;
    else if (data.id && r.added.some((x) => x.id === data.id)) r.added = r.added.map((x) => (x.id === data.id ? data : x));
    else { data.id = uid("r"); data.verifiedSeed = 0; r.added.push(data); }
    this._cache = null;
    this.save();
    return data;
  },
  deleteRestaurant(id) { this.db.rest.deleted.push(id); this._cache = null; this.save(); },

  /* ---------------- 후기 ---------------- */
  allReviews() {
    const hidden = new Set(this.db.hidden);
    return SAMPLE_REVIEWS.concat(this.db.reviews).filter((r) => !hidden.has(r.id));
  },
  review(id) { return SAMPLE_REVIEWS.concat(this.db.reviews).find((r) => r.id === id) || null; },

  /* 후기 공개 범위: 작성자가 "나만 보기"로 둔 후기는 본인에게만 보이고 통계에서도 빠짐 */
  visibleReviews(filterFn) {
    const me = this.me();
    return this.allReviews().filter((r) => {
      const u = this.user(r.uid);
      const priv = u && u.reviewVisibility === "private";
      return (!priv || (me && me.id === r.uid)) && (!filterFn || filterFn(r));
    });
  },
  publicReviewsOf(rid) {
    return this.allReviews().filter((r) => {
      const u = this.user(r.uid);
      return r.rid === rid && !(u && u.reviewVisibility === "private");
    });
  },
  myReviewFor(rid) { const m = this.me(); return m ? this.db.reviews.find((r) => r.uid === m.id && r.rid === rid) : null; },

  stats(rid) {
    const list = this.publicReviewsOf(rid);
    const items = {};
    SCORE_ITEMS.forEach((it) => {
      const vals = list.map((r) => r.scores[it.key]).filter((v) => v);
      items[it.key] = { avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, n: vals.length };
    });
    const avgs = Object.values(items).map((x) => x.avg).filter((v) => v !== null);
    const overall = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
    const r = this.restaurant(rid);
    const verified = (r ? r.verifiedSeed || 0 : 0) + this.db.visits.filter((v) => v.rid === rid && v.status === "verified").length;
    return { overall, items, count: list.length, verified, lowSample: list.length < 5 };
  },

  likesOf(review) {
    return (review.seedLikes || 0) + this.db.reactions.filter((x) => x.reviewId === review.id).length;
  },
  iLiked(reviewId) { const m = this.me(); return !!m && this.db.reactions.some((x) => x.reviewId === reviewId && x.uid === m.id); },
  toggleLike(reviewId) {
    const m = this.me();
    if (!m) throw new Error("login");
    const i = this.db.reactions.findIndex((x) => x.reviewId === reviewId && x.uid === m.id);
    if (i >= 0) this.db.reactions.splice(i, 1);
    else this.db.reactions.push({ id: uid("x"), reviewId, uid: m.id, type: "helpful", date: nowIso() });
    this.save();
    return i < 0;
  },
  report(reviewId, reason) {
    const m = this.me();
    if (!m) throw new Error("login");
    if (this.db.reports.some((x) => x.reviewId === reviewId && x.uid === m.id)) throw new Error("이미 신고한 후기예요.");
    this.db.reports.push({ id: uid("rp"), reviewId, uid: m.id, reason, date: nowIso(), status: "open" });
    this.save();
  },

  /* 후기 등록: 같은 식당에는 1인 1후기(보상 1회). 수정은 가능하지만 XP는 다시 주지 않음 */
  addReview(data) {
    const m = this.me();
    if (!m) throw new Error("로그인이 필요해요.");
    if (this.myReviewFor(data.rid)) throw new Error("이 식당에는 이미 후기를 남겼어요. 기존 후기를 수정해 주세요.");
    return this.mutate(() => {
      const rv = { id: uid("rv"), uid: m.id, rid: data.rid, scores: data.scores, opts: data.opts, text: data.text, photo: data.photo || null, date: nowIso() };
      this.db.reviews.push(rv);
      const r = this.restaurant(data.rid);
      this.log(m.id, "review", `${r ? r.name : "식당"} 후기를 남겼어요`);
      if (data.visit && data.visit !== "none") this._setVisit(m, data.rid, data.visit, data.receipt);
      return rv;
    });
  },

  updateReview(id, patch) {
    const m = this.me();
    const rv = this.db.reviews.find((r) => r.id === id);
    if (!rv) throw new Error("후기를 찾을 수 없어요.");
    if (!m || rv.uid !== m.id) throw new Error("본인이 쓴 후기만 수정할 수 있어요.");
    return this.mutate(() => {
      ["scores", "opts", "text", "photo"].forEach((k) => { if (patch[k] !== undefined) rv[k] = patch[k]; });
      rv.edited = nowIso();
      if (patch.visit && patch.visit !== "none") this._setVisit(m, rv.rid, patch.visit, patch.receipt);
      return rv;
    });
  },

  deleteReview(id) {
    const m = this.me();
    const rv = this.db.reviews.find((r) => r.id === id);
    if (!rv) throw new Error("후기를 찾을 수 없어요.");
    if (!m || rv.uid !== m.id) throw new Error("본인이 쓴 후기만 삭제할 수 있어요.");
    return this.mutate(() => {
      this.db.reviews = this.db.reviews.filter((r) => r.id !== id);
      this.db.reactions = this.db.reactions.filter((x) => x.reviewId !== id);
    });
  },

  /* ---------------- 방문 · 도장 ----------------
     self     : 방문 기록만 (기록 도장, XP 없음)
     pending  : 영수증 인증 요청 (관리자 확인 대기)
     verified : 인증 완료 (인증 도장, +XP)
     rejected : 인증 반려                                  */
  visitOf(rid, userId) {
    const id = userId || (this.me() || {}).id;
    return this.db.visits.find((v) => v.uid === id && v.rid === rid) || null;
  },
  _setVisit(m, rid, status, receipt) {
    let v = this.db.visits.find((x) => x.uid === m.id && x.rid === rid);
    const r = this.restaurant(rid);
    if (!v) {
      v = { id: uid("v"), uid: m.id, rid, status, date: nowIso(), receipt: receipt || null };
      this.db.visits.push(v);
      this.log(m.id, "stamp", `${r ? r.name : "식당"} 도장을 받았어요 (${status === "pending" ? "인증 대기" : "방문 기록"})`);
    } else if (v.status === "self" && status === "pending") {
      v.status = "pending"; v.receipt = receipt || null; v.requested = nowIso();
      this.log(m.id, "stamp", `${r ? r.name : "식당"} 방문 인증을 요청했어요`);
    } else if (v.status === "rejected" && status === "pending") {
      v.status = "pending"; v.receipt = receipt || null; v.requested = nowIso();
    }
    return v;
  },
  recordVisit(rid, status, receipt) {
    const m = this.me();
    if (!m) throw new Error("로그인이 필요해요.");
    return this.mutate(() => this._setVisit(m, rid, status, receipt));
  },
  /* 관리자 전용: 방문 인증 승인/반려 (실서비스에선 서버 규칙으로만 변경) */
  adminSetVisit(id, status) {
    if (!this.isAdmin()) throw new Error("관리자만 할 수 있어요.");
    const v = this.db.visits.find((x) => x.id === id);
    if (!v) return;
    const before = this.progress(v.uid);
    v.status = status;
    v.reviewed = nowIso();
    const r = this.restaurant(v.rid);
    this.log(v.uid, "stamp", `${r ? r.name : "식당"} 방문 인증이 ${status === "verified" ? "승인" : "반려"}됐어요`);
    this._diff(v.uid, before, this.progress(v.uid), true);
    this.save();
  },

  /* ---------------- 저장 · MBTI · 월드컵 ---------------- */
  isSaved(rid) { const m = this.me(); return !!m && this.db.saved.some((s) => s.uid === m.id && s.rid === rid); },
  toggleSaved(rid) {
    const m = this.me();
    if (!m) throw new Error("login");
    const i = this.db.saved.findIndex((s) => s.uid === m.id && s.rid === rid);
    if (i >= 0) this.db.saved.splice(i, 1);
    else this.db.saved.unshift({ uid: m.id, rid, date: nowIso() });
    this.save();
    return i < 0;
  },
  savedOf(userId) { return this.db.saved.filter((s) => s.uid === userId); },

  mbtiOf(userId) {
    const u = this.user(userId);
    const rec = this.db.mbti.find((x) => x.uid === userId);
    if (rec) return rec;
    if (u && u.mbti) return { uid: userId, type: u.mbti, sample: true };
    return null;
  },
  saveMbti(type, scores) {
    const m = this.me();
    if (!m) throw new Error("login");
    return this.mutate(() => {
      this.db.mbti = this.db.mbti.filter((x) => x.uid !== m.id);
      this.db.mbti.push({ uid: m.id, type, scores, date: nowIso() });
      this.log(m.id, "mbti", `감자탕 MBTI 결과 "${MBTI_TYPES[type].name}"를 저장했어요`);
    });
  },

  /* 월드컵: 로그인 사용자의 같은 종류 월드컵은 하루 1회만 통계에 반영 (반복 투표 방지) */
  saveWorldCup(kind, size, matches, winner) {
    const m = this.me();
    const today = new Date().toDateString();
    const already = m && this.db.wc.some((s) => s.uid === m.id && s.kind === kind && s.counted && new Date(s.date).toDateString() === today);
    const counted = !!m && !already;
    this.db.wc.push({ id: uid("wc"), uid: m ? m.id : null, kind, size, matches, winner, date: nowIso(), counted });
    this.save();
    return { counted, reason: !m ? "login" : already ? "today" : null };
  },
  wcStats(kind) {
    const seed = WC_SEED[kind];
    const items = {};
    Object.entries(seed.items).forEach(([id, [appear, picks, wins]]) => { items[id] = { appear, picks, wins }; });
    let sessions = seed.sessions, real = 0;
    this.db.wc.filter((s) => s.kind === kind && s.counted).forEach((s) => {
      sessions++; real++;
      s.matches.forEach((mt) => {
        [mt.a, mt.b].forEach((id) => { items[id] = items[id] || { appear: 0, picks: 0, wins: 0 }; items[id].appear++; });
        items[mt.win].picks++;
      });
      items[s.winner].wins++;
    });
    return { sessions, real, items, early: sessions < 30 };
  },

  /* ---------------- 경험치 · 레벨 · 미션 · 배지 ----------------
     모든 수치는 저장된 기록(후기·방문)에서 매번 다시 계산합니다.
     → 숫자를 직접 고쳐 XP를 올릴 수 없는 구조 (실서비스에선 서버에서 같은 계산) */
  progress(userId) {
    const cfg = this.config();
    const rmap = {};
    this.restaurants().forEach((r) => { rmap[r.id] = r; });
    const reviews = this.db.reviews.filter((r) => r.uid === userId && rmap[r.rid]).sort((a, b) => a.date.localeCompare(b.date));
    const visits = this.db.visits.filter((v) => v.uid === userId && v.status !== "rejected" && rmap[v.rid]);
    const verified = visits.filter((v) => v.status === "verified");
    const xpLog = [];
    const reviewXp = {};

    reviews.forEach((rv) => {
      let x = cfg.xp.review;
      xpLog.push({ src: "후기 작성", xp: cfg.xp.review, date: rv.date });
      if (rv.photo) { x += cfg.xp.photo; xpLog.push({ src: "사진 후기", xp: cfg.xp.photo, date: rv.date }); }
      reviewXp[rv.id] = x;
    });
    verified.forEach((v) => xpLog.push({ src: `방문 인증 · ${rmap[v.rid].name}`, xp: cfg.xp.verified, date: v.reviewed || v.date }));

    // 새로운 지역의 첫 기록 보너스
    const events = reviews.map((r) => ({ rid: r.rid, date: r.date })).concat(visits.map((v) => ({ rid: v.rid, date: v.date })))
      .sort((a, b) => a.date.localeCompare(b.date));
    const regionsSeen = new Set();
    events.forEach((e) => {
      const reg = rmap[e.rid].region;
      if (!regionsSeen.has(reg)) { regionsSeen.add(reg); xpLog.push({ src: `새 지역 첫 기록 · ${reg}`, xp: cfg.xp.newRegion, date: e.date }); }
    });

    const visitedR = visits.map((v) => rmap[v.rid]);
    const ctx = {
      visits: visits.length,
      verified: verified.length,
      reviews: reviews.length,
      regions: new Set(visitedR.map((r) => r.region)).size,
      soupReviews: reviews.filter((r) => r.scores.broth >= 4).length,
      riceReviews: reviews.filter((r) => r.scores.rice).length,
      // 그 가게의 첫 후기였던 내 후기 수
      pioneerReviews: reviews.filter((rv) => !this.allReviews().some((o) => o.rid === rv.rid && o.id !== rv.id && o.date < rv.date)).length,
    };
    const all = this.restaurants();
    const missions = MISSIONS.map((ms) => {
      let cur, goal;
      if (ms.metric.startsWith("region:")) {
        const reg = ms.metric.split(":")[1];
        goal = ms.goal === "all" ? all.filter((r) => r.region === reg).length : ms.goal;
        cur = visitedR.filter((r) => r.region === reg).length;
      } else { goal = ms.goal; cur = ctx[ms.metric] || 0; }
      const done = goal > 0 && cur >= goal;
      if (done) xpLog.push({ src: `미션 완료 · ${ms.title}`, xp: ms.xp, date: "" });
      return Object.assign({}, ms, { cur: Math.min(cur, goal), goal, done, pct: goal ? Math.min(100, Math.round((cur / goal) * 100)) : 0 });
    });
    const badges = [...new Set(missions.filter((m) => m.done && m.badge).map((m) => m.badge))];
    const xp = xpLog.reduce((a, b) => a + b.xp, 0);
    const lv = levelOf(xp, cfg.levels);

    // 지역별 진행률
    const regions = REGIONS.map((reg) => {
      const total = all.filter((r) => r.region === reg).length;
      const got = visitedR.filter((r) => r.region === reg).length;
      return { region: reg, total, got, pct: total ? Math.round((got / total) * 100) : 0 };
    });

    return { xp, xpLog, reviewXp, level: lv, missions, badges, visits, verified, reviews, regions, ctx };
  },

  /* 상태를 바꾸는 작업을 감싸서, 전후 진행도를 비교해 미션·배지·레벨업을 알려줌 */
  mutate(fn) {
    const m = this.me();
    const before = m ? this.progress(m.id) : null;
    const res = fn();
    let events = { xpGained: 0, missions: [], badges: [], levelUp: null };
    if (m) events = this._diff(m.id, before, this.progress(m.id));
    this.save();
    return { res, events };
  },

  _diff(userId, before, after, silent) {
    const newMissions = after.missions.filter((ms) => ms.done && !before.missions.find((b) => b.id === ms.id).done);
    const newBadges = after.badges.filter((b) => !before.badges.includes(b));
    const levelUp = after.level.n > before.level.n ? after.level : null;
    newMissions.forEach((ms) => this.log(userId, "mission", `미션 "${ms.title}" 완료! +${ms.xp} XP`));
    newBadges.forEach((b) => this.log(userId, "badge", `배지 ${BADGES[b].name} 획득`));
    if (levelUp) this.log(userId, "level", `LEVEL ${levelUp.n} ${levelUp.name} 달성`);
    const events = { xpGained: after.xp - before.xp, missions: newMissions, badges: newBadges, levelUp };
    if (!silent) Celebrate.queue(events);
    return events;
  },
};

function levelOf(xp, levels) {
  let n = 1;
  levels.forEach((need, i) => { if (xp >= need) n = i + 1; });
  const cur = levels[n - 1];
  const next = levels[n] ?? null;
  return { n, name: LEVEL_NAMES[n - 1], cur, next, pct: next === null ? 100 : Math.round(((xp - cur) / (next - cur)) * 100) };
}

Store.load();

/* 수집한 실제 가게 → 사이트 식당 형식. 확인되지 않은 정보는 null(미확인) */
function realToRestaurant(x) {
  const q = encodeURIComponent(x.name + " " + (x.address || x.district || x.region));
  return {
    id: x.id, name: x.name.replace(/^\s*(\(주\)|㈜|주식회사)\s*/, ""), region: x.region, district: x.district || "", address: x.address || null,
    lat: x.lat, lng: x.lng, hours: x.hours || null, phone: x.phone || null, homepage: x.homepage || null,
    price: null, parking: null, solo: null, open24: x.hours === "24/7" ? true : null, brothStyle: null,
    oldSchool: false, isNew: false, since: null, menus: [], intro: "",
    sample: false, real: true, source: "OpenStreetMap", sourceUrl: x.osm || null, verifiedSeed: 0,
    mapUrl: "https://map.naver.com/p/search/" + q,
  };
}
