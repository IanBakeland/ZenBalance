# ZenBalance — Style Guide

This guide translates the concept (a calm, nurturing pomodoro app built around a growing plant) into concrete visual and motion decisions. It exists so an implementing agent (or you) can make consistent styling choices without re-deriving the mood from scratch on every screen.

## 1. Design principles

Three words should be true of every screen: **calm, organic, unhurried.** Concretely, that means:

1. **Nothing fights for attention.** No aggressive reds, no urgent badges, no shrinking countdown numbers that create anxiety. The app's whole premise is the opposite of notification-driven urgency — the UI must not undercut that.
2. **Everything feels grown, not built.** Rounded shapes over sharp ones, organic curves over straight grids, soft transitions over hard cuts. The plant is alive; the interface around it should feel like it belongs in the same world.
3. **Restraint reads as care.** A student project can easily over-decorate to prove effort. Resist that. One well-executed plant illustration beats five distracting UI flourishes — this mirrors the product's own core instruction to go deep on one interaction rather than wide on many.

## 2. Color palette

A muted, natural palette — think "soft morning light on a windowsill," not a saturated cartoon garden.

### Light mode (default)

| Token | Hex | Use |
|---|---|---|
| `background` | `#F7F4EC` | Main app background — warm paper/cream, not stark white |
| `surface` | `#FFFFFF` | Cards, sheets, the onboarding modal |
| `surface-muted` | `#EFEADE` | Secondary panels, disabled states |
| `text-primary` | `#2B2A25` | Body copy — warm near-black, not pure `#000` |
| `text-secondary` | `#6B6558` | Captions, helper text |
| `plant-primary` | `#4C7A5E` | Sage/moss green — the plant, primary buttons, active states |
| `plant-primary-dark` | `#365943` | Pressed states, headings that need more weight |
| `plant-accent` | `#8FB08A` | Lighter leaf green — progress fills, secondary highlights |
| `droplet` | `#6FA8C9` | Water droplet, progress ring, the "still and focused" state color |
| `warmth-accent` | `#D98E5B` | Warm terracotta — used sparingly, for the bloom stage and celebratory moments only |
| `warning-soft` | `#C97B5A` | Movement-detected warning — warm, not alarming red |
| `danger-muted` | `#B5533F` | Reserved for the group "plant died" moment only — the one place a stronger color is earned |

### Dark mode

Keep the same organic feel — a dim greenhouse at night, not a generic black app shell.

| Token | Hex | Use |
|---|---|---|
| `background` | `#171A16` | Deep, slightly warm charcoal-green, not pure black |
| `surface` | `#20241E` | Cards, sheets |
| `text-primary` | `#EDEAE0` | Body copy |
| `text-secondary` | `#A8A296` | Captions |
| `plant-primary` | `#7CAE8A` | Brighter, since it needs to read against dark backgrounds |
| `droplet` | `#8FC3E0` | Slightly brighter than light mode's droplet blue |
| `warmth-accent` | `#E3A470` | |

**Rule of thumb:** greens and the droplet blue carry almost the entire interface. `warmth-accent` and `danger-muted` are deliberately rare — they mark the two moments that deserve emotional weight (a full bloom, a group plant dying) and lose that power if used anywhere else.

### Session mode — true black (AMOLED/OLED), separate from light/dark mode

The active-session screen is a special case and does **not** simply follow the light/dark mode toggle above. During a session, `expo-keep-awake` forces the screen to stay on continuously for the full duration (potentially 25–45+ minutes) so the accelerometer keeps sampling. On an OLED/AMOLED panel (every iPhone since the X, and the large majority of modern Android phones), a truly black pixel is a pixel that is physically switched off — it draws effectively no power, unlike an LCD backlight or even a dark-grey OLED pixel. Given the screen is now guaranteed to be on and drawing power for the entire session regardless of user interaction, this is a real, native-specific opportunity to reduce battery drain — and it doubles as good design, since a glowing plant against true black reads as calm and focused rather than as a generic "dark mode."

| Token | Hex | Use |
|---|---|---|
| `session-background` | `#000000` | The entire session screen background — pure black, not `background`/`surface` from the palette above, and not the `#171A16` dark-mode background either |
| `session-plant-glow` | `#7CD9A0` | The plant illustration during a session — bright enough to read as luminous against pure black |
| `session-droplet-glow` | `#7EC8E3` | Droplet/progress indicator during a session |
| `session-text` | `#D8D8D2` | Countdown and any session copy — soft off-white, not pure `#FFFFFF` (keeps the lit area smaller/dimmer, which is both calmer and marginally more power-efficient) |
| `session-warning` | `#E3A17A` | Movement-detected pulse during a session |

Practical rules for the session screen specifically, on top of everything in section 5 (Motion):

- Keep the total lit (non-black) screen area small. The plant/droplet visual and a modest countdown number are enough — no large bright panels, no full-width bright progress bars. Favor a slim ring or a small glow rather than a filled bright rectangle.
- No pure white (`#FFFFFF`) anywhere on this screen; use `session-text` instead.
- This true-black treatment applies **only** to the active-session screen. The rest of the app (home, onboarding, settings, group join/create) uses the regular light/dark palette from section 2 — don't force the whole app into AMOLED-black, since outside a session there is no keep-awake/battery justification for it and the warmer cream/charcoal palette better fits the "browsing your plant" mood.

## 3. Typography

- **Headings / plant name / stage labels:** a soft, rounded, slightly friendly sans-serif — **Quicksand** or **Nunito** (both free on Google Fonts, easy to load via `expo-font` or `@expo-google-fonts/*`). This is where the app's personality lives.
- **Body copy, buttons, settings:** a clean, highly legible sans-serif — **Inter** or **Work Sans**. Don't use the rounded display font for body text; it hurts readability at small sizes.
- **Numbers (timer countdown, droplet count):** use tabular figures if the chosen font supports them, so digits don't jitter horizontally as they change.

Scale (suggested, 4px/8px rhythm):

| Role | Size | Weight |
|---|---|---|
| Screen title | 28 | 600 (Quicksand/Nunito) |
| Section heading | 20 | 600 |
| Body | 16 | 400 (Inter/Work Sans) |
| Caption / helper | 13 | 400, `text-secondary` |
| Timer countdown | 48–64 | 500, tabular numerals |

## 4. Shape, spacing & elevation

- **Corner radius:** 16–24px on cards and buttons, 999px (full pill) on primary action buttons and the join-code input. Nothing in this app should have a hard 0–4px corner — that reads as technical/urgent, the opposite of the intended mood.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48. Favor generous whitespace around the plant illustration specifically — it's the emotional centerpiece and should never feel crowded by UI chrome.
- **Elevation:** soft, diffuse shadows only (large blur radius, low opacity, e.g. `shadow-opacity: 0.08`, `shadow-radius: 16`). No hard drop shadows.
- **Dividers:** avoid hard 1px lines where possible; prefer spacing or a very low-contrast `surface-muted` background shift to separate sections.

## 5. Motion & animation

This is where "calm" either holds up or falls apart — motion is felt even when nobody consciously notices it.

- **Easing:** use gentle ease-in-out curves (e.g. `Easing.inOut(Easing.cubic)` in Reanimated/Animated). Avoid snappy, overshooting spring animations anywhere related to the plant or timer — those read as playful-urgent, which contradicts the concept. Spring easing is fine only for small, secondary UI feedback (e.g. a button press), never for the plant itself.
- **Durations:** slower than typical app defaults. Growth-stage transitions: 600–900ms. Droplet fall: 400–600ms. Screen transitions: 250–350ms. Avoid anything under ~200ms for anything the user is meant to *feel* rather than just register.
- **The droplet fall + plant growth moment is the single most important animation in the app.** It is the one place worth spending extra polish time (this is also where the optional Skia/Reanimated liquid-fill upgrade belongs, per the README's polish phase) — but even the MVP `Animated`-API version should feel unhurried: ease in, a small pause, ease out, rather than a linear tween.
- **Movement-detected feedback:** a quick, soft haptic + a gentle color pulse (not a shake, not a hard flash) on the droplet/progress indicator. It should register as "oops" — not as an error state.
- **Avoid:** bouncing icons, spinning loaders where a simple soft pulse would do, confetti/particle bursts (too high-energy for this concept — the "bloom" moment should feel like a quiet exhale, not a celebration explosion).

## 6. Iconography & illustration

- **Plant illustrations** are the app's signature asset — commission or draw these with a consistent, slightly hand-drawn organic line style (not sharp vector-perfect geometric icons). Consistent stroke weight across all growth stages and all plant size options.
- **System icons** (settings, share, back): use a rounded icon set (e.g. Phosphor Icons "regular" or "duotone" weight, or Feather-style rounded icons) — never a sharp/technical icon set like Material sharp-edge icons.
- **The droplet** deserves its own small icon/illustration family (falling, landing, "lost" states) since it's the moment-to-moment feedback unit the user watches most often.
- **Group-session avatars:** simple, warm, abstract shapes or initials — avoid photorealistic avatars, which clash with the illustrated plant world.

## 7. Screen-specific notes

- **Home (plant view):** the plant illustration should occupy the visual majority of the screen. Droplet/streak counters are secondary — small, quiet, positioned at the edges, never competing with the plant for attention.
- **Session screen:** uses the true-black AMOLED palette from section 2 ("Session mode"), not the regular light/dark theme — the screen stays on via `expo-keep-awake` for the whole session, so true black meaningfully saves battery on OLED devices as well as looking calmer. Minimal chrome: once a session starts, consider fading out all non-essential UI (nav bar, status text) after a few seconds, leaving just the glowing plant/progress visual and a subtle way to see remaining time — reinforcing "put the phone down, there's nothing else to look at."
- **Onboarding:** warm and unhurried pacing — this is the user's first impression of the calm tone, don't rush it with a typical fast-swipe carousel. Give each of the 3 onboarding steps (mechanic, plant choice, language) room to breathe.
- **Group "plant died" moment:** this is the one screen allowed to use `danger-muted` and slightly punchier motion (still no bouncing/confetti — think a quick wilt animation) — it's meant to sting just a little, in a fun way, since that's the entire point of the social mechanic.
- **Share card:** should look good as a standalone image out of context (posted to a group chat) — plant illustration front and center, minimal ZenBalance branding in a corner, no cropped-off UI chrome.

## 8. Accessibility

- Maintain at least 4.5:1 contrast for body text against its background in both light and dark mode (`text-primary`/`background` pairs above meet this; verify any new combination before shipping).
- Don't rely on color alone for the movement-warning state — pair `warning-soft` with the haptic pulse and a brief icon/motion change, since color-blind users need a non-color signal too.
- Respect the OS "reduce motion" accessibility setting: fall back to a simple fade/opacity change instead of the full growth animation when it's enabled.
- Minimum tappable target size: 44×44pt, even for small secondary controls.

## 9. Quick reference for an implementing agent

If you only take one thing from this document into a theme/constants file: rounded shapes, muted sage-green-and-cream palette with `droplet` blue as the secondary anchor color, slow/organic easing everywhere except tiny secondary UI feedback, reserve `warmth-accent`/`danger-muted` exclusively for the bloom moment and the group "plant died" moment respectively — **and the active-session screen always uses the separate true-black `session-*` palette, never the regular light/dark theme, since the screen is kept awake continuously for sensor sampling during that screen only.**
