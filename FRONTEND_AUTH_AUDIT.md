# Frontend auth/session audit

## Current login + session flow

### Supabase bootstrap
- Client: `src/app/utils/supabaseClient.ts`
- Project info: `utils/supabase/info.tsx`
- The app creates a browser Supabase client from:
  - `projectId = dkszigraljeptpeiimzg`
  - `publicAnonKey = sb_publishable_...`

### Session source of truth
- `src/app/context/AuthContext.tsx`
- On app boot:
  1. `supabase.auth.getSession()` loads the current browser session.
  2. `supabase.auth.onAuthStateChange(...)` keeps React state in sync.
- Exposed state:
  - `session`
  - `user`
  - `loading`
  - `isAdmin`
  - `signOut()`

### Route protection
- Router lives in `src/app/App.tsx`.
- Public routes:
  - `/login`
  - `/join/:inviteCode`
- All other routes are nested under `Layout`.
- `src/app/components/Layout.tsx` is the effective route guard:
  - while auth is loading: full-screen spinner
  - if no session and route is not `/login` or `/join/...`: `navigate('/login', { replace: true })`
- `src/app/components/RequireAuth.tsx` also exists, but is currently not wired into the router. The app relies on `Layout` for protection.

### Login page behavior
- File: `src/app/pages/UserLogin.tsx`
- Login mode:
  - uses `supabase.auth.signInWithPassword({ email, password })`
  - on success: toast + `navigate('/')`
- Register mode:
  - posts to `POST ${apiUrl('/signup')}`
  - includes `apikey: publicAnonKey`
  - on success: auto-runs `supabase.auth.signInWithPassword(...)`

## API integration pattern

### Shared helper
- File: `src/app/utils/api.ts`
- Base URL:
  - local dev on `127.0.0.1` -> `http://127.0.0.1:8000`
  - otherwise -> `https://${projectId}.supabase.co/functions/v1/make-server-4b732228`
- `buildApiHeaders()` behavior:
  - always sends `apikey`
  - if a user session exists, also sends:
    - `Authorization: Bearer <access_token>`
    - `X-User-JWT: <access_token>`

### Logged-in pages depend on session-backed API calls
Common protected data paths include:
- `/plants`
- `/library`
- `/following`
- `/profile`
- `/moments`
- `/stats/:userId`
- `/notifications/:email`
- `/plant-timeline/:plantId`
- `/send-direct-invite`
- `/accept-invite`

In practice, reaching a logged-in page requires **both**:
1. a valid browser Supabase session
2. reachable backend functions at `make-server-4b732228`

## What was fixed
- Fixed `UserLogin.tsx` registration flow to import `publicAnonKey` explicitly.
  - Before this, clicking register would hit a runtime `ReferenceError`.
- Fixed broken API path interpolation in these files:
  - `src/app/pages/Following.tsx`
  - `src/app/pages/UserProfile.tsx`
  - `src/app/pages/Moments.tsx`
  - `src/app/pages/Profile.tsx`
  - `src/app/pages/PlantProfileDetail.tsx`
- Those requests were incorrectly using single-quoted strings like:
  - `apiUrl('/stats/${user.id}')`
- They now correctly use template literals like:
  - ``apiUrl(`/stats/${user.id}`)``
- Normalized several auth-protected follow/profile/community writes onto `buildApiHeaders(...)` instead of page-local header assembly.
  - This removes drift between pages that were mixing user JWT headers with anon-key bearer headers.
  - Follow-related POST/DELETE flows in `Moments.tsx` and `UserProfile.tsx` now hit the same endpoint pattern and header builder.
- Added `getStoragePublicUrl(...)` in `src/app/utils/api.ts` and updated `Following.tsx` to use it.
  - This fixes a frontend runtime bug where the page referenced `projectId` without importing it.
  - It also centralizes `storage:` avatar URL resolution instead of duplicating bucket URL strings in-page.

## Build health
- `npm run build` succeeds.
- Current warning only:
  - main JS chunk is large (~1.27 MB minified before gzip warning threshold), but this does not block auth flow.

## Remaining blockers to full logged-in verification
I did **not** invent credentials and did **not** attempt external account actions beyond code inspection.

To actually verify post-login pages end-to-end, one of the following is needed:
- a valid existing user email/password, or
- permission to create/use a test account against the configured Supabase project, if backend policies allow it.

Without a real session, these exact code paths remain runtime-blocked for functional verification:
- `AuthContext.tsx` -> `supabase.auth.getSession()` must return a real session
- `Layout.tsx` -> requires `session` to render protected routes
- any page calling `buildApiHeaders()` for authenticated function requests

## Fast follow-up checklist
1. Start dev server: `npm run dev`
2. Open app and authenticate with a real Supabase user
3. Verify these first after login:
   - `/`
   - `/interaction`
   - `/moments`
   - `/profile`
   - `/following`
4. Confirm network calls carry:
   - `Authorization: Bearer <user access token>`
   - `X-User-JWT: <same token>`
5. If a page still fails, inspect the matching endpoint in `make-server-4b732228`

## Risk notes
- There is some duplicated auth/request logic across pages instead of using `apiGet/apiPost/...` consistently.
- `RequireAuth.tsx` is currently unused, so auth protection logic effectively lives in `Layout.tsx`.
- Several pages manually construct headers; future cleanup should normalize them onto `buildApiHeaders()` to reduce auth drift.
