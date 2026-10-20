/* 관리자 — 대시보드 · 식당 관리 · 방문 인증 · 신고 처리 · 콘텐츠/보상 설정 */
const ADMIN_TABS = [["dash", "대시보드"], ["rest", "식당 관리"], ["verify", "방문 인증"], ["reports", "후기 신고"], ["content", "콘텐츠·보상"]];

Router.add("/admin", (app, _p, query) => {
  let tab = ADMIN_TABS.find(([k]) => k === query.tab) ? query.tab : "dash";

  const shell = () => {
    const pending = Store.db.visits.filter((v) => v.status === "pending").length;
    const openRp = Store.db.reports.filter((r) => r.status === "open").length;
    app.innerHTML = `<div class="wrap" style="padding:32px 24px 60px">
      <div class="kicker">${icon("shield")} ADMIN</div><h1 class="h2 mt-s">관리자 콘솔</h1>
      <p class="proto-note mt">${icon("info")} 프로토타입: 여기서 바꾼 내용은 이 브라우저에만 저장돼요. 실제 서비스에서는 서버의 관리자 권한 검사를 거쳐요.</p>
      <div class="tabs mt" id="atabs">${ADMIN_TABS.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? "is-on" : ""}">${l}${k === "verify" && pending ? ` <span class="tag tag--red">${pending}</span>` : ""}${k === "reports" && openRp ? ` <span class="tag tag--red">${openRp}</span>` : ""}</button>`).join("")}</div>
      <div class="mt" id="abody"></div></div>`;
    $("#atabs", app).onclick = (e) => { const b = e.target.closest("button"); if (b) { tab = b.dataset.t; history.replaceState(null, "", "#/admin?tab=" + tab); shell(); } };
    ({ dash, rest, verify, reports, content })[tab]($("#abody", app));
  };

  const dash = (box) => {
    const users = Object.values(Store.db.users);
    const all = Store.restaurants();
    box.innerHTML = `<div class="grid grid--4">
      ${[["등록 식당", all.length, `예시 ${all.filter((r) => r.sample).length} · 직접 등록 ${all.filter((r) => !r.sample).length}`], ["가입자 (이 브라우저)", users.length, ""], ["사용자 후기", Store.db.reviews.length, `예시 후기 ${SAMPLE_REVIEWS.length}개 별도`], ["방문 기록", Store.db.visits.length, `인증 ${Store.db.visits.filter((v) => v.status === "verified").length}`],
        ["인증 대기", Store.db.visits.filter((v) => v.status === "pending").length, ""], ["처리 대기 신고", Store.db.reports.filter((r) => r.status === "open").length, ""], ["MBTI 저장", Store.db.mbti.length, ""], ["월드컵 참여", Store.db.wc.length, `통계 반영 ${Store.db.wc.filter((w) => w.counted).length}`]]
        .map(([l, n, s]) => `<div class="kpi"><span class="mono small">${l}</span><b>${n}</b><span class="small muted">${s}</span></div>`).join("")}
    </div>
    <h2 class="h3 mt-l">최근 활동</h2>
    <div class="card pad mt"><ul class="activity">${Store.db.activity.slice(0, 15).map((a) => { const u = Store.user(a.uid); return `<li>${icon(ACT_ICON[a.type] || "spark")}<span><b>${esc(u ? u.nick : "?")}</b> · ${esc(a.text)}</span><span class="small muted mono">${fmtDate(a.date)}</span></li>`; }).join("") || '<li><span></span><span class="muted">활동 없음</span><span></span></li>'}</ul></div>
    <div class="card pad mt-l"><h2 class="h3">${icon("refresh")} 데모 데이터 초기화</h2><p class="small muted mt-s">이 브라우저에 저장된 계정·후기·도장·설정을 모두 지우고 처음 상태로 돌려요.</p><button class="btn btn--red mt" id="resetAll">전체 초기화</button></div>`;
    $("#resetAll", box).onclick = async () => {
      if (!(await UI.confirm("전체 초기화할까요?", "모든 계정과 기록이 지워지고 로그아웃돼요.", "초기화", true))) return;
      Store.resetAll(); UI.toast("초기화했어요"); Router.go("/");
    };
  };

  const rest = (box) => {
    const all = Store.restaurants();
    box.innerHTML = `<div class="row gap fw"><button class="btn btn--lime" id="addR">${icon("plus")} 식당 등록</button><span class="small muted">예시 식당은 '예시' 상태로 표시돼요. 실제 확인을 마친 식당은 '확인 완료'로 바꿔 주세요.</span></div>
      <div class="table-scroll mt"><table class="admin-table"><thead><tr><th>이름</th><th>지역</th><th>좌표</th><th>정보 상태</th><th>후기</th><th></th></tr></thead><tbody>
      ${all.map((r) => `<tr><td><a class="link" href="#/r/${r.id}">${esc(r.name)}</a></td><td>${esc(r.region)} ${esc(r.district)}</td><td class="mono small">${(+r.lat).toFixed(3)}, ${(+r.lng).toFixed(3)}</td>
        <td>${r.sample ? '<span class="tag tag--ghost">예시 데이터</span>' : r.verifiedInfo ? '<span class="tag tag--ink">확인 완료</span>' : '<span class="tag">확인 필요</span>'}</td><td class="mono">${Store.stats(r.id).count}</td>
        <td><div class="row gap-s"><button class="chip-btn" data-edit="${r.id}">${icon("edit")} 수정</button><button class="chip-btn ghost" data-del="${r.id}">${icon("trash")}</button></div></td></tr>`).join("")}
      </tbody></table></div>`;
    $("#addR", box).onclick = () => restForm(null);
    box.onclick = async (e) => {
      const ed = e.target.closest("[data-edit]");
      if (ed) restForm(Store.restaurant(ed.dataset.edit));
      const del = e.target.closest("[data-del]");
      if (del && (await UI.confirm("식당을 삭제할까요?", "지도·월드컵·도장깨기에서 사라져요. (후기 기록은 남아요)", "삭제", true))) { Store.deleteRestaurant(del.dataset.del); UI.toast("삭제했어요"); shell(); }
    };
  };

  const restForm = (r) => {
    const v = r || { name: "", region: "서울", district: "", address: "", lat: 37.56, lng: 126.98, hours: "", phone: "", price: 2, parking: null, solo: null, open24: null, oldSchool: false, isNew: true, brothStyle: null, menus: [], intro: "", mapUrl: "" };
    const tri = (k, l) => `<label class="field"><span class="field__l">${l}</span><select class="select" name="${k}"><option value="u" ${v[k] === null || v[k] === undefined ? "selected" : ""}>미확인</option><option value="y" ${v[k] === true ? "selected" : ""}>가능</option><option value="n" ${v[k] === false ? "selected" : ""}>불가</option></select></label>`;
    const m = UI.modal(`<h3 class="modal__title">${r ? "식당 수정" : "식당 등록"}</h3>
      <form class="form-grid mt" id="rf">
        <label class="field full"><span class="field__l">식당 이름 *</span><input class="input" name="name" required value="${esc(v.name)}"></label>
        <label class="field"><span class="field__l">지역 *</span><select class="select" name="region">${REGIONS.map((x) => `<option ${x === v.region ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="field"><span class="field__l">구/시 *</span><input class="input" name="district" required value="${esc(v.district)}"></label>
        <label class="field full"><span class="field__l">주소</span><input class="input" name="address" value="${esc(v.address)}"></label>
        <label class="field"><span class="field__l">위도 (33~39)</span><input class="input" name="lat" type="number" step="0.0001" value="${v.lat}"></label>
        <label class="field"><span class="field__l">경도 (124~132)</span><input class="input" name="lng" type="number" step="0.0001" value="${v.lng}"></label>
        <label class="field"><span class="field__l">영업시간</span><input class="input" name="hours" value="${esc(v.hours)}"></label>
        <label class="field"><span class="field__l">전화번호</span><input class="input" name="phone" value="${esc(v.phone || "")}"></label>
        <label class="field"><span class="field__l">가격대</span><select class="select" name="price">${[1, 2, 3].map((p) => `<option value="${p}" ${+v.price === p ? "selected" : ""}>${priceLabel(p)}</option>`).join("")}</select></label>
        <label class="field"><span class="field__l">국물 스타일</span><select class="select" name="brothStyle"><option value="">미확인</option><option ${v.brothStyle === "진함" ? "selected" : ""}>진함</option><option ${v.brothStyle === "깔끔" ? "selected" : ""}>깔끔</option></select></label>
        ${tri("parking", "주차")}${tri("solo", "혼밥")}${tri("open24", "24시간")}
        <label class="field"><span class="field__l">노포 / 신규</span><span class="row gap"><label class="row gap-s"><input type="checkbox" name="oldSchool" ${v.oldSchool ? "checked" : ""}> 노포</label><label class="row gap-s"><input type="checkbox" name="isNew" ${v.isNew ? "checked" : ""}> 신규</label></span></label>
        <label class="field full"><span class="field__l">메뉴 (한 줄에 "메뉴명, 가격")</span><textarea class="textarea" name="menus" style="min-height:80px">${esc((v.menus || []).map(([n, p]) => `${n}, ${p}`).join("\n"))}</textarea></label>
        <label class="field full"><span class="field__l">한 줄 소개</span><input class="input" name="intro" value="${esc(v.intro || "")}"></label>
        <label class="field full"><span class="field__l">지도 서비스 링크 (확인된 경우만)</span><input class="input" name="mapUrl" type="url" placeholder="https://" value="${esc(v.mapUrl || "")}"></label>
        <label class="field full row gap-s" style="flex-direction:row"><input type="checkbox" name="verifiedInfo" ${v.verifiedInfo ? "checked" : ""}> 관리자가 정보를 직접 확인했어요 (확인 완료)</label>
        <span class="field__err full" id="rfErr"></span>
        <button class="btn btn--lime full" type="submit">${icon("check")} 저장</button>
      </form>`, { cls: "modal__box--wide" });
    $("#rf", m.el).onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const lat = +f.get("lat"), lng = +f.get("lng");
      const err = $("#rfErr", m.el);
      if (!f.get("name").trim() || !f.get("district").trim()) { err.textContent = "이름과 구/시는 꼭 입력해 주세요."; return; }
      if (!(lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132)) { err.textContent = "좌표가 한국 범위를 벗어났어요."; return; }
      const triV = (k) => ({ y: true, n: false, u: null })[f.get(k)];
      const menus = (f.get("menus") || "").split("\n").map((l) => l.split(",")).filter((x) => x[0].trim()).map(([n, p]) => [n.trim(), +String(p || "").replace(/[^\d]/g, "") || 0]);
      const data = Object.assign({}, r || {}, {
        name: f.get("name").trim(), region: f.get("region"), district: f.get("district").trim(), address: f.get("address").trim(), lat, lng,
        hours: f.get("hours").trim(), phone: f.get("phone").trim() || null, price: +f.get("price"), brothStyle: f.get("brothStyle") || null,
        parking: triV("parking"), solo: triV("solo"), open24: triV("open24"), oldSchool: !!f.get("oldSchool"), isNew: !!f.get("isNew"),
        menus, intro: f.get("intro").trim(), mapUrl: f.get("mapUrl").trim() || null, verifiedInfo: !!f.get("verifiedInfo"),
        sample: r ? r.sample && !f.get("verifiedInfo") : false,
      });
      Store.saveRestaurant(data);
      m.close(); UI.toast("저장했어요"); shell();
    };
  };

  const verify = (box) => {
    const list = Store.db.visits.filter((v) => v.status === "pending").sort((a, b) => a.date.localeCompare(b.date));
    const done = Store.db.visits.filter((v) => v.status === "verified" || v.status === "rejected").slice(-10).reverse();
    box.innerHTML = `<p class="small muted">영수증을 확인하고 승인하면 사용자에게 인증 도장과 +${Store.config().xp.verified} XP가 지급돼요. 확인되지 않으면 반려해 주세요.</p>
      <div class="stack mt">${list.length ? list.map((v) => { const u = Store.user(v.uid), r = Store.restaurant(v.rid); return `<div class="card pad row gap fw">
        ${v.receipt ? `<a href="${v.receipt}" target="_blank" rel="noopener"><img class="upload__prev" src="${v.receipt}" alt="영수증"></a>` : '<span class="upload__prev" style="display:grid;place-items:center">영수증 없음</span>'}
        <div style="flex:1;min-width:200px"><b>${esc(u ? u.nick : "?")}</b> · ${esc(r ? r.name : "삭제된 식당")}<div class="small muted mono">요청 ${fmtDate(v.requested || v.date)}</div></div>
        <button class="btn btn--sm btn--lime" data-ok="${v.id}">${icon("check")} 승인</button><button class="btn btn--sm" data-no="${v.id}">${icon("x")} 반려</button></div>`; }).join("")
        : UI.empty("대기 중인 인증이 없어요", "사용자가 영수증 인증을 요청하면 여기에 나타나요.")}</div>
      ${done.length ? `<h2 class="h3 mt-l">최근 처리</h2><div class="card pad mt"><ul class="activity">${done.map((v) => `<li>${icon(v.status === "verified" ? "check" : "x")}<span>${esc((Store.user(v.uid) || {}).nick || "?")} · ${esc((Store.restaurant(v.rid) || {}).name || "?")}</span><span class="tag ${v.status === "verified" ? "tag--ink" : ""}">${v.status === "verified" ? "승인" : "반려"}</span></li>`).join("")}</ul></div>` : ""}`;
    box.onclick = (e) => {
      const ok = e.target.closest("[data-ok]"), no = e.target.closest("[data-no]");
      if (!ok && !no) return;
      Store.adminSetVisit((ok || no).dataset[ok ? "ok" : "no"], ok ? "verified" : "rejected");
      UI.toast(ok ? "승인했어요 · 인증 도장 지급" : "반려했어요");
      shell();
    };
  };

  const reports = (box) => {
    const list = Store.db.reports.slice().reverse();
    box.innerHTML = list.length ? `<div class="stack">${list.map((rp) => {
      const rv = Store.review(rp.reviewId);
      const hidden = Store.db.hidden.includes(rp.reviewId);
      return `<div class="card pad"><div class="row gap fw"><span class="tag ${rp.status === "open" ? "tag--red" : "tag--ghost"}">${rp.status === "open" ? "처리 대기" : "처리 완료"}</span><b>${esc(rp.reason)}</b><span class="small muted mono">${fmtDate(rp.date)} · 신고자 ${esc((Store.user(rp.uid) || {}).nick || "?")}</span></div>
        <p class="mt-s" style="border-left:4px solid var(--ink);padding-left:10px">${rv ? esc(rv.text) : "(삭제된 후기)"}</p>
        <div class="row gap fw mt-s">${rv ? `<button class="btn btn--sm ${hidden ? "" : "btn--red"}" data-hide="${rp.reviewId}">${hidden ? "숨김 해제" : "후기 숨기기"}</button>` : ""}${rp.status === "open" ? `<button class="btn btn--sm" data-close="${rp.id}">문제 없음 · 종료</button>` : ""}</div></div>`;
    }).join("")}</div>` : UI.empty("신고된 후기가 없어요", "사용자가 후기를 신고하면 여기에서 처리해요.");
    box.onclick = (e) => {
      const h = e.target.closest("[data-hide]"), c = e.target.closest("[data-close]");
      if (h) {
        const id = h.dataset.hide, d = Store.db;
        if (d.hidden.includes(id)) d.hidden = d.hidden.filter((x) => x !== id); else d.hidden.push(id);
        d.reports.forEach((r) => { if (r.reviewId === id) r.status = "closed"; });
        Store.save(); UI.toast("처리했어요"); shell();
      }
      if (c) { const rp = Store.db.reports.find((r) => r.id === c.dataset.close); rp.status = "closed"; Store.save(); shell(); }
    };
  };

  const content = (box) => {
    const cfg = Store.config();
    box.innerHTML = `<div class="two-col">
      <div>
        <div class="card pad"><h2 class="h3">${icon("spark")} 경험치 · 레벨 기준</h2>
          <form id="cfgF" class="form-grid mt">
            ${[["review", "기본 후기"], ["verified", "방문 인증"], ["photo", "사진 후기"], ["newRegion", "새 지역 첫 기록"]].map(([k, l]) => `<label class="field"><span class="field__l">${l} XP</span><input class="input" type="number" min="0" max="500" name="xp_${k}" value="${cfg.xp[k]}"></label>`).join("")}
            ${LEVEL_NAMES.map((n, i) => `<label class="field"><span class="field__l">LV.${i + 1} ${n}</span><input class="input" type="number" min="0" name="lv_${i}" value="${cfg.levels[i]}" ${i === 0 ? "readonly" : ""}></label>`).join("")}
            <span class="field__err full" id="cfgErr"></span>
            <button class="btn btn--lime full">${icon("check")} 저장 (모든 사용자 XP 즉시 재계산)</button>
          </form></div>
        <div class="card pad mt"><h2 class="h3">${icon("flag")} 도장깨기 미션 (${MISSIONS.length})</h2>
          <div class="table-scroll mt"><table class="admin-table"><thead><tr><th>미션</th><th>조건</th><th>XP</th><th>배지</th></tr></thead><tbody>${MISSIONS.map((m) => `<tr><td>${esc(m.title)}</td><td class="small">${esc(m.desc)}</td><td class="mono">${m.xp}</td><td class="small">${m.badge ? BADGES[m.badge].name : "-"}</td></tr>`).join("")}</tbody></table></div></div>
      </div>
      <div>
        <div class="card pad"><h2 class="h3">${icon("user")} MBTI 질문 (${MBTI_QUESTIONS.length}) · 유형 (${MBTI_ORDER.length})</h2>
          <ol class="small mt" style="padding-left:18px">${MBTI_QUESTIONS.map((q) => `<li>${esc(q.q)} <span class="muted">(${q.a.length}지선다)</span></li>`).join("")}</ol>
          <div class="row gap-s fw mt">${MBTI_ORDER.map((k) => `<span class="tag" style="background:${MBTI_TYPES[k].color};color:${MBTI_TYPES[k].ink}">${MBTI_TYPES[k].name}</span>`).join("")}</div></div>
        <div class="card pad mt"><h2 class="h3">${icon("trophy")} 월드컵 메뉴 항목 (${WC_MENU.length})</h2>
          <div class="row gap-s fw mt">${WC_MENU.map((m) => `<span class="tag">${esc(m.name)}</span>`).join("")}</div>
          <p class="small muted mt-s">맛집 월드컵은 등록된 식당 목록을 그대로 사용해요.</p></div>
        <p class="proto-note mt">${icon("info")} MBTI 질문·월드컵 항목·미션 편집 화면은 데이터베이스 연결 단계에서 추가할 예정이에요. 지금은 목록 확인만 가능해요.</p>
      </div>
    </div>`;
    $("#cfgF", box).onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const xp = {}; ["review", "verified", "photo", "newRegion"].forEach((k) => (xp[k] = Math.max(0, +f.get("xp_" + k) || 0)));
      const levels = LEVEL_NAMES.map((_, i) => Math.max(0, +f.get("lv_" + i) || 0));
      levels[0] = 0;
      if (levels.some((v, i) => i > 0 && v <= levels[i - 1])) { $("#cfgErr", box).textContent = "레벨 기준 XP는 점점 커져야 해요."; return; }
      Store.db.config = { xp, levels };
      Store.save(); UI.toast("보상 기준을 저장했어요"); App.renderChrome("/admin");
    };
  };

  shell();
}, { admin: true });
