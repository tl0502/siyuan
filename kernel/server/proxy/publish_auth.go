package proxy

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/88250/gulu"
	"github.com/siyuan-note/siyuan/kernel/model"
	"github.com/siyuan-note/siyuan/kernel/util"
)

type publishAuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Nickname string `json:"nickname"`
}

func handlePublishAuth(w http.ResponseWriter, r *http.Request) bool {
	switch r.URL.Path {
	case "/publish/auth/login":
		handlePublishLogin(w, r)
		return true
	case "/publish/auth/register":
		handlePublishRegister(w, r)
		return true
	case "/publish/auth/logout":
		handlePublishLogout(w, r)
		return true
	case "/publish/auth":
		servePublishLoginPage(w)
		return true
	default:
		return false
	}
}

func handlePublishLogin(w http.ResponseWriter, r *http.Request) {
	input, ok := decodePublishAuthRequest(w, r)
	if !ok {
		return
	}

	user, err := model.AuthenticatePublishUser(input.Username, input.Password)
	if err == nil {
		token, err := model.NewPublishReaderToken(user.Username)
		if err != nil {
			writePublishAuthJSON(w, http.StatusInternalServerError, -1, err.Error(), nil)
			return
		}
		setPublishAuthSessionCookie(w, user.Username, token)
		writePublishAuthJSON(w, http.StatusOK, 0, "", map[string]any{"username": user.Username})
		return
	}

	account := model.GetBasicAuthAccount(input.Username)
	if account == nil ||
		account.Username == "" || // 匿名用户不允许通过登录页登录
		account.Password != input.Password {
		writePublishAuthJSON(w, http.StatusUnauthorized, -1, model.ErrPublishUserAuthFailed.Error(), nil)
		return
	}
	setPublishAuthSessionCookie(w, account.Username, account.Token)
	writePublishAuthJSON(w, http.StatusOK, 0, "", map[string]any{"username": account.Username})
}

func setPublishAuthSessionCookie(w http.ResponseWriter, username, token string) {
	sessionID := model.GetNewSessionID()
	model.AddPublishVisitorSession(sessionID, username, token)
	http.SetCookie(w, &http.Cookie{
		Name:     model.SessionIdCookieName,
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   util.SSL,
	})
}

func handlePublishRegister(w http.ResponseWriter, r *http.Request) {
	input, ok := decodePublishAuthRequest(w, r)
	if !ok {
		return
	}

	if _, err := model.RegisterPublishUser(input.Username, input.Password, input.Nickname); err != nil {
		writePublishAuthJSON(w, http.StatusBadRequest, -1, err.Error(), nil)
		return
	}
	writePublishAuthJSON(w, http.StatusOK, 0, "申请已提交，请等待审核", nil)
}

func handlePublishLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(model.SessionIdCookieName); err == nil {
		model.DeleteSession(cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     model.SessionIdCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   util.SSL,
	})
	writePublishAuthJSON(w, http.StatusOK, 0, "", nil)
}

func decodePublishAuthRequest(w http.ResponseWriter, r *http.Request) (*publishAuthRequest, bool) {
	if r.Method != http.MethodPost {
		writePublishAuthJSON(w, http.StatusMethodNotAllowed, -1, http.StatusText(http.StatusMethodNotAllowed), nil)
		return nil, false
	}

	input := &publishAuthRequest{}
	if err := json.NewDecoder(r.Body).Decode(input); err != nil {
		writePublishAuthJSON(w, http.StatusBadRequest, -1, err.Error(), nil)
		return nil, false
	}
	input.Username = strings.TrimSpace(input.Username)
	input.Nickname = strings.TrimSpace(input.Nickname)
	return input, true
}

func writePublishAuthJSON(w http.ResponseWriter, statusCode int, code int, msg string, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	ret := gulu.Ret.NewResult()
	ret.Code = code
	ret.Msg = msg
	ret.Data = data
	_ = json.NewEncoder(w).Encode(ret)
}

func servePublishLoginPage(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(publishLoginHTML))
}

const publishLoginHTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Publish Login</title>
<style>
:root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
[hidden] { display: none !important; }
body { margin: 0; min-height: 100vh; background: Canvas; color: CanvasText; }
main { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 440px); }
.context { padding: clamp(32px, 7vw, 88px); display: flex; flex-direction: column; justify-content: center; border-right: 1px solid color-mix(in srgb, CanvasText 16%, transparent); }
.context h1 { margin: 0 0 16px; font-size: clamp(32px, 5vw, 56px); line-height: 1.05; letter-spacing: 0; }
.context p { max-width: 620px; margin: 0; color: color-mix(in srgb, CanvasText 72%, transparent); line-height: 1.7; }
.panel-wrap { display: flex; align-items: center; justify-content: center; padding: 24px; }
.panel { width: min(100%, 360px); }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
.tabs button, .auth-form button { height: 36px; border: 1px solid color-mix(in srgb, CanvasText 24%, transparent); background: Canvas; color: CanvasText; border-radius: 6px; cursor: pointer; font: inherit; }
.tabs button.active, .auth-form button { background: CanvasText; color: Canvas; }
.auth-form { display: flex; flex-direction: column; gap: 12px; }
.auth-form input { height: 36px; box-sizing: border-box; border: 1px solid color-mix(in srgb, CanvasText 24%, transparent); border-radius: 6px; background: Canvas; color: CanvasText; padding: 0 10px; font: inherit; }
#message { min-height: 22px; color: color-mix(in srgb, CanvasText 76%, transparent); line-height: 1.5; }
@media (max-width: 760px) {
  main { grid-template-columns: 1fr; }
  .context { border-right: 0; border-bottom: 1px solid color-mix(in srgb, CanvasText 16%, transparent); padding: 32px 24px; }
  .context h1 { font-size: 32px; }
}
</style>
</head>
<body>
<main>
<section class="context">
<h1>Protected Publish Site</h1>
<p>这里是受保护的发布内容。已有账号可直接登录；新访问者可以提交申请，管理员审核后即可访问。</p>
</section>
<section class="panel-wrap">
<div class="panel">
<div class="tabs">
<button id="loginTab" class="active" type="button" aria-pressed="true">登录</button>
<button id="registerTab" type="button" aria-pressed="false">注册</button>
</div>
<form id="loginForm" class="auth-form">
<input name="username" placeholder="用户名" autocomplete="username" required>
<input name="password" placeholder="密码" type="password" autocomplete="current-password" required>
<button type="submit">登录</button>
</form>
<form id="registerForm" class="auth-form" hidden>
<input name="username" placeholder="用户名" autocomplete="username" required>
<input name="password" placeholder="密码" type="password" autocomplete="new-password" required>
<input name="confirmPassword" placeholder="确认密码" type="password" autocomplete="new-password" required>
<input name="nickname" placeholder="昵称 / 备注" required>
<button type="submit">提交申请</button>
</form>
<p id="message"></p>
</div>
</section>
</main>
<script>
const message = document.getElementById("message");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
function switchMode(mode) {
  const loginMode = mode === "login";
  loginForm.hidden = !loginMode;
  registerForm.hidden = loginMode;
  loginTab.classList.toggle("active", loginMode);
  registerTab.classList.toggle("active", !loginMode);
  loginTab.setAttribute("aria-pressed", String(loginMode));
  registerTab.setAttribute("aria-pressed", String(!loginMode));
  message.textContent = "";
}
loginTab.addEventListener("click", () => switchMode("login"));
registerTab.addEventListener("click", () => switchMode("register"));
async function postJSON(url, data) {
  const response = await fetch(url, { method: "POST", body: JSON.stringify(data) });
  return response.json();
}
loginForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  const result = await postJSON("/publish/auth/login", { username: form.get("username"), password: form.get("password") });
  if (result.code === 0) location.href = "/";
  else message.textContent = result.msg || "账号或密码错误，或账号不可用";
};
registerForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(registerForm);
  if (form.get("password") !== form.get("confirmPassword")) { message.textContent = "两次输入的密码不一致"; return; }
  const result = await postJSON("/publish/auth/register", { username: form.get("username"), password: form.get("password"), nickname: form.get("nickname") });
  message.textContent = result.msg || (result.code === 0 ? "申请已提交，请等待审核" : "提交失败");
};
</script>
</body>
</html>`
