# Publish Auth UI and Registration Design

## Goal

Build a first version of the publish-service login and registration experience on top of the existing local publish feature.

The feature covers both sides:

1. A visitor-facing login and registration page for the publish site.
2. A management UI in the existing publish settings page for reviewing and managing publish visitor accounts.

This design intentionally does not add per-account content permissions. Once a visitor is authenticated, content visibility continues to follow the existing publish access rules.

## Current Context

The project already has:

- Publish service settings in `app/src/config/publish.ts`.
- Document-level publish access UI in `app/src/protyle/util/publishAccess.ts`.
- Publish service configuration in `kernel/conf/publish.go`.
- Publish reverse proxy authentication in `kernel/server/proxy/publish.go`.
- Publish JWT/session helpers in `kernel/model/auth.go`.
- Existing Basic Auth accounts under `Conf.Publish.Auth.Accounts`.

Recent repository work removed or hid official account and subscription features. This feature must remain local and must not reintroduce official cloud account dependencies.

## Chosen Approach

Use an independent local publish visitor account file, while keeping existing Basic Auth behavior compatible.

New account data is stored in:

```text
data/.siyuan/publishUsers.json
```

This avoids forcing registration state into `conf.json` and avoids spreading plaintext passwords further through the existing publish auth account configuration.

Existing `Conf.Publish.Auth.Accounts` remain supported for Basic Auth and existing deployments. The new visitor login/register UI manages `publishUsers.json`.

## Data Model

Each publish visitor account stores:

```json
{
  "username": "alice",
  "passwordHash": "$2a$10$exampleBcryptHashValue",
  "nickname": "Alice / application note",
  "status": "pending",
  "created": 1710000000000,
  "updated": 1710000000000
}
```

Allowed statuses:

- `pending`: registered but not approved.
- `approved`: may log in to the publish site.
- `rejected`: rejected by an administrator.
- `disabled`: previously approved or known account that is temporarily blocked.

Passwords are stored only as bcrypt hashes using `golang.org/x/crypto/bcrypt`, which is already available through the kernel module dependency graph. The backend never returns `passwordHash` to the frontend.

## Visitor Authentication

Visitor-facing publish auth endpoints are handled at the publish service boundary, before ordinary reverse proxy forwarding:

- `POST /publish/auth/login`
- `POST /publish/auth/register`
- `POST /publish/auth/logout`

Login:

- Accepts username and password.
- Checks `publishUsers.json`.
- Allows only `approved` accounts.
- On success, creates a publish visitor session cookie using the existing session mechanism.
- Injects the existing publish reader JWT through `X-Auth-Token` when proxying downstream requests.
- On failure, returns a generic error: "账号或密码错误，或账号不可用".

Registration:

- Accepts username, password, and nickname or application note.
- Creates a `pending` account.
- Rejects duplicate usernames.
- Does not accept client-provided status or role fields.
- Returns a success message indicating that the application was submitted and requires review.

Logout:

- Deletes the publish visitor session.
- Clears the publish visitor session cookie.

Existing Basic Auth compatibility:

- If a request includes Basic Auth credentials, the current `Conf.Publish.Auth.Accounts` path still works.
- If a request has a valid publish visitor session cookie, it works through the new account model.
- If neither is present, normal browser navigation receives the publish login page instead of the browser Basic Auth prompt.

## Management APIs

Management APIs live with the existing setting/publish boundary and require administrator permissions:

- `POST /api/setting/getPublishUsers`
- `POST /api/setting/approvePublishUser`
- `POST /api/setting/rejectPublishUser`
- `POST /api/setting/disablePublishUser`
- `POST /api/setting/deletePublishUser`
- `POST /api/setting/resetPublishUserPassword`

Route middleware should match the existing publish setting routes:

```text
CheckAuth + CheckAdminRole + CheckReadonly
```

`getPublishUsers` returns usernames, nicknames, statuses, and timestamps, but never password hashes.

## Management UI

Extend the existing publish settings page in `app/src/config/publish.ts`.

The page keeps the current sections:

- Publish service enable switch.
- Publish service port.
- Publish addresses.
- Existing Basic Auth enable switch and account list.

Add a new "publish visitor accounts" section beneath the current publish auth account area.

The account table shows:

- Username.
- Nickname/application note.
- Status.
- Created time.
- Actions.

Actions by status:

- `pending`: approve, reject, delete.
- `approved`: reset password, disable, delete.
- `rejected`: approve, delete.
- `disabled`: approve or enable, delete.

The UI reloads the account list after each operation. It should not optimistically update rows, because account state is security-sensitive and may fail due to backend validation or file write errors.

The mobile settings UI uses the same content in a vertical layout, matching the existing publish settings mobile pattern.

## Visitor UI

Use the "document first" layout selected during brainstorming.

Desktop layout:

- Left side: publish site context, current path or document context, and a short protected-site message.
- Right side: login/register panel.

Mobile layout:

- Context above.
- Login/register panel below.

Login form:

- Username.
- Password.
- Submit button.

Registration form:

- Username.
- Password.
- Confirm password.
- Nickname/application note.
- Submit button.

Visitor feedback:

- Registration success: "申请已提交，请等待审核".
- Login failure: "账号或密码错误，或账号不可用".
- Pending, rejected, disabled, and wrong password are not distinguished on the visitor page.

The page should reuse existing `b3-*` controls and project styling. It should not add a UI framework or broad theme changes.

## Error Handling

Backend validation:

- Username is required.
- Password is required.
- Nickname/application note is required.
- Duplicate username is rejected.
- Registration always creates `pending` status.
- Login only accepts `approved` accounts.
- File read/write errors are returned to callers.

Frontend validation:

- Required fields are checked before submit.
- Registration checks password confirmation before submit.
- Management operations display normal existing `fetchPost` failure behavior.

Visitor-facing login errors deliberately stay generic to avoid leaking account state.

## Security Boundaries

- New visitor account passwords are stored as bcrypt hashes only.
- The visitor registration API cannot set account status.
- Visitor login grants only the existing publish reader role.
- Management APIs require administrator permission.
- Existing publish access filtering remains unchanged.
- Existing Basic Auth accounts remain compatible and are not migrated in the first version.
- This feature is local-only and must not call official account, subscription, or cloud services.

## Out of Scope

- Email validation.
- Password reset by visitors.
- Per-account notebook or document permissions.
- Migrating existing Basic Auth accounts into `publishUsers.json`.
- Public profile pages or user settings.
- CAPTCHA, invite codes, rate limiting, or external identity providers.

These can be added later if the publish account model needs to grow.

## Verification Plan

Backend tests:

- Load and save `publishUsers.json`.
- Register a new account as `pending`.
- Reject duplicate usernames.
- Approve, reject, disable, delete, and reset password.
- Login succeeds only for `approved` users with the right password.
- Login failure does not reveal pending, rejected, or disabled state.

Integration or handler tests:

- Management routes require admin permissions.
- Publish auth login creates a session for approved users.
- Basic Auth through existing `Conf.Publish.Auth.Accounts` still works.

Frontend verification:

- Run the available frontend webpack or TypeScript check from `app`.
- Manually verify the publish settings page shows the new account section.
- Manually verify the publish visitor login/register page on desktop and mobile widths.

Manual publish flow:

1. Enable publish service.
2. Open publish port without a session and confirm the visitor login page appears.
3. Register a new visitor account and confirm it cannot log in before approval.
4. Approve it in the management UI.
5. Log in successfully.
6. Disable the account and confirm login no longer succeeds.
7. Confirm existing Basic Auth credentials still work.
