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
	if err != nil {
		writePublishAuthJSON(w, http.StatusUnauthorized, -1, model.ErrPublishUserAuthFailed.Error(), nil)
		return
	}

	token, err := model.NewPublishReaderToken(user.Username)
	if err != nil {
		writePublishAuthJSON(w, http.StatusInternalServerError, -1, err.Error(), nil)
		return
	}
	sessionID := model.GetNewSessionID()
	model.AddPublishVisitorSession(sessionID, user.Username, token)
	http.SetCookie(w, &http.Cookie{
		Name:     model.SessionIdCookieName,
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   util.SSL,
	})
	writePublishAuthJSON(w, http.StatusOK, 0, "", map[string]any{"username": user.Username})
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
</head>
<body>
<main>
<section>
<h1>Protected Publish Site</h1>
<p>请登录或提交访问申请。</p>
</section>
<section>
<button id="loginTab" type="button">登录</button>
<button id="registerTab" type="button">注册</button>
<form id="loginForm">
<input name="username" placeholder="用户名" required>
<input name="password" placeholder="密码" type="password" required>
<button type="submit">登录</button>
</form>
<form id="registerForm" hidden>
<input name="username" placeholder="用户名" required>
<input name="password" placeholder="密码" type="password" required>
<input name="confirmPassword" placeholder="确认密码" type="password" required>
<input name="nickname" placeholder="昵称 / 备注" required>
<button type="submit">提交申请</button>
</form>
<p id="message"></p>
</section>
</main>
<script>
const message = document.getElementById("message");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
document.getElementById("loginTab").onclick = () => { loginForm.hidden = false; registerForm.hidden = true; message.textContent = ""; };
document.getElementById("registerTab").onclick = () => { loginForm.hidden = true; registerForm.hidden = false; message.textContent = ""; };
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
