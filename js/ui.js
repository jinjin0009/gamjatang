/* =========================================================
   공용 UI — 아이콘, 그래픽, 토스트, 모달, 축하 효과, 라우터, 지도
   ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const won = (n) => (n || 0).toLocaleString("ko-KR") + "원";
const fmt1 = (v) => (v === null || v === undefined ? "-" : v.toFixed(1));
const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
const priceLabel = (p) => (p ? "₩".repeat(p) : "가격 미확인");
const triLabel = (v, yes, no) => (v === true ? yes : v === false ? no : "미확인");

/* ---------------- 아이콘 ---------------- */
const ICONS = {
  bone: '<g transform="rotate(-45 12 12)" fill="currentColor" stroke="none"><rect x="6" y="10" width="12" height="4" rx="1"/><circle cx="5.6" cy="9.7" r="2.7"/><circle cx="5.6" cy="14.3" r="2.7"/><circle cx="18.4" cy="9.7" r="2.7"/><circle cx="18.4" cy="14.3" r="2.7"/></g>',
  pot: '<path d="M3 10h18v1.5a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z"/><path d="M1.5 10h3M19.5 10h3M8 6c0-1.5 1-1.5 1-3M12 6c0-1.5 1-1.5 1-3M16 6c0-1.5 1-1.5 1-3"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  flame: '<path d="M12 2.5c.8 3.6 5.5 5.2 5.5 11a5.5 5.5 0 0 1-11 0c0-2.8 1.6-4.2 2.4-6.4 1.3 1 2.1 2.4 2.3 3.9 1.2-2.4 1.6-5.4.8-8.5z"/>',
  trophy: '<path d="M7 3.5h10v5.5a5 5 0 0 1-10 0z"/><path d="M7 5.5H3.5a3.5 3.5 0 0 0 3.6 4.4M17 5.5h3.5a3.5 3.5 0 0 1-3.6 4.4M12 14v4M8 21h8M9.5 18h5"/>',
  stamp: '<path d="M9.5 3h5v4.5l-1 3.5h6.5v4H4v-4h6.5l-1-3.5z"/><path d="M5 19h14"/>',
  home: '<path d="M3 11l9-7 9 7v9.5h-6v-6H9v6H3z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  x: '<path d="M5 5l14 14M19 5L5 19"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  back: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5"/>',
  camera: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3.8"/>',
  cog: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.9 4.9L7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  logout: '<path d="M9 21H4V3h5M16 17l5-5-5-5M21 12H9"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M7 8.5l2 7 3-5.5 3 5.5 2-7M6.5 12h11"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  spark: '<path fill="currentColor" stroke="none" d="M12 1.5l2.6 7.9L22.5 12l-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  car: '<path d="M5 11l2-5h10l2 5M3 11h18v6H3zM6 17v2.5M18 17v2.5"/><circle cx="7" cy="14" r=".8" fill="currentColor"/><circle cx="17" cy="14" r=".8" fill="currentColor"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.5M3.5 12h.5M3.5 18h.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7"/><rect x="13.5" y="3.5" width="7" height="7"/><rect x="3.5" y="13.5" width="7" height="7"/><rect x="13.5" y="13.5" width="7" height="7"/>',
};
function icon(name, cls = "") {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

/* ---------------- 그래픽 ---------------- */
/* 메인 비주얼: 뼈가 솟은 감자탕 냄비 */
function heroPotSVG() {
  return `<svg class="hero-pot" viewBox="0 0 420 400" aria-hidden="true">
  <g class="steam" fill="none" stroke="#151515" stroke-width="6" stroke-linecap="round">
    <path d="M150 95c-18-22 18-34 0-58"/><path d="M210 80c-18-22 18-34 0-58"/><path d="M270 95c-18-22 18-34 0-58"/>
  </g>
  <g class="bones">
    <g transform="translate(120 70) rotate(-28)"><rect x="0" y="20" width="22" height="120" rx="6" fill="#F5F0E6" stroke="#151515" stroke-width="6"/><circle cx="2" cy="16" r="15" fill="#F5F0E6" stroke="#151515" stroke-width="6"/><circle cx="22" cy="16" r="15" fill="#F5F0E6" stroke="#151515" stroke-width="6"/></g>
    <g transform="translate(262 52) rotate(24)"><rect x="0" y="20" width="22" height="130" rx="6" fill="#F5F0E6" stroke="#151515" stroke-width="6"/><circle cx="2" cy="16" r="15" fill="#F5F0E6" stroke="#151515" stroke-width="6"/><circle cx="22" cy="16" r="15" fill="#F5F0E6" stroke="#151515" stroke-width="6"/></g>
  </g>
  <ellipse cx="210" cy="190" rx="178" ry="40" fill="#E8381B" stroke="#151515" stroke-width="7"/>
  <g stroke="#151515" stroke-width="5">
    <ellipse cx="150" cy="185" rx="30" ry="14" fill="#F2C14E"/><ellipse cx="270" cy="193" rx="26" ry="12" fill="#F2C14E"/>
    <path d="M190 178c12-14 30-14 40 0-12 10-28 10-40 0z" fill="#2BB673"/><path d="M95 196c10-10 24-10 32 0-10 8-22 8-32 0z" fill="#2BB673"/>
    <circle cx="320" cy="182" r="6" fill="#C7FF3D"/><circle cx="232" cy="200" r="5" fill="#C7FF3D"/><circle cx="125" cy="178" r="4" fill="#C7FF3D"/>
  </g>
  <path d="M32 190h356l-18 120c-6 36-36 58-72 58H122c-36 0-66-22-72-58z" fill="#151515"/>
  <path d="M14 205h30M376 205h30" stroke="#151515" stroke-width="16" stroke-linecap="round"/>
  <rect x="120" y="250" width="180" height="56" fill="#C7FF3D" stroke="#151515" stroke-width="6" transform="rotate(-4 210 278)"/>
  <text x="210" y="290" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="30" fill="#151515" transform="rotate(-4 210 278)">BONE CLUB</text>
</svg>`;
}

/* 식당 대표 이미지 대신 쓰는 기본 그래픽 (사진이 없거나 못 불러온 경우와 동일) */
function thumbSVG(r) {
  const idx = r ? [...r.id].reduce((a, c) => a + c.charCodeAt(0), 0) % THUMB_PALETTE.length : 0;
  const [bg, fg] = THUMB_PALETTE[idx];
  const pat = idx % 3;
  const name = r ? r.name : "BONE CLUB";
  const initial = esc(name.replace(/\s/g, "").slice(0, 2));
  const pattern = pat === 0
    ? `<pattern id="p${idx}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2" fill="${fg}" opacity=".18"/></pattern>`
    : pat === 1
      ? `<pattern id="p${idx}" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="18" fill="${fg}" opacity=".1"/></pattern>`
      : `<pattern id="p${idx}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 12h24M12 0v24" stroke="${fg}" stroke-width="1.5" opacity=".14"/></pattern>`;
  return `<svg class="thumb-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(name)} 기본 이미지">
    <defs>${pattern}</defs>
    <rect width="400" height="300" fill="${bg}"/><rect width="400" height="300" fill="url(#p${idx})"/>
    <g transform="translate(250 150) rotate(-12)">
      <ellipse cx="0" cy="0" rx="92" ry="22" fill="${fg === "#151515" ? "#F5F0E6" : "#151515"}" stroke="${fg}" stroke-width="5"/>
      <path d="M-92 0h184l-10 60c-4 20-20 32-40 32h-84c-20 0-36-12-40-32z" fill="${fg}"/>
      <g transform="translate(-30 -60) rotate(-20)" fill="#F5F0E6" stroke="#151515" stroke-width="4"><rect x="0" y="14" width="14" height="60" rx="4"/><circle cx="1" cy="11" r="10"/><circle cx="13" cy="11" r="10"/></g>
      <g transform="translate(30 -66) rotate(18)" fill="#F5F0E6" stroke="#151515" stroke-width="4"><rect x="0" y="14" width="14" height="66" rx="4"/><circle cx="1" cy="11" r="10"/><circle cx="13" cy="11" r="10"/></g>
    </g>
    <text x="26" y="128" font-family="Black Han Sans, Archivo Black, sans-serif" font-size="76" fill="${fg}">${initial}</text>
    <text x="28" y="272" font-family="Space Mono, monospace" font-size="16" font-weight="700" fill="${fg}" opacity=".8">${r ? esc(r.region) + (r.since ? " / SINCE " + r.since : r.district ? " / " + esc(r.district) : "") : "NO IMAGE"}</text>
  </svg>`;
}
/* 이미지 URL 이 있으면 쓰고, 실패하면 기본 그래픽으로 대체 */
function thumbHTML(r, cls = "") {
  if (r && r.image) {
    return `<div class="thumb ${cls}"><img src="${esc(r.image)}" alt="${esc(r.name)}" loading="lazy" onerror="this.parentNode.innerHTML=thumbSVG(Store.restaurant('${esc(r.id)}'))"></div>`;
  }
  return `<div class="thumb ${cls}">${thumbSVG(r)}</div>`;
}

function avatarHTML(u, size = 44) {
  if (!u) return `<span class="avatar" style="width:${size}px;height:${size}px;background:#ddd">?</span>`;
  if (u.avatarImg) return `<span class="avatar" style="width:${size}px;height:${size}px"><img src="${u.avatarImg}" alt=""></span>`;
  const dark = ["#151515", "#3D5AFE", "#E8381B"].includes(u.color);
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${u.color};color:${dark ? "#F5F0E6" : "#151515"};font-size:${Math.round(size * 0.42)}px">${esc((u.nick || "?").slice(0, 1))}</span>`;
}

/* 뼈 아이콘 5개로 보여주는 점수 */
function bonesHTML(v, size = "") {
  const n = v ? Math.round(v) : 0;
  let s = `<span class="bones ${size}" aria-label="5점 중 ${v ? fmt1(v) : "점수 없음"}">`;
  for (let i = 1; i <= 5; i++) s += `<span class="${i <= n ? "on" : ""}">${icon("bone")}</span>`;
  return s + "</span>";
}

function typeArtSVG(t, size = 160) {
  return `<svg viewBox="0 0 160 160" width="${size}" height="${size}" class="type-art" aria-hidden="true">
    <rect x="8" y="8" width="144" height="144" fill="${t.color}" stroke="#151515" stroke-width="6" transform="rotate(-6 80 80)"/>
    <circle cx="80" cy="80" r="46" fill="#F5F0E6" stroke="#151515" stroke-width="6"/>
    <g transform="translate(44 44) scale(3)" color="#151515">${ICONS[t.icon]}</g>
    <g transform="translate(118 18) rotate(14)"><rect width="34" height="20" fill="#C7FF3D" stroke="#151515" stroke-width="4"/><text x="17" y="15" text-anchor="middle" font-family="Archivo Black" font-size="11">TANG</text></g>
  </svg>`.replace('<g transform="translate(44 44) scale(3)" color="#151515">', '<g transform="translate(44 44) scale(3)" fill="none" stroke="#151515" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">');
}

function badgeHTML(key, opts = {}) {
  const b = BADGES[key];
  if (!b) return "";
  const dark = ["#151515", "#3D5AFE", "#E8381B"].includes(b.color);
  return `<div class="badge ${opts.locked ? "is-locked" : ""} ${opts.big ? "badge--big" : ""}" title="${esc(b.kr)}">
    <span class="badge__medal" style="background:${opts.locked ? "#ddd" : b.color};color:${dark && !opts.locked ? "#F5F0E6" : "#151515"}">${icon(opts.locked ? "lock" : b.icon)}</span>
    <span class="badge__name">${esc(b.name)}</span>
    ${opts.withDesc ? `<span class="badge__desc">${esc(b.kr)}</span>` : ""}
  </div>`;
}

function stampHTML(r, status) {
  const st = status === "verified" ? "is-verified" : status === "pending" ? "is-pending" : status === "self" ? "is-self" : "is-empty";
  const label = status === "verified" ? "VERIFIED" : status === "pending" ? "PENDING" : status === "self" ? "VISITED" : "?";
  return `<div class="stamp ${st}">
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="5" ${status === "self" ? 'stroke-dasharray="7 6"' : ""}/><circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="2"/>
    <g transform="translate(32 26) scale(1.5)" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${status ? ICONS.bone.replace('fill="currentColor"', 'fill="currentColor"') : ""}</g>
    <text x="50" y="80" text-anchor="middle" font-family="Space Mono, monospace" font-weight="700" font-size="10" fill="currentColor">${label}</text></svg>
  </div>`;
}

const LEVEL_COLORS = ["#F5F0E6", "#C7FF3D", "#FF7A1A", "#3D5AFE", "#E8381B"];
function levelChip(lv) {
  const dark = lv.n >= 4;
  return `<span class="lv-chip" style="background:${LEVEL_COLORS[lv.n - 1]};color:${dark ? "#F5F0E6" : "#151515"}">LV.${lv.n} ${esc(lv.name)}</span>`;
}

/* ---------------- 토스트 · 모달 ---------------- */
const UI = {
  toast(msg, opts = {}) {
    const root = $("#toast-root");
    const el = document.createElement("div");
    el.className = `toast ${opts.type === "error" ? "toast--error" : ""}`;
    el.innerHTML = `<span>${esc(msg)}</span>${opts.action ? `<button class="toast__btn">${esc(opts.action.label)}</button>` : ""}`;
    if (opts.action) $(".toast__btn", el).onclick = () => { el.remove(); opts.action.fn(); };
    root.appendChild(el);
    setTimeout(() => el.classList.add("is-out"), opts.action ? 6000 : 2600);
    setTimeout(() => el.remove(), opts.action ? 6400 : 3000);
  },

  modal(html, opts = {}) {
    const root = $("#modal-root");
    const wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.innerHTML = `<div class="modal__dim"></div><div class="modal__box ${opts.cls || ""}" role="dialog" aria-modal="true">
      <button class="modal__x" aria-label="닫기">${icon("x")}</button>${html}</div>`;
    const close = () => { wrap.classList.add("is-out"); setTimeout(() => wrap.remove(), 180); document.removeEventListener("keydown", onKey); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    $(".modal__dim", wrap).onclick = close;
    $(".modal__x", wrap).onclick = close;
    document.addEventListener("keydown", onKey);
    root.appendChild(wrap);
    return { el: $(".modal__box", wrap), close };
  },

  confirm(title, text, okLabel = "확인", danger = false) {
    return new Promise((resolve) => {
      let done = false;
      const m = UI.modal(`<h3 class="modal__title">${esc(title)}</h3><p class="muted">${esc(text)}</p>
        <div class="row gap mt"><button class="btn ${danger ? "btn--red" : "btn--lime"}" data-ok>${esc(okLabel)}</button><button class="btn" data-no>취소</button></div>`,
      { onClose: () => !done && resolve(false) });
      $("[data-ok]", m.el).onclick = () => { done = true; resolve(true); m.close(); };
      $("[data-no]", m.el).onclick = () => { done = true; resolve(false); m.close(); };
    });
  },

  confetti(n = 70) {
    const colors = ["#C7FF3D", "#E8381B", "#FF7A1A", "#151515", "#3D5AFE", "#F2C14E"];
    const box = document.createElement("div");
    box.className = "confetti";
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + "s";
      p.style.animationDuration = 1.4 + Math.random() * 1.2 + "s";
      p.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
      p.style.setProperty("--x", Math.random() * 200 - 100 + "px");
      if (i % 4 === 0) p.style.borderRadius = "50%";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  },

  /* 숫자가 올라가는 XP 카운터 */
  countUp(el, to, ms = 900) {
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  skeleton(n = 3, cls = "sk-card") { return Array.from({ length: n }, () => `<div class="sk ${cls}"></div>`).join(""); },

  empty(title, text, actions = "") {
    return `<div class="empty">${icon("bone", "empty__ico")}<h3>${esc(title)}</h3><p class="muted">${text}</p>${actions ? `<div class="row gap fw center mt">${actions}</div>` : ""}</div>`;
  },
};

/* 미션 완료 · 배지 · 레벨업 축하 (순서대로 하나씩) */
const Celebrate = {
  q: [],
  busy: false,
  queue(ev) {
    if (!ev) return;
    ev.missions.forEach((m) => UI.toast(`MISSION CLEAR · ${m.title}  +${m.xp} XP`));
    ev.badges.forEach((b) => this.q.push({ kind: "badge", key: b }));
    if (ev.levelUp) this.q.push({ kind: "level", lv: ev.levelUp });
    setTimeout(() => this.next(), 600);
  },
  next() {
    if (this.busy || !this.q.length) return;
    this.busy = true;
    const it = this.q.shift();
    UI.confetti();
    const html = it.kind === "badge"
      ? `<div class="celebrate"><div class="kicker">NEW BADGE UNLOCKED</div>${badgeHTML(it.key, { big: true })}<h3 class="modal__title">${esc(BADGES[it.key].name)}</h3><p class="muted">${esc(BADGES[it.key].kr)} 조건을 달성했어요!</p></div>`
      : `<div class="celebrate"><div class="kicker">LEVEL UP</div><div class="celebrate__lv">LV.${it.lv.n}</div><h3 class="modal__title">${esc(it.lv.name)}</h3><p class="muted">감자탕 탐험가로 한 단계 성장했어요.</p></div>`;
    const m = UI.modal(html + `<button class="btn btn--ink btn--block mt" data-close>좋아요!</button>`, { cls: "modal__box--celebrate", onClose: () => { this.busy = false; setTimeout(() => this.next(), 250); } });
    $("[data-close]", m.el).onclick = m.close;
  },
};

/* ---------------- 라우터 (주소 # 뒤 경로로 화면 전환) ---------------- */
const Router = {
  routes: [],
  cleanup: null,
  add(pattern, render, opts = {}) {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
    this.routes.push({ re, keys, render, opts });
  },
  parse() {
    const raw = location.hash.slice(1) || "/";
    const i = raw.indexOf("?");
    const path = decodeURIComponent(i < 0 ? raw : raw.slice(0, i));
    const qs = i < 0 ? "" : raw.slice(i + 1);
    return { path: path || "/", query: Object.fromEntries(new URLSearchParams(qs)) };
  },
  go(path) { location.hash = "#" + path; },
  current() { return location.hash.slice(1) || "/"; },
  render() {
    const { path, query } = this.parse();
    if (this.cleanup) { try { this.cleanup(); } catch (e) {} this.cleanup = null; }
    const app = $("#app");
    let hit = null, params = {};
    for (const r of this.routes) {
      const m = path.match(r.re);
      if (m) { hit = r; r.keys.forEach((k, i) => (params[k] = m[i + 1])); break; }
    }
    App.renderChrome(path);
    app.classList.remove("page-in");
    void app.offsetWidth;
    app.classList.add("page-in");
    if (!hit) {
      app.innerHTML = `<div class="wrap">${UI.empty("페이지를 찾을 수 없어요", "주소가 바뀌었거나 없는 화면이에요.", `<a class="btn btn--lime" href="#/">홈으로</a>`)}</div>`;
      return;
    }
    if (hit.opts.auth && !Store.me()) {
      app.innerHTML = loginGate(hit.opts.authMsg || "로그인하면 이용할 수 있어요.");
      window.scrollTo(0, 0);
      return;
    }
    if (hit.opts.admin && !Store.isAdmin()) {
      app.innerHTML = adminGate();
      window.scrollTo(0, 0);
      return;
    }
    const out = hit.render(app, params, query);
    if (typeof out === "function") this.cleanup = out;
    if (!hit.opts.keepScroll) window.scrollTo(0, 0);
  },
};

/* 로그인하지 않은 사용자가 개인 기능에 들어왔을 때 */
function loginGate(msg) {
  const next = encodeURIComponent(Router.current());
  return `<div class="wrap narrow"><div class="gate card">
    <div class="gate__ico">${icon("lock")}</div>
    <div class="kicker">MEMBERS ONLY</div>
    <h2 class="h2">로그인이 필요해요</h2>
    <p class="muted">${esc(msg)}</p>
    <div class="row gap fw center mt"><a class="btn btn--lime btn--lg" href="#/login?next=${next}">로그인</a><a class="btn btn--lg" href="#/login?mode=signup&next=${next}">회원가입</a></div>
  </div></div>`;
}
function adminGate() {
  return `<div class="wrap narrow"><div class="gate card">
    <div class="gate__ico">${icon("shield")}</div>
    <div class="kicker">ADMIN ONLY</div>
    <h2 class="h2">관리자 전용 화면이에요</h2>
    <p class="muted">일반 회원은 들어올 수 없어요. 실제 서비스에서는 서버에서만 관리자 권한을 줄 수 있어요.</p>
    <p class="proto-note mt">${icon("info")} 프로토타입 체험: <b>admin@boneclub.test</b> 이메일로 가입·로그인하면 관리자 화면을 볼 수 있어요.</p>
    <div class="row gap fw center mt"><a class="btn btn--lime" href="#/login?next=%2Fadmin">관리자 로그인</a><a class="btn" href="#/">홈으로</a></div>
  </div></div>`;
}

/* 로그인 필요 작업: 로그인 안 했으면 로그인 화면으로 */
function needLogin(msg) {
  if (Store.me()) return false;
  UI.toast(msg || "로그인이 필요한 기능이에요");
  Router.go("/login?next=" + encodeURIComponent(Router.current()));
  return true;
}

/* ---------------- 공용 카드 ---------------- */
function restaurantCard(r, opts = {}) {
  const st = Store.stats(r.id);
  const saved = Store.isSaved(r.id);
  const tags = [];
  if (r.isNew) tags.push('<span class="tag tag--lime">NEW</span>');
  if (r.oldSchool) tags.push('<span class="tag">노포</span>');
  if (r.open24) tags.push('<span class="tag">24시</span>');
  if (r.brothStyle === "진함") tags.push('<span class="tag">국물진함</span>');
  const dist = opts.dist !== undefined && opts.dist !== null ? `<span class="mono small">${opts.dist < 1 ? Math.round(opts.dist * 1000) + "m" : opts.dist.toFixed(1) + "km"}</span>` : "";
  return `<article class="r-card card hover" data-rid="${r.id}" tabindex="0" role="link" aria-label="${esc(r.name)} 상세 보기">
    <div class="r-card__thumb">${thumbHTML(r)}${r.sample ? '<span class="sample-flag">예시</span>' : ""}
      <button class="save-btn ${saved ? "is-on" : ""}" data-save="${r.id}" aria-label="관심 맛집 ${saved ? "해제" : "저장"}">${icon("heart")}</button></div>
    <div class="r-card__body">
      <div class="r-card__meta mono">${esc(r.region)} · ${esc(r.district)} ${dist}</div>
      <h3 class="r-card__name">${esc(r.name)}</h3>
      <div class="r-card__score">${bonesHTML(st.overall, "sm")}<b>${fmt1(st.overall)}</b><span class="muted small">후기 ${st.count}${st.lowSample && st.count ? " · 표본 적음" : ""}</span></div>
      <div class="r-card__tags">${tags.join("")}${r.price ? `<span class="tag tag--ghost">${priceLabel(r.price)}</span>` : ""}${!st.count ? '<span class="tag tag--ghost">첫 후기 대기 중</span>' : ""}</div>
    </div>
  </article>`;
}

/* 카드 클릭 / 저장 버튼 동작을 한 번에 연결 */
function bindRestaurantCards(root, onChange) {
  root.addEventListener("click", (e) => {
    const sv = e.target.closest("[data-save]");
    if (sv) {
      e.stopPropagation();
      if (needLogin("관심 맛집 저장은 로그인 후 이용할 수 있어요")) return;
      const on = Store.toggleSaved(sv.dataset.save);
      $$(`[data-save="${sv.dataset.save}"]`).forEach((b) => b.classList.toggle("is-on", on));
      sv.classList.add("pop");
      setTimeout(() => sv.classList.remove("pop"), 300);
      UI.toast(on ? "관심 맛집에 저장했어요" : "관심 맛집에서 뺐어요");
      onChange && onChange();
      return;
    }
    const card = e.target.closest("[data-rid]");
    if (card && !e.target.closest("a,button")) Router.go("/r/" + card.dataset.rid);
  });
  root.addEventListener("keydown", (e) => {
    const card = e.target.closest("[data-rid]");
    if (card && e.key === "Enter" && e.target === card) Router.go("/r/" + card.dataset.rid);
  });
}

function reviewCard(rv, opts = {}) {
  const u = Store.user(rv.uid);
  const r = Store.restaurant(rv.rid);
  const me = Store.me();
  const mine = me && me.id === rv.uid;
  const likes = Store.likesOf(rv);
  const liked = Store.iLiked(rv.id);
  const visit = rv.sample ? rv.visit : (Store.visitOf(rv.rid, rv.uid) || {}).status;
  const visitTag = visit === "verified" ? `<span class="tag tag--verified">${icon("shield")} 방문 인증 완료</span>`
    : visit === "pending" ? `<span class="tag tag--ghost">${icon("clock")} 인증 확인 중</span>`
      : visit === "self" ? `<span class="tag tag--ghost">${icon("stamp")} 방문 기록</span>` : "";
  let xp = rv.xp;
  if (!rv.sample) { const p = Store.progress(rv.uid); xp = p.reviewXp[rv.id] || 0; }
  const scores = SCORE_ITEMS.filter((it) => rv.scores[it.key]).map((it) => `<div class="mini-score"><span class="mono">${it.en}</span><i style="--w:${rv.scores[it.key] * 20}%"></i><b>${rv.scores[it.key]}</b></div>`).join("");
  return `<article class="rv-card card" data-review="${rv.id}">
    <header class="rv-card__head">
      <a href="#/u/${rv.uid}" class="rv-card__user">${avatarHTML(u, 40)}<span><b>${esc(u ? u.nick : "탈퇴한 사용자")}</b><span class="muted small mono">${fmtDate(rv.date)}${rv.edited ? " · 수정됨" : ""}</span></span></a>
      <span class="xp-tag">+${xp} XP</span>
    </header>
    ${opts.showRestaurant && r ? `<a class="rv-card__rest" href="#/r/${r.id}">${icon("pin")} ${esc(r.name)} <span class="muted">${esc(r.region)}</span></a>` : ""}
    <div class="row gap-s fw">${visitTag}${rv.sample ? '<span class="tag tag--ghost">예시 후기</span>' : ""}${(rv.opts && rv.opts.best || []).map((b) => `<span class="tag tag--lime">BEST · ${esc(b)}</span>`).join("")}</div>
    <div class="mini-scores">${scores}</div>
    <p class="rv-card__text">${esc(rv.text)}</p>
    ${rv.photo ? `<img class="rv-card__photo" src="${rv.photo}" alt="후기 사진">` : ""}
    <footer class="rv-card__foot">
      <button class="chip-btn ${liked ? "is-on" : ""}" data-like="${rv.id}">${icon("heart")} 유용해요 <b>${likes}</b></button>
      ${opts.link !== false ? `<a class="chip-btn" href="#/review/${rv.id}">자세히</a>` : ""}
      <span class="spacer"></span>
      ${mine ? `<a class="chip-btn" href="#/write/${rv.rid}">${icon("edit")} 수정</a><button class="chip-btn" data-del="${rv.id}">${icon("trash")} 삭제</button>`
        : `<button class="chip-btn ghost" data-report="${rv.id}">${icon("flag")} 신고</button>`}
    </footer>
  </article>`;
}

function bindReviewCards(root, onChange) {
  root.addEventListener("click", async (e) => {
    const like = e.target.closest("[data-like]");
    if (like) {
      if (needLogin("유용해요는 로그인 후 누를 수 있어요")) return;
      const on = Store.toggleLike(like.dataset.like);
      like.classList.toggle("is-on", on);
      like.querySelector("b").textContent = Store.likesOf(Store.review(like.dataset.like));
      like.classList.add("pop"); setTimeout(() => like.classList.remove("pop"), 300);
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) {
      const ok = await UI.confirm("후기를 삭제할까요?", "삭제하면 이 후기로 받은 XP도 함께 사라져요. 방문 도장은 그대로 남아요.", "삭제", true);
      if (!ok) return;
      try { Store.deleteReview(del.dataset.del); UI.toast("후기를 삭제했어요"); onChange && onChange(); } catch (err) { UI.toast(err.message, { type: "error" }); }
      return;
    }
    const rep = e.target.closest("[data-report]");
    if (rep) {
      if (needLogin("신고는 로그인 후 할 수 있어요")) return;
      const m = UI.modal(`<h3 class="modal__title">후기 신고</h3><p class="muted">신고 사유를 골라 주세요. 관리자가 확인 후 처리해요.</p>
        <div class="stack-s mt">${["광고·홍보", "욕설·비방", "허위 방문 의심", "식당과 관계없는 내용"].map((t, i) => `<label class="radio-row"><input type="radio" name="rp" value="${t}" ${i === 0 ? "checked" : ""}> ${t}</label>`).join("")}</div>
        <button class="btn btn--red btn--block mt" data-send>신고하기</button>`);
      $("[data-send]", m.el).onclick = () => {
        try { Store.report(rep.dataset.report, $("input[name=rp]:checked", m.el).value); UI.toast("신고가 접수됐어요"); } catch (err) { UI.toast(err.message, { type: "error" }); }
        m.close();
      };
    }
  });
}

/* ---------------- 지도 (외부 지도 API 없이 그린 예시 지도) ----------------
   위도·경도를 화면 좌표로 바꿔서 핀을 찍습니다.
   실제 지도 API(카카오/네이버)를 연결하면 이 부분만 교체하면 됩니다.            */
const KOREA_OUTLINE = [
  [126.15, 37.75], [126.68, 37.95], [127.1, 38.3], [127.6, 38.33], [128.1, 38.35], [128.36, 38.62], [128.62, 38.2], [128.95, 37.7],
  [129.35, 37.25], [129.45, 36.8], [129.42, 36.3], [129.58, 36.05], [129.4, 35.75], [129.35, 35.45], [129.1, 35.08], [128.75, 35.05],
  [128.4, 34.85], [128.0, 34.85], [127.7, 34.7], [127.4, 34.55], [126.95, 34.45], [126.5, 34.3], [126.35, 34.6], [126.3, 34.95],
  [126.45, 35.3], [126.55, 35.65], [126.7, 35.95], [126.55, 36.2], [126.35, 36.6], [126.6, 36.95], [126.85, 37.0], [126.65, 37.25],
  [126.55, 37.45], [126.15, 37.75],
];
const MAP_W = 440, MAP_H = 735;
const proj = (lng, lat) => [(lng - 125.6) * 100, (38.9 - lat) * 124];
const unproj = (x, y) => [x / 100 + 125.6, 38.9 - y / 124];
const REGION_LABELS = { 서울: [126.98, 37.66], 경기: [127.35, 37.25], 인천: [126.45, 37.42], 강원: [128.3, 37.65], 충청: [127.2, 36.55], "대구·경북": [128.75, 36.35], "부산·경남": [128.55, 35.32], 전라: [126.9, 35.45], 제주: [126.55, 33.62] };

function regionBox(region) {
  const rs = Store.restaurants().filter((r) => r.region === region);
  if (!rs.length) return null;
  const pts = rs.map((r) => proj(r.lng, r.lat));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = 22;
  let w = Math.max(x1 - x0 + pad * 2, 70), h = Math.max(y1 - y0 + pad * 2, 90);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  // 지도 비율 유지
  const ratio = MAP_W / MAP_H;
  if (w / h > ratio) h = w / ratio; else w = h * ratio;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

function createMap(container, { restaurants, pinClass, pinLabel, onPin, onMove, showLabels = true }) {
  const outline = KOREA_OUTLINE.map(([lng, lat]) => proj(lng, lat).map((v) => v.toFixed(1)).join(",")).join(" ");
  const [jx, jy] = proj(126.55, 33.38);
  const [ux, uy] = proj(130.87, 37.5);
  container.innerHTML = `<div class="kmap">
    <svg class="kmap__svg" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid meet" aria-label="감자탕 맛집 예시 지도">
      <defs><pattern id="kgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#151515" stroke-width=".4" opacity=".18"/></pattern></defs>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#kgrid)"/>
      <polygon points="${outline}" class="kmap__land"/>
      <ellipse cx="${jx}" cy="${jy}" rx="36" ry="21" class="kmap__land"/>
      <circle cx="${Math.min(ux, MAP_W - 12)}" cy="${uy}" r="4" class="kmap__land"/>
      <g class="kmap__labels">${showLabels ? Object.entries(REGION_LABELS).map(([k, [lng, lat]]) => { const [x, y] = proj(lng, lat); return `<text x="${x}" y="${y}" class="kmap__label" data-lbl>${k}</text>`; }).join("") : ""}</g>
      <g class="kmap__me"></g>
      <g class="kmap__pins"></g>
    </svg>
    <div class="kmap__ctrl">
      <button class="kmap__btn" data-zoom="in" aria-label="확대">${icon("plus")}</button>
      <button class="kmap__btn" data-zoom="out" aria-label="축소">${icon("minus")}</button>
      <button class="kmap__btn" data-zoom="reset" aria-label="전국 보기">${icon("refresh")}</button>
    </div>
    <div class="kmap__note mono">간이 지도 · 지도 API 미연결</div>
  </div>`;
  const svg = $(".kmap__svg", container);
  const pinsG = $(".kmap__pins", svg);
  let vb = { x: 0, y: 0, w: MAP_W, h: MAP_H };
  let list = restaurants;

  const drawPins = () => {
    const s = vb.w / MAP_W;
    const pts = list.map((r) => [r, proj(r.lng, r.lat)]);
    const inView = pts.filter(([, [x, y]]) => x >= vb.x && x <= vb.x + vb.w && y >= vb.y && y <= vb.y + vb.h).length;
    const compact = inView > 60;   // 화면에 가게가 많으면 작은 점으로
    const labelOf = pinLabel || (inView <= 30 && vb.w < 200 ? (r) => r.name : null); // 충분히 확대하면 식당 이름 표시
    pinsG.innerHTML = pts.map(([r, [x, y]]) => `<g class="kmap__pin ${compact ? "is-dot" : ""} ${pinClass ? pinClass(r) : ""}" data-pin="${r.id}" transform="translate(${x} ${y}) scale(${s})" tabindex="0" role="button" aria-label="${esc(r.name)}">
        ${compact ? '<circle r="5" class="kmap__pin-body"/>' : `<path d="M0 0c-6-8-11-12-11-18a11 11 0 0 1 22 0c0 6-5 10-11 18z" class="kmap__pin-body"/>
        <circle cx="0" cy="-18" r="4.2" class="kmap__pin-dot"/>`}
        ${labelOf ? `<text y="-34" text-anchor="middle" class="kmap__pin-label">${esc(labelOf(r))}</text>` : ""}
      </g>`).join("");
    $$("[data-lbl]", svg).forEach((t) => (t.style.fontSize = 13 * s + "px"));
  };
  let drawnW = null;
  const apply = (silent) => {
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    if (drawnW !== vb.w || !silent) { drawnW = vb.w; drawPins(); } // 드래그 중에는 핀을 다시 그리지 않음
    if (!silent && onMove) onMove(api.bounds());
  };
  const zoomAt = (f, cx, cy) => {
    const nw = Math.min(MAP_W * 1.2, Math.max(40, vb.w * f));
    const nh = nw * (MAP_H / MAP_W);
    cx = cx ?? vb.x + vb.w / 2; cy = cy ?? vb.y + vb.h / 2;
    vb = { x: cx - ((cx - vb.x) * nw) / vb.w, y: cy - ((cy - vb.y) * nh) / vb.h, w: nw, h: nh };
    apply();
  };

  // 드래그로 이동
  let drag = null, moved = false;
  svg.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, vb: { ...vb } }; moved = false;
  });
  window.addEventListener("pointermove", onPMove);
  window.addEventListener("pointerup", onPUp);
  function onPMove(e) {
    if (!drag) return;
    const rect = svg.getBoundingClientRect();
    const k = Math.max(vb.w / rect.width, vb.h / rect.height);
    const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) { moved = true; svg.classList.add("is-drag"); }
    if (moved) { vb = { ...drag.vb, x: drag.vb.x - dx, y: drag.vb.y - dy }; apply(true); }
  }
  function onPUp() {
    if (drag && moved) { drawPins(); if (onMove) onMove(api.bounds()); }
    drag = null; svg.classList.remove("is-drag");
  }
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const k = Math.max(vb.w / rect.width, vb.h / rect.height);
    const cx = vb.x + (e.clientX - rect.left - (rect.width - vb.w / k) / 2) * k;
    const cy = vb.y + (e.clientY - rect.top - (rect.height - vb.h / k) / 2) * k;
    zoomAt(e.deltaY > 0 ? 1.18 : 0.85, cx, cy);
  }, { passive: false });
  svg.addEventListener("click", (e) => {
    const p = e.target.closest("[data-pin]");
    if (p && !moved && onPin) onPin(p.dataset.pin);
  });
  svg.addEventListener("keydown", (e) => {
    const p = e.target.closest("[data-pin]");
    if (p && e.key === "Enter" && onPin) onPin(p.dataset.pin);
  });
  $$("[data-zoom]", container).forEach((b) => (b.onclick = () => {
    if (b.dataset.zoom === "in") zoomAt(0.7);
    else if (b.dataset.zoom === "out") zoomAt(1.4);
    else api.reset();
  }));

  const api = {
    setPins(rs) { list = rs; drawPins(); },
    fit(box, silent) { if (box) { vb = { ...box }; apply(silent); } },
    reset(silent) { vb = { x: 0, y: 0, w: MAP_W, h: MAP_H }; apply(silent); },
    focus(r, zoomW = 90) {
      const [x, y] = proj(r.lng, r.lat);
      const h = zoomW * (MAP_H / MAP_W);
      vb = { x: x - zoomW / 2, y: y - h / 2, w: zoomW, h }; apply(true);
    },
    highlight(id) {
      $$(".kmap__pin", svg).forEach((p) => p.classList.toggle("is-hl", p.dataset.pin === id));
      const p = $(`[data-pin="${id}"]`, svg);
      if (p) pinsG.appendChild(p);
    },
    setMe(lat, lng) {
      const [x, y] = proj(lng, lat);
      $(".kmap__me", svg).innerHTML = `<circle cx="${x}" cy="${y}" r="${7 * (vb.w / MAP_W)}" class="kmap__me-dot"/>`;
    },
    bounds() {
      const [w, n] = unproj(vb.x, vb.y), [e, s] = unproj(vb.x + vb.w, vb.y + vb.h);
      return { w, e, n, s, full: vb.w >= MAP_W * 0.98 };
    },
    destroy() { window.removeEventListener("pointermove", onPMove); window.removeEventListener("pointerup", onPUp); },
  };
  apply(true);
  return api;
}

/* 두 좌표 사이 거리 (km) */
function distKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* 이미지 파일 → 작게 줄인 dataURL (형식·용량 제한 포함) */
function readImage(file, maxSide = 900) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return reject(new Error("JPG, PNG, WEBP 이미지만 올릴 수 있어요."));
    if (file.size > 5 * 1024 * 1024) return reject(new Error("이미지는 5MB 이하만 올릴 수 있어요."));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지를 읽지 못했어요.")); };
    img.src = url;
  });
}

/* 공유: 휴대폰은 공유창, PC는 링크 복사 */
async function shareLink(title, text, path) {
  const url = location.href.split("#")[0] + "#" + path;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); UI.toast("공유 링크를 복사했어요"); }
  catch (e) { UI.modal(`<h3 class="modal__title">공유 링크</h3><p class="muted">아래 주소를 복사해 주세요.</p><input class="input mt" value="${esc(url)}" readonly onclick="this.select()">`); }
}
