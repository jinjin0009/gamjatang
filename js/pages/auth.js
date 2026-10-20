/* 로그인 · 회원가입 · 비밀번호 재설정 (프로토타입: 이 브라우저 안에서만 동작) */
Router.add("/login", (app, _p, query) => {
  let mode = ["signup", "reset"].includes(query.mode) ? query.mode : "login";
  const next = query.next || "/";
  if (Store.me() && mode !== "reset") {
    app.innerHTML = `<div class="wrap narrow"><div class="gate card"><div class="gate__ico">${icon("check")}</div><h2 class="h2">이미 로그인했어요</h2>
      <p class="muted mt-s">${esc(Store.me().nick)} 님으로 로그인 중이에요.</p><div class="row gap fw center mt"><a class="btn btn--lime" href="#${esc(next)}">계속하기</a><a class="btn" href="#/profile?tab=settings">계정 설정</a></div></div></div>`;
    return;
  }

  const draw = () => {
    app.innerHTML = `<div class="auth">
      <div class="auth__art">
        <div class="kicker" style="color:var(--lime)">${icon("bone")} BONE CLUB MEMBERSHIP</div>
        <h1 class="h1">JOIN<br>THE<br>CLUB.</h1>
        <p style="max-width:380px;opacity:.85">가입하면 MBTI 결과, 후기, 도장, XP와 배지가 내 계정에 쌓여요.</p>
        <ul style="padding-left:18px;opacity:.85;line-height:1.9"><li>후기 1개 = 기본 ${Store.config().xp.review} XP</li><li>방문 인증 = +${Store.config().xp.verified} XP</li><li>미션 달성 = 배지 획득</li></ul>
      </div>
      <div class="auth__form">
        <div class="tabs">${[["login", "로그인"], ["signup", "회원가입"], ["reset", "비밀번호 찾기"]].map(([k, l]) => `<button data-m="${k}" class="${mode === k ? "is-on" : ""}">${l}</button>`).join("")}</div>
        <form class="stack mt-l" id="authForm" novalidate>
          <h2 class="h2">${mode === "login" ? "다시 왔군요!" : mode === "signup" ? "감별사 등록" : "비밀번호 재설정"}</h2>
          <div class="field"><label for="email">이메일</label><input class="input" id="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
          ${mode === "signup" ? `<div class="field"><label for="nick">닉네임 (2~12자)</label><input class="input" id="nick" maxlength="12" placeholder="예) 국물요정" required></div>` : ""}
          ${mode !== "reset" ? `<div class="field"><label for="pw">비밀번호${mode === "signup" ? " (8자 이상)" : ""}</label><input class="input" id="pw" type="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" required></div>` : ""}
          ${mode === "signup" ? `<label class="row gap-s small"><input type="checkbox" id="agree"> 이용약관 및 개인정보 처리방침에 동의해요 (시안)</label>` : ""}
          <span class="field__err" id="err" role="alert"></span>
          <button class="btn btn--lime btn--lg btn--block" type="submit">${mode === "login" ? "로그인" : mode === "signup" ? "가입하고 시작하기" : "재설정 메일 받기"}</button>
          <p class="proto-note">${icon("info")} <span>프로토타입 단계예요. ${mode === "reset" ? "메일 발송 서버가 아직 연결되지 않아 실제 메일은 가지 않아요." : "계정은 이 브라우저에만 저장되고, <b>비밀번호는 저장하거나 확인하지 않아요.</b> 실제 인증은 백엔드 연결 단계에서 붙여요."}</span></p>
          ${mode === "login" ? `<p class="small muted">관리자 화면 체험: <b>admin@boneclub.test</b>로 가입 후 로그인</p>` : ""}
          <p class="small muted">소셜 로그인(카카오·구글)은 다음 단계에서 추가될 예정이에요.</p>
        </form>
      </div>
    </div>`;
    $(".tabs", app).onclick = (e) => { const b = e.target.closest("[data-m]"); if (b) { mode = b.dataset.m; draw(); } };
    $("#authForm", app).onsubmit = (e) => {
      e.preventDefault();
      const err = $("#err", app);
      const email = $("#email", app).value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "이메일 형식을 확인해 주세요."; return; }
      if (mode === "reset") {
        err.textContent = "";
        UI.modal(`<h3 class="modal__title">메일 발송은 아직 준비 중이에요</h3><p class="muted">백엔드(인증 서버)가 연결되면 ${esc(email)} 으로 재설정 링크를 보내드려요. 지금은 실제로 메일이 발송되지 않았어요.</p>`);
        return;
      }
      const pw = $("#pw", app).value;
      try {
        if (mode === "signup") {
          const nick = $("#nick", app).value.trim();
          if (nick.length < 2) { err.textContent = "닉네임은 2자 이상이에요."; return; }
          if (pw.length < 8) { err.textContent = "비밀번호는 8자 이상으로 정해 주세요."; return; }
          if (!$("#agree", app).checked) { err.textContent = "약관에 동의해 주세요."; return; }
          const u = Store.signup({ email, nick });
          UI.confetti(50);
          UI.toast(`환영해요, ${u.nick} 님! BONE CLUB에 가입했어요`);
        } else {
          if (!pw) { err.textContent = "비밀번호를 입력해 주세요."; return; }
          const u = Store.login({ email });
          UI.toast(`${u.nick} 님, 다시 만나서 반가워요`);
        }
        Router.go(next.startsWith("/login") ? "/" : next);
      } catch (ex) { err.textContent = ex.message; }
    };
  };
  draw();
});
