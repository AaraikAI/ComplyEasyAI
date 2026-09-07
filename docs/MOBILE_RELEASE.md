# Mobile app — iOS App Store release and testing

The mobile app lives in `mobile/` (Expo SDK 56, React Native 0.85, managed
workflow, EAS Build/Submit). Bundle id `com.complyeasy.ai`, slug
`complyeasy-ai`. It authenticates with email + password against the same API
as the web app (`/api/v2`, Bearer tokens in the response body — see the
2026-07-14 note in `.claude/CLAUDE.md`).

## What was fixed on 2026-09-07 (blockers found while preparing this)

| Blocker | Fix |
|---|---|
| `eas.json` production API URL was `https://api.complyeasyai.com`, which has no DNS record; `api.ts` defaulted to `https://api.complyeasy.ai` (also dead). Every request would have failed. | Both point at `https://www.complyeasyai.com` (CloudFront routes `/api/*` to the Express origin). Preview points at `https://staging.complyeasyai.com` for when staging exists. |
| `app.json` referenced `./assets/icon.png`, `./assets/favicon.png` but `mobile/assets/` did not exist — EAS Build fails. | Generated `icon.png` (1024², opaque), `adaptive-icon.png` (Android foreground) and `favicon.png` from `public/favicon.svg`. **These are derived placeholders**; replace with the designed icon before submission. |
| Certificate-pin guard threw in every production build unless pins were set, and its map was keyed to the dead host. | Map keyed to the configured host; fail-closed only when `EXPO_PUBLIC_CERT_PIN_ENFORCE=true` (there is no native pinning layer yet, so pins are inert configuration). |
| No `ITSAppUsesNonExemptEncryption` → App Store Connect asks the export-compliance question on every build. | Set to `false` (the app only uses HTTPS). |
| No URL `scheme` (needed for deep links / magic-link return). | `scheme: "complyeasy"`. |

Still required and not in the repo: an EAS project id (`eas init`), Apple
credentials, the `EXPO_TOKEN`/`APPLE_*` GitHub secrets used by
`.github/workflows/mobile.yml`, and a privacy policy URL.

## One-time setup

1. **Apple Developer Program** membership (organisation, $99/yr) for the AARAIK LLC
   account. Enable two-factor on the Apple ID you will use with EAS.
2. **App Store Connect → My Apps → +** New App: platform iOS, name
   "ComplyEasyAI", primary language, bundle id `com.complyeasy.ai` (register it
   first under Certificates, Identifiers & Profiles → Identifiers if it is not
   offered), SKU `complyeasy-ai`. Note the numeric **App ID** (ASC_APP_ID) and
   your **Team ID**.
3. **Expo account + EAS project** (from `mobile/`):
   ```bash
   npm install -g eas-cli
   eas login
   eas init            # writes extra.eas.projectId into app.json — commit it
   eas credentials -p ios   # let EAS create the distribution cert + provisioning profile
   ```
4. **Secrets**: in the GitHub repo add `EXPO_TOKEN` (Expo access token),
   `APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID` (the `submit.production.ios` block in
   `eas.json` reads them); for local `eas submit` an **App Store Connect API key**
   is simplest (`eas credentials` can store it).
5. **App Store listing** (App Store Connect → the app → App Information / App
   Privacy): description, keywords, support URL, marketing URL, **privacy policy
   URL** (`https://www.complyeasyai.com/privacy`), App Privacy questionnaire
   (data collected: email, name, org identifiers — "linked to user", used for app
   functionality), age rating (4+), category Business, screenshots for 6.7" and
   6.5" iPhone and 12.9" iPad (the app declares `supportsTablet`), and a demo
   account for App Review (password login; create it in production first).

## Build → TestFlight → App Store

From `mobile/` on `main` after CI is green:

```bash
# 1. internal build for device testing (uses the preview profile / staging URL)
eas build --platform ios --profile preview

# 2. production build (autoIncrement bumps the build number remotely)
eas build --platform ios --profile production

# 3. upload the latest production build to App Store Connect
eas submit --platform ios --latest
```

Or dispatch `.github/workflows/mobile.yml` (Actions → Mobile App Build & Deploy →
Run workflow → platform `ios`, profile `production`); its `submit` job runs
`eas submit --latest` when the build succeeds. The workflow's build jobs are
skipped on PRs by design — only `workflow_dispatch` builds.

Then in App Store Connect:

6. **TestFlight** tab → the build appears after processing (10–30 min). Add
   internal testers (up to 100, no review) and, optionally, an external group
   (Beta App Review, ~1 day). Testers install via the TestFlight app.
7. When TestFlight is clean: **App Store** tab → the version → select the build,
   fill "What's New", Sign-in required = yes with the demo credentials, then
   **Add for Review → Submit**. Review typically takes 24–48 h. Choose manual or
   automatic release.

Version bumps: `expo.version` in `app.json` is the marketing version
(1.0.0); the build number is managed by EAS (`appVersionSource: remote`,
`autoIncrement: true`).

## Testing the app

### Automated (already in CI: `mobile.yml` → Lint & Test)
```bash
cd mobile
npm ci --cache /tmp/npmc-mobile   # ~/.npm has root-owned files on the dev Mac
npx tsc --noEmit
npx eslint src --ext .ts,.tsx
npx jest --ci                     # 5 suites / 71 tests incl. the pin-guard tests
```

### Local against a running backend (simulator)
1. Start the local stack (see the E2E recipe in `.claude/CLAUDE.md`): Postgres +
   Redis containers, `prisma db push`, backend on `:3001`. The mobile dev profile
   sets `EXPO_PUBLIC_API_URL=http://localhost:3001`; on a physical device use your
   Mac's LAN IP instead.
2. `cd mobile && npx expo start --ios` (iOS Simulator via Expo Go; needs Xcode)
   or `--android`. For native modules beyond Expo Go, build a dev client once:
   `eas build --platform ios --profile development` (simulator build) and install
   the resulting `.app` on the simulator.
3. Register a user through the web app (`http://localhost:4173`), then in the
   mobile app: log in with email + password, check Dashboard, Frameworks, Risks,
   Issues, Vendors and Settings load data; use "Forgot your password?"; kill and
   relaunch the app (tokens are in SecureStore, session should persist); log out.
4. Against production: point a preview build at `https://www.complyeasyai.com`
   (set `EXPO_PUBLIC_API_URL` in the preview profile temporarily) and repeat with a
   real account. Watch for CSRF-free Bearer mutations (mobile is exempt from the
   CSRF token — see `server/src/middleware/csrf.ts`).

### Manual pre-submission checklist
- Cold start < 3 s on an iPhone 12-class device; no red-box / yellow-box.
- Login with wrong password shows the inline error; correct password lands on
  Dashboard; 401 after token expiry triggers a silent refresh, not a logout.
- Airplane mode: screens show an error state, not a crash; recovery on reconnect.
- Rotation locked to portrait (`orientation: portrait`); iPad layout usable.
- Dark/light appearance (`userInterfaceStyle: automatic`).
- Deep link `complyeasy://` opens the app.
- App Review requirements: no placeholder text, working support/privacy URLs,
  demo account works, no references to other platforms' stores.
