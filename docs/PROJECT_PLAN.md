# ZenBalance — Project Plan

A pomodoro focus app where staying still grows a plant. Built with React Native / Expo as a solo student project.

> This is the internal build plan for an implementing (AI coding) agent — not the public GitHub homepage. For that, see `README.md`. This document, `AGENT_INSTRUCTIONS.md`, and `STYLE_GUIDE.md` together are the full spec: this file tells you *what* to build and in what order, `AGENT_INSTRUCTIONS.md` tells you *how* the code should be structured, `STYLE_GUIDE.md` tells you what it should look like.

## Where to start

**Read `AGENT_INSTRUCTIONS.md` first, in full, before anything below.** It sets the required project structure, navigation, and state-management conventions (taken from the student's own course material) that every step in this plan must be implemented through.

Section 7 ("Full step-by-step plan") is the complete, checkbox-by-checkbox plan — start there, at Phase 1, Step 1. Phase 1 is ordered **UI first, sensors last**: scaffold the app, then build onboarding (language + tutorial), the home screen with its plant picker, and a session screen with a manual Stop button and a mocked "timer reaches zero = success" rule — all clickable and demoable before the accelerometer is wired in at all. Only once that full UI loop works do you replace the mocked success rule with the real stillness-detection sensor (Step 6). Work through the checkboxes in order; don't skip the "test" items. Do not start Phase 2 (group sessions) or Phase 3 (Skia visual polish) until every Phase 1 checkbox is checked and the Phase 1 checkpoint passes on a real device.

> **Note on language:** this document and the accompanying `STYLE_GUIDE.md` / `AGENT_INSTRUCTIONS.md` are written in English, since that matches the Expo/React Native ecosystem, package names and most tutorials your coding agent will reference. All in-app copy shown to end users should exist in both Dutch and English (see [Onboarding & language](#onboarding--language) below).

---

## 1. Concept summary

ZenBalance flips the usual pomodoro logic: instead of an app that demands your attention, success means *not touching your phone*. At the start of a focus session the user places the phone face-up and still on a table. While it stays still, a droplet of water falls onto a virtual plant. Picking up or moving the phone loses that droplet and the plant does not grow. Completing the full session without movement waters the plant, which grows one stage further — from a tiny seedling to a full, blooming plant.

The core interaction (proving focus by literally leaving the phone alone) only makes sense on a native device: a web app has no reliable, continuous access to motion sensors.

### Why this concept works for a native app

- The kernel mechanic (accelerometer-based stillness detection) is impossible to replicate convincingly in a web app.
- It uses haptics, local notifications, sharing, and a light realtime sync — all things that are natural on mobile and awkward on web.
- It stays scoped: no heavy backend, no ML, no payment processing.

---

## 2. Core mechanics

### 2.1 Stillness detection (the heart of the app)

- Read `expo-sensors` (`Accelerometer`) at a low sample rate (roughly every 200–300ms — no need for 60fps).
- Compute the magnitude of the acceleration vector `sqrt(x² + y² + z²)`.
- On a still, flat phone this stays close to gravity (~1g) with tiny natural jitter.
- Compare each reading against a rolling average; if it deviates past a threshold for a few consecutive readings (debounce — do **not** fail on a single spike), treat it as "picked up" and fail the session.
- Treat the app going to background (`AppState` change) as movement too — this avoids needing background sensor access, which is restricted on both platforms anyway.

### 2.2 Timer

- Do not rely on counting `setInterval` ticks (they drift). Store the session's `Date.now()` start time and always compute remaining time as `duration - (Date.now() - startTime)`.

### 2.3 Plant growth & droplets

- A session that completes without movement earns **droplets**, proportional to session length (e.g. roughly 1 droplet per 5 minutes of stillness — tune this during playtesting).
- The user picks a plant to grow **on the Home screen**, not during onboarding: a small plant needs few total droplets (finishes quickly, good for short-term motivation), a large plant needs many more droplets and therefore several longer sessions. Home is also where they **change** plants later — putting the picker in onboarding would make that first choice permanent. Droplets are a global total, so switching plants keeps existing progress and only changes the bloom threshold.
- Growth stages (suggested minimum: 4–5): seedling → sprout → small plant → mature plant → blooming plant. Each stage swap is just an asset/illustration change driven by a `total droplets / droplets needed` ratio — no physics engine needed.
- Give each growth stage its own **atmosphere**, not just plant size: softer/brighter light, a couple of butterflies, a fuller pot — small layered illustration details per stage. This is still just swapping static layered images; it does not need Skia.
- Failing a session (movement) simply loses that session's droplet — it does not reset existing progress.

### 2.4 Focus overlay & own-notification suppression

- During a session, show a full-screen "focus overlay" and use `expo-notifications` to suppress the app's own notifications. This works identically on Android and iOS because it only controls the app's own notification behavior, not the OS.
- **Deliberately out of scope:** toggling the system-wide Do Not Disturb / Focus mode. iOS exposes no public API for this at all, and Android requires the user to manually grant notification-policy access plus custom native (Kotlin/Java) code — not worth the complexity for this project. Do not attempt this.

### 2.5 Onboarding & language

- On first launch: **welcome + language picker first**, then a short tutorial explaining the mechanic (place the phone down → earn droplets → the plant grows). Two screens, no plant picker — that lives on Home (see 2.3).
- As part of that same tutorial, ask the user to pick a language: Dutch or English. Use `expo-localization` to read the device's system language and pre-select it as the default; let the user override it.
- Persist `hasCompletedOnboarding` and `languagePreference` in `AsyncStorage` so the tutorial only ever shows once.
- Keep translated strings in two simple JSON dictionaries (`locales/nl.json`, `locales/en.json`) read through a small i18n hook/context — no need for a heavy i18n library for a project this size.

### 2.6 Group sessions ("focus together") — Phase 2, build after the solo core works

- A host creates a session and gets a short join code (like a quiz-app room code).
- Friends type the code in to join — no Bluetooth, no device pairing.
- When the host taps start, the app writes **one shared start timestamp** to Firebase (Firestore or Realtime Database). Every joined device computes the offset between that timestamp and its own clock, and starts its local countdown at the same real-world moment.
- The group shares **one plant**, not individual plants side by side. Everyone must stay still to keep it alive.
- If anyone moves during a group session, the shared plant instantly wilts for the whole group, and everyone sees a clear callout naming who did it (e.g. *"Jan killed the plant 🥀"*). This is the group's only "penalty" — deliberately playful and social, not a real-world transaction (no payment integration, no Stripe).
- Use `@react-native-community/netinfo` to detect connectivity before attempting to join/host a group session, and fall back gracefully to solo mode when there's no wifi/data (relevant at a café with flaky connectivity).

### 2.7 Sharing

- Use `react-native-view-shot` to capture the plant view as an image.
- Use `expo-sharing` to open the native OS share sheet with that image (WhatsApp, Instagram, Mail, ...).

### 2.8 Keeping the screen awake during a session

- A session needs the accelerometer to keep sampling and the countdown to stay visible for its full duration (potentially 25–45+ minutes), so the screen must not be allowed to auto-lock or dim.
- Call `useKeepAwake()` (or `activateKeepAwakeAsync()` / `deactivateKeepAwake()`) from `expo-keep-awake` for exactly the lifetime of an active session — activate when the session starts, release the moment it ends or is cancelled. Never leave it active outside a session.
- Because the screen is now guaranteed to be on continuously for the whole session, battery draw from the display itself becomes a real concern — see `STYLE_GUIDE.md` for how the session screen's visual design (true-black AMOLED background) directly addresses this.

---

## 3. Tech stack

| Concern | Package | Notes |
|---|---|---|
| Motion/stillness detection (core) | `expo-sensors` (Accelerometer) | This *is* the core interaction, not an add-on |
| Haptic feedback | `expo-haptics` | Pulse on droplet, success pattern on completion, warning on detected movement |
| Sharing | `expo-sharing` | Native share sheet |
| Own-notification suppression | `expo-notifications` | Foreground focus overlay + suppress own notifications |
| Language detection | `expo-localization` | Suggests device language as onboarding default |
| Local persistence | `@react-native-async-storage/async-storage` | Growth stage, chosen plant, language, onboarding-seen flag, session count, streak |
| Screenshot for sharing | `react-native-view-shot` | Captures the plant view as an image |
| Keep screen awake | `expo-keep-awake` | Prevents the OS from locking/dimming the screen during an active session, so sensor sampling and the countdown never get interrupted |
| Timer & growth animation (MVP) | React Native's built-in `Animated` API | Keep the baseline simple — no extra dependency |
| Shared/persisted app state | `zustand` (+ `persist` middleware over `AsyncStorage`) | The course-taught state pattern, extended with persistence — see `AGENT_INSTRUCTIONS.md` section 1.3 |
| Lists (plant picker, group members, etc.) | `@shopify/flash-list` | The course-taught list component; use it for anything beyond a couple of items |
| **— Phase 2 (build after the solo core works) —** | | |
| Group session sync | Firebase (Firestore or Realtime Database) | Shares one start timestamp + shared plant state via a short join code |
| Connectivity check | `@react-native-community/netinfo` | Detects wifi/data before group features; graceful solo fallback |
| **— Phase 3, optional (build last, only if time remains) —** | | |
| Growth animation upgrade | `@shopify/react-native-skia` + `react-native-reanimated` | Replaces the fill animation with a soft liquid/flame-style effect, sensor-driven without re-renders. Purely a visual upgrade — the app is fully demoable without it |

### ⚠️ Important setup caveat: Skia requires a development build

`@shopify/react-native-skia` includes native C++ bindings and **will not run inside the plain Expo Go app** from the App/Play Store. It is entirely optional (Phase 3) — the app is fully functional and demoable without it. If/when Phase 3 is reached:

1. Install `expo-dev-client`.
2. Build a custom development client via `eas build --profile development` (or `npx expo run:ios` / `npx expo run:android` locally).
3. From then on, develop against that custom dev client instead of Expo Go.

Build and test the MVP entirely in plain Expo Go first — only switch to a dev client once Skia is actually being added, to avoid this overhead from day one.

`react-native-reanimated` also needs its Babel plugin registered (see step 4 below) but — unlike Skia — works fine inside Expo Go for standard use cases.

---

## 4. Project setup steps

```bash
# 1. Scaffold the app
npx create-expo-app@latest --template default@sdk-57
# app name: zenbalance — see AGENT_INSTRUCTIONS.md section 1.1 for the required src/ layout
cd zenbalance

# 2. Install Expo SDK modules needed for the solo MVP
npx expo install expo-sensors expo-haptics expo-sharing expo-notifications expo-localization expo-keep-awake

# 3. Install third-party libraries needed for the solo MVP
npx expo install @react-native-async-storage/async-storage react-native-view-shot @shopify/flash-list
npx expo install react-native-gesture-handler react-native-screens react-native-safe-area-context
npm install zustand

# --- Everything below this line is later phases. Do not install it yet. ---
# --- Get the solo MVP (Phase 1) fully working and tested first.        ---

# 4. Phase 2 (group sessions) — only once Phase 1 works end-to-end:
npx expo install @react-native-community/netinfo
npm install firebase
# Create a Firebase project at https://console.firebase.google.com, enable
# Firestore (or Realtime Database), and add the web config to a local,
# git-ignored config file (see "Environment & secrets" below).

# 5. Phase 3 (optional visual polish) — build this LAST, only if time remains:
npx expo install react-native-reanimated
# Register the Reanimated Babel plugin in babel.config.js:
#   plugins: ['react-native-reanimated/plugin'],   <-- must be listed LAST
npx expo install @shopify/react-native-skia
npx expo install expo-dev-client
eas build --profile development
```

### Navigation & project structure

**Do not improvise this — `AGENT_INSTRUCTIONS.md` section 1.1–1.2 is the authoritative project structure and navigation setup** (a `src/` folder, Expo Router with `NativeTabs`, nested Stacks per tab, the exact route map), copied from the student's own course material. Follow it exactly rather than the generic patterns a general React Native/Expo guide might suggest.

---

## 5. Data & logic modules (beyond navigation)

Section 1.1 of `AGENT_INSTRUCTIONS.md` covers where screens and components live. Beyond that, add these logic modules under `src/hooks/` and `src/lib/` (or fold the Zustand actions directly into `use-zenbalance-store.ts` per `AGENT_INSTRUCTIONS.md` section 1.3 — either is fine, just don't duplicate the same state in two places):

```
src/
  hooks/
    useStillnessDetector.ts     # wraps expo-sensors Accelerometer + threshold logic
    useSessionTimer.ts          # timestamp-based countdown
    use-zenbalance-store.ts     # Zustand store + AsyncStorage persistence (see AGENT_INSTRUCTIONS.md 1.3)
    useLocalization.ts          # reads languagePreference from the store, returns matching strings
  lib/
    firebase.ts                  # Firebase init + group session helpers (Phase 2 only)
    plantGrowth.ts                # droplet math: plant size thresholds, stage lookup
  locales/
    en.json
    nl.json
  assets/
    plants/                      # growth-stage illustrations, per plant size
```

---

## 6. Data model (local storage)

Fields on the persisted Zustand store (`use-zenbalance-store.ts`, `AGENT_INSTRUCTIONS.md` section 1.3), backed by `AsyncStorage` through the `persist` middleware — not hand-written `AsyncStorage.getItem`/`setItem` calls:

- `hasCompletedOnboarding: boolean`
- `languagePreference: 'nl' | 'en'`
- `chosenPlantId: string`
- `totalDroplets: number`
- `totalSessionsCompleted: number`
- `currentStreak: number`

### Firebase (group sessions only)

A minimal Firestore structure is enough:

```
sessions/{sessionCode}
  hostId: string
  startTimestamp: Timestamp | null   // set when host taps start
  durationSeconds: number
  plantAlive: boolean
  killedBy: string | null            // name of whoever moved first
  members: { [userId]: { name: string, joinedAt: Timestamp } }
```

Any joined client listens to this one document; writes are simple field updates, no complex queries needed.

---

## 7. Full step-by-step plan

Build and fully validate each phase before starting the next one — don't parallelize this for a solo/AI-driven build, it makes debugging much harder. **The app must be a complete, working, demoable solo experience at the end of Phase 1 before any Phase 2 or Phase 3 work begins.** Every checkbox is a concrete, testable unit of work — don't skip the "test" items, they're what catch problems before they compound.

### Phase 1 — Solo MVP (build this first, get it rock solid)

This phase is deliberately ordered **UI first, sensors last**: build every screen you can see and tap with mocked/manual data, get the whole app feeling real and navigable, and only wire in the actual accelerometer once everything around it already works. That way the one genuinely uncertain piece of this project (sensor threshold tuning) is isolated to a single step, tested against a harness that's already proven — instead of being tangled up with UI bugs at the same time.

> **One small optional exception:** at any point early on (even before Step 1, it takes five minutes), it's worth doing a *throwaway* test completely outside the real app — a single blank Expo project that just logs accelerometer magnitude to the console — purely to build confidence that the sensor behaves the way section 2.1 describes on your actual phone. Throw that test project away afterward; it does not block or feed into any step below. Skip it entirely if you'd rather not — nothing here requires it.

**Step 1 — Project scaffold**
- [ ] Scaffold and set up navigation exactly per `AGENT_INSTRUCTIONS.md` sections 1.1–1.2: `npx create-expo-app@latest --template default@sdk-57`, name it `zenbalance`, everything under `src/`.
- [ ] Open it on a **real phone** via Expo Go, not just a simulator.
- [ ] Install the Phase 1 packages (see section 4's commands 1–3 below).
- [ ] Build the empty route skeleton from `AGENT_INSTRUCTIONS.md`'s route map: the onboarding Stack, the `(home)` and `together` tabs (each with their own nested Stack), all with placeholder content.
- [ ] Confirm the tab bar renders natively, both tabs are reachable, and the onboarding Stack shows first (it can be hardcoded to always show for now — the real `hasCompletedOnboarding` gate comes in Step 2).

**Step 2 — Onboarding UI: language, then tutorial**
- [ ] Build the 2-step onboarding flow as pure UI: welcome + language picker (Dutch/English) → mechanic explanation (tutorial), as the screens under `src/app/onboarding/` from the route map. Language comes first so the tutorial can be read in the chosen language. The plant picker is **not** part of onboarding — see Step 3.
- [ ] Read the device locale via `expo-localization` to pre-select NL or EN as the default; let the user tap to override it.
- [ ] Add `locales/en.json` and `locales/nl.json` with the strings used so far, plus a small `useLocalization()` hook that reads the store's `languagePreference`.
- [ ] Set up `src/hooks/use-zenbalance-store.ts` per `AGENT_INSTRUCTIONS.md` section 1.3 (Zustand + `persist` + AsyncStorage) with at least `hasCompletedOnboarding`, `languagePreference`, and `chosenPlantId`; call its `completeOnboarding(language)` action when onboarding finishes. `chosenPlantId` stays `null` until Step 3's picker sets it.
- [ ] Wire the root layout to actually gate on `hasCompletedOnboarding` now (show onboarding vs. the tab navigator).
- [ ] **Test:** fresh-install the app (clear storage), confirm onboarding shows once and never again after completing it, and confirm the language choice actually changes visible copy — including on the tutorial screen that follows it.

**Step 3 — Home screen UI + plant picker**
- [ ] Add `src/data/plants.ts` (a `Plant` type mirroring the course's `Coffee`, one entry per size, with each plant's `dropletsToBloom` threshold).
- [ ] Build `components/PlantView.tsx` rendering the chosen plant at a **hardcoded/mocked growth stage** for now (real droplet-driven growth comes in Step 5).
- [ ] Build the plant picker as its own screen in the Home stack (`(home)/plants.tsx`, a `FlashList` per `AGENT_INSTRUCTIONS.md` section 1.4). It sets `chosenPlantId`, and is reachable both from the empty state and from a "change plant" control, so the choice is never permanent.
- [ ] Build the Home screen: `PlantView` + a "Start session" button + a session-duration picker. When `chosenPlantId` is `null` (every freshly onboarded user), show a "choose your plant" empty state instead of the plant and the start button.
- [ ] **Test:** finish onboarding → land on the empty state → pick a plant → confirm it renders and survives a restart → change to a different plant and confirm droplets carry over → pick a duration and see the button ready to start; nothing needs to actually start a session yet.

**Step 4 — Session screen UI (manual control only, no sensor yet)**
- [ ] Create `hooks/useSessionTimer.ts`: store `startTime = Date.now()` plus the chosen `durationSeconds`; on each tick compute remaining time as `durationSeconds - (Date.now() - startTime) / 1000` (never count raw ticks, they drift).
- [ ] Build the Session screen: countdown display driven by that hook, plus a visible, tappable **"Stop" button** that lets the user manually end the session early.
- [ ] For now, treat the timer reaching zero as an automatic, temporary "success" (no sensor check yet) and manually stopping as a "cancelled" outcome — this is a placeholder rule you'll replace in Step 6.
- [ ] **Test:** start a session, let it run to zero, confirm it reports success; start another and tap Stop halfway through, confirm it reports cancelled — both purely from the UI, no sensor involved.

**Step 5 — Droplet & growth logic (still no sensor — wire the mocked loop end-to-end)**
- [ ] Create `lib/plantGrowth.ts`: droplet thresholds per plant size, a `getStageForDroplets()` helper.
- [ ] On the Step 4 "success" outcome, compute droplets earned as a function of `durationSeconds` (section 2.3) and persist `totalDroplets`.
- [ ] Make `PlantView` (Step 3) render its stage from real `totalDroplets` instead of the hardcoded value.
- [ ] Add the per-stage "atmosphere" layered illustration details from section 2.3.
- [ ] **Test:** run several full sessions to completion, confirm droplets accumulate and the plant visibly grows through its stages, and that this all survives an app restart. At this point you have a fully clickable, demoable prototype — just without real focus-detection yet.

**Step 6 — Stillness detection: wire in the real sensor** *(the one piece the whole concept depends on — now built against an already-working harness)*
- [ ] Create `hooks/useStillnessDetector.ts`.
- [ ] Subscribe to `Accelerometer.addListener`, update interval ~200–300ms (`Accelerometer.setUpdateInterval(250)`).
- [ ] Compute magnitude per reading: `sqrt(x² + y² + z²)`; keep a rolling baseline and compare each new reading's deviation against a threshold.
- [ ] Require a few consecutive over-threshold readings (debounce) before flagging "moved" — a single spike should never fail a session.
- [ ] Also treat an `AppState` change to background/inactive as "moved."
- [ ] Replace Step 4's placeholder rule: the session now fails for real if `isStill` flips false before the timer completes — keep the manual **Stop** button too, but give it a distinct outcome/copy from an accidental-movement failure ("you ended it" vs. "you moved"), since they mean different things to the user.
- [ ] **Test on a real device, at least 10 runs:** succeed normally; fail by picking the phone up; fail by backgrounding the app; deliberately tap the table next to it and confirm that does *not* false-positive; confirm the manual Stop button still works and reads differently from a movement failure.

**Step 7 — Keep-awake**
- [ ] Import `expo-keep-awake`; call `useKeepAwake()` while the Session screen is active (or pair `activateKeepAwakeAsync()`/`deactivateKeepAwake()` with session start/end).
- [ ] **Test:** start a session, wait past your phone's normal auto-lock timeout, confirm the screen stays on; confirm it can auto-lock normally again once you leave the Session screen.

**Step 8 — AMOLED session palette**
- [ ] Apply the true-black `session-*` palette from `STYLE_GUIDE.md` to the Session screen specifically — not the rest of the app.
- [ ] **Test:** visually confirm the session screen is near-pure-black outside the plant/timer visuals, and that the rest of the app keeps its regular light/dark theme.

**Step 9 — Focus overlay + notification suppression**
- [ ] Build the full-screen focus overlay shown during a session.
- [ ] Configure `expo-notifications`' handler to suppress the app's own alerts while a session is active.
- [ ] **Test:** trigger a test notification while a session is running (should be suppressed) and again outside a session (should show normally).

**Step 10 — Sharing**
- [ ] Wire `react-native-view-shot` to capture `PlantView`.
- [ ] Wire `expo-sharing` to open the native share sheet with that captured image.
- [ ] **Test:** share to a real target (e.g. Messages/WhatsApp) on-device and confirm the image looks correct.

**Step 11 — Haptics**
> UI haptics (selection ticks on the language/plant pickers, a light tap on primary buttons, a soft confirm when onboarding finishes or a plant is chosen) were pulled forward into Steps 2–3 and live in `src/lib/haptics.ts` — that file is the one place to tune intensity. This step is the remaining session-event half.
- [ ] Add `expo-haptics` at: droplet earned, session success, movement/failure warning, and (distinctly, more subtly) manual stop.
- [ ] **Test:** tune intensity/pattern by feel on-device until success feels rewarding and failure feels like a gentle "oops," not an alarm.

**✅ Phase 1 checkpoint** — before writing a single line of Phase 2 or 3 code, confirm on a real device: onboarding → pick a plant → start a session → phone face-down and still → plant grows → share works, and a manual Stop and an accidental-movement failure both behave correctly and distinctly. If any of that is shaky, fix it now — it only gets harder to debug once Firebase and group state are layered on top.

### Phase 2 — Group sessions (only start once the Phase 1 checkpoint is fully green)

**Step 12 — Firebase project + join codes**
- [ ] Create a Firebase project; enable Firestore (or Realtime Database).
- [ ] Add `lib/firebase.ts` with the init + config (git-ignored, see section 8).
- [ ] Build "host a session" (generates a short join code, creates the `sessions/{code}` document from section 6) and "join a session" (enters a code, subscribes to that document).
- [ ] **Test with two physical devices** (or one device + a teammate/friend) joining the same code.

**Step 13 — Synchronized countdown**
- [ ] On host "start," write one shared `startTimestamp` to the session document.
- [ ] Each joined client computes the offset between that timestamp and its own clock and starts its local countdown from it.
- [ ] **Test:** two devices starting within a second of the host pressing start, confirm their countdowns match.

**Step 14 — Shared plant + "killed the plant" callout**
- [ ] Extend the session document with `plantAlive` and `killedBy`.
- [ ] Any device detecting movement writes `plantAlive: false, killedBy: <name>` to the shared doc.
- [ ] All joined devices react to that change: show the wilted-plant state + the callout message.
- [ ] **Test:** confirm every joined device sees the callout, not just the device that moved.

**Step 15 — Connectivity fallback**
- [ ] Use `@react-native-community/netinfo` to check connectivity before offering "host"/"join."
- [ ] If offline, hide/disable the group option and let the user continue in solo mode without errors.
- [ ] **Test:** toggle airplane mode and confirm the app degrades gracefully instead of hanging or crashing.

### Phase 3 — Visual polish, optional (build this LAST, only if time remains)

**Step 16 — Skia/Reanimated growth animation**
- [ ] Install `expo-dev-client`, build a development client (`eas build --profile development`) — required, Skia does not run in plain Expo Go.
- [ ] Replace the Phase 1 `Animated`-API fill animation with a Skia-based liquid/glow effect, driven by `react-native-reanimated` shared values.
- [ ] **Test:** confirm the app still works identically if you temporarily revert to the Phase 1 animation — this layer must stay optional, never load-bearing.

**Step 17 — Remaining nice-to-haves**
- [ ] Extra growth stages / plant variety.
- [ ] Reminder notifications (e.g. a daily nudge to start a session).
- [ ] Any other polish time allows.

If the project period runs out before Phase 3 (or even Phase 2), that's fine — the Phase 1 checkpoint alone is a complete, working, demoable app.

---

## 8. Environment & secrets

- Firebase web config (`apiKey`, `projectId`, etc.) goes in a local file that is **git-ignored** (e.g. `lib/firebaseConfig.ts` or a `.env` read via `expo-constants` / `app.config.js`). Never commit it.
- No other API keys or secrets are required — everything else in this project runs on-device or through Expo's own managed services.

---

## 9. Explicitly out of scope

To keep this buildable solo within a limited project period, the following were deliberately rejected during concept development — don't reintroduce them without discussing first:

- System-level Do Not Disturb / Focus mode toggling (not possible on iOS, requires custom native code on Android).
- Bluetooth (BLE) peer-to-peer sync for group sessions (needs a library outside the assignment's list, painful pairing/permission UX, cannot be tested in a simulator).
- Real payment/treat processing (Stripe or otherwise) for the "killed the plant" group penalty — it's a social/in-app callout only, never a real transaction.

---

## 10. Estimated difficulty

- Solo core (sensor, timer, growth, storage, sharing): **3–4/10**.
- With the group feature added (join codes, shared plant state, Firebase sync): **5–6/10** for that part specifically; the solo core stays 3–4/10.
- Most of the time budget goes to tuning the movement threshold/debounce and to illustrating the growth-stage art — not to anything architecturally hard.
