# Agent Instructions — read this file first

You are implementing **ZenBalance**, a React Native / Expo app, for a solo student project. This file tells you *how* to structure and write the code. Two other files in the `docs/` folder tell you the rest:

- **`docs/PROJECT_PLAN.md`** — *what* to build: the concept, every mechanic, the full phased step-by-step plan (Phase 1 solo UI → sensors → Phase 2 group → Phase 3 optional polish). Follow its phase order exactly; do not build Phase 2 or 3 work before the Phase 1 checkpoint passes.
- **`docs/STYLE_GUIDE.md`** — *how it should look*: colors, typography, spacing, motion, and the special true-black session-screen palette.

There's also a **`README.md`** in this repo — that one is the public GitHub homepage for human visitors (project pitch, screenshots, install instructions). It is not part of the build spec and can be ignored for implementation purposes; don't treat anything in it as an instruction.

This file exists because the student's course has already taught a specific React Native/Expo project structure and set of patterns, through an in-class tutorial exercise ("Plant Based Barista"). **Build ZenBalance using those exact same patterns and conventions**, so the codebase looks and feels consistent with what was taught in class — don't substitute a different navigation library, state management approach, or folder layout just because it's also valid React Native. Consistency with the taught approach matters more here than any other implementation choice.

---

## 1. Non-negotiable project conventions (from the course material)

### 1.1 Scaffold & folder layout

```bash
npx create-expo-app@latest --template default@sdk-57
# app name: zenbalance
cd zenbalance
npm start
```

**All application code lives inside a `src/` folder** — not at the project root. This matches the taught template exactly:

```
zenbalance/
  src/
    app/            # screens — Expo Router file-based routing
    components/      # ThemedText, ThemedView, app-tabs, app-tabs.web, PlantView, ...
    constants/        # theme.ts (colors/tokens from STYLE_GUIDE.md), BottomTabInset, ...
    hooks/            # use-theme, use-order-store-style Zustand stores, useStillnessDetector, ...
    data/             # any static data files (mirrors the course's coffees.ts pattern), if needed
  assets/
```

Do not invent a different top-level layout (e.g. don't put `app/` at the project root, don't skip the `src/` wrapper) — the grading/reference material assumes this structure.

### 1.2 Navigation: Expo Router + NativeTabs + nested Stacks

Use **Expo Router** (file-based routing under `src/app`) — never React Navigation set up manually, and never a third routing library. Specifically:

- The **root tab bar** uses `<NativeTabs>` (from `expo-router`, renders the platform's real native tab bar), defined in `src/components/app-tabs.tsx`, wrapped by `src/app/_layout.tsx`.
- Because `NativeTabs` doesn't exist on web, provide a **`src/components/app-tabs.web.tsx`** file with a hand-built JS tab bar (using `TabTrigger`/`TabButton` as in the course example) — Expo automatically picks the `.web.tsx` version when running on web.
- Any tab that needs to drill down into a detail/sub-screen gets its **own nested Stack**: a subfolder named `(groupname)` (parenthesized = doesn't add a URL segment) containing a `_layout.tsx` that just re-exports `Stack` from `expo-router`, plus an `index.tsx` and any child screens. This is exactly the `(index)` pattern from the course's coffee list → coffee detail flow.
- A screen that takes a parameter (e.g. a specific plant's detail, or a specific group session) is a file named `[param].tsx`, read via `useLocalSearchParams()`. Convert numeric/typed ids explicitly (TypeScript will flag the mismatch otherwise, exactly as in the course example).
- Set a screen's header title dynamically with `<Stack.Screen options={{ title: ... }} />` inside the screen component, not by hardcoding it in the layout.
- Handle content that sits near the floating native tab bar with `useSafeAreaInsets()` combined with a `BottomTabInset` constant (add this constant to `src/constants/theme.ts`, matching the course's pattern), applied as bottom padding.

**Suggested ZenBalance route map, using these exact patterns:**

```
src/app/
  _layout.tsx                 # decides: show onboarding stack, or the main tab navigator
  onboarding/
    _layout.tsx                # Stack (re-export), shown only when !hasCompletedOnboarding
    index.tsx                  # step 1: tutorial
    plant.tsx                  # step 2: plant picker
    language.tsx                # step 3: language picker
  (home)/
    _layout.tsx                 # Stack (re-export) — nested inside the Home tab
    index.tsx                   # plant view + "start session" button + duration picker
    session.tsx                  # active session screen (timer, stillness, AMOLED palette)
  together/
    _layout.tsx                  # Stack (re-export) — nested inside the Together tab
    index.tsx                    # host / join a group session
    [code].tsx                    # the joined session's lobby/live screen, code as the param
```

`src/components/app-tabs.tsx` defines two `NativeTabs.Trigger`s: `(home)` (label "Home", a leaf/plant `sf`/`md` icon) and `together` (label "Together", a people/group `sf`/`md` icon) — mirror the course's icon-picking approach (`SymbolView`/`NativeTabs.Trigger.Icon` with `sf`/`md` props, chosen from SF Symbols / Material Symbols). Mirror the trigger names in `app-tabs.web.tsx` using `href`, exactly like the course example.

The onboarding flow (`src/app/onboarding/`) is not a tab — it's a separate Stack shown conditionally. In `src/app/_layout.tsx`, read `hasCompletedOnboarding` from the Zustand store (section 1.3) and render either the onboarding Stack or the main `<NativeTabs>` layout — use `Redirect` from `expo-router` if you prefer a redirect-based approach over conditional rendering, whichever reads cleaner once you're implementing it.

### 1.3 State management: Zustand (+ AsyncStorage persistence)

Use **Zustand** for all shared/cross-screen app state — the same library and the same pattern taught in the course (a typed interface, a `create<...>()((set) => ({...}))` store, actions that call `set` and return a spread-updated object, never direct mutation).

ZenBalance needs its state to **persist** across app restarts (unlike the course's cart example, which resets on app close). Use Zustand's built-in `persist` middleware with an AsyncStorage adapter — this is the idiomatic way to combine what the course taught with what `PROJECT_PLAN.md` section 6 requires, and it removes the need for a separate hand-rolled `lib/storage.ts` read/write layer:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ZenBalanceState {
  hasCompletedOnboarding: boolean;
  languagePreference: 'nl' | 'en';
  chosenPlantId: string | null;
  totalDroplets: number;
  totalSessionsCompleted: number;
  currentStreak: number;
  completeOnboarding: (plantId: string, language: 'nl' | 'en') => void;
  addDroplets: (amount: number) => void;
  // ...etc, mirror the course's orderCoffee/resetOrders action style
}

export const useZenBalanceStore = create<ZenBalanceState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      languagePreference: 'nl',
      chosenPlantId: null,
      totalDroplets: 0,
      totalSessionsCompleted: 0,
      currentStreak: 0,
      completeOnboarding: (plantId, language) =>
        set(() => ({ hasCompletedOnboarding: true, chosenPlantId: plantId, languagePreference: language })),
      addDroplets: (amount) =>
        set((state) => ({ totalDroplets: state.totalDroplets + amount })),
    }),
    { name: 'zenbalance-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

Put this in `src/hooks/use-zenbalance-store.ts`, naming it after the course's `use-order-store.ts`. Group-session state (Phase 2, section 2.6/6 of `PROJECT_PLAN.md`) does **not** belong in this persisted store — it's live/ephemeral Firebase data, read directly from Firestore in the `together/` screens (a small separate non-persisted Zustand store, or plain `useState` + a Firestore listener, is fine there).

### 1.4 UI building blocks — reuse the course's, don't reinvent them

- **Theming:** extend the starter template's `ThemedText` / `ThemedView` components and `useTheme()` hook rather than building a separate theming system. Add every color token from `STYLE_GUIDE.md` (light palette, dark palette, and the separate `session-*` AMOLED palette) into `src/constants/theme.ts` alongside whatever the template already defines there. The session screen should switch to the `session-*` token set specifically, not the app's regular dark theme.
- **Images:** use `expo-image`'s `<Image>` everywhere (plant illustrations, share previews) instead of React Native's core `Image` — it's already part of the starter template.
- **Icons:** use `expo-symbols`' `<SymbolView>` (`sf` prop for iOS/SF Symbols, `md` prop for Android/Material Symbols) for system-style icons (settings, share, back, tab icons), exactly as shown in the course material.
- **Lists:** any list of more than a few items (e.g. a plant-size picker with several options, a group-session member list, a future session-history view) uses `@shopify/flash-list`'s `<FlashList>`, not a plain `ScrollView.map()` or core `FlatList` — this is already on the project's approved third-party library list and is the pattern taught in class.
- **Buttons with custom styling:** follow the course's `Pressable` + `style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}` pattern for tappable custom elements instead of introducing a separate button library.
- **TypeScript throughout.** Type every data shape (e.g. a `Plant` type mirroring the course's `Coffee` type) before writing the component that uses it.

### 1.5 What this file deliberately does *not* cover

Anything sensor-, timer-, haptics-, sharing-, notification-, or Firebase-related is **not** part of the course's tutorial and has no taught convention to follow — for all of that, implement exactly what `PROJECT_PLAN.md` specifies (it already names the exact Expo SDK modules and third-party libraries to use, and in what phase). This file only governs the *scaffolding, navigation, state management, and base UI component* conventions above.

---

## 2. How to use these three files together

1. Read this file (`AGENTS.md`) fully before writing any code — it sets the architecture everything else slots into.
2. Read `docs/PROJECT_PLAN.md` section 7 ("Full step-by-step plan") and follow it in order, phase by phase, step by step, checkbox by checkbox.
3. When a step involves building a screen or navigation, use the route map and patterns in section 1.2 above.
4. When a step involves shared/persisted state, use the Zustand store pattern in section 1.3.
5. When a step involves visual styling, pull the exact tokens from `docs/STYLE_GUIDE.md` into `src/constants/theme.ts` and use them through `ThemedText`/`ThemedView`/`useTheme()`.
6. If `docs/PROJECT_PLAN.md` or `docs/STYLE_GUIDE.md` ever seems to conflict with something in this file, this file's conventions win for *how* the code is structured; the other two files win for *what* the product does and *how it looks*.


# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

