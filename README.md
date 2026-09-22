<div align="center">

# 🌱 ZenBalance

**A pomodoro focus app where staying still grows a plant.**

Put your phone down. Watch it grow. Pick it back up, and it doesn't.

[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)](#)
[![Status](https://img.shields.io/badge/status-in%20development-yellow)](#roadmap)

</div>

---

## What is this?

ZenBalance flips the usual pomodoro logic on its head: instead of an app that demands your attention, **success means not touching your phone at all.**

Start a focus session, place your phone face-up and still on the table, and a small plant on screen starts to grow — one drop of water at a time, for every moment you leave it alone. Pick the phone up, and the plant stops growing. Finish the full session without moving it, and your plant blooms a little further, from a tiny seedling to a full, flowering plant.

It's a small, honest trick: the only way to "win" is to genuinely put your phone down and focus on something else for a while.

<div align="center">
<!-- 📸 Replace with real screenshots/GIFs once available: home screen, an active session, and the plant mid-growth -->
<i>Screenshots coming soon</i>
</div>

## Why native, and why a phone

This only works because it's a real, native mobile app. Detecting that a phone is genuinely lying still — continuously, reliably, in the background of a running app — needs direct access to the device's motion sensors, something a website simply cannot do. The whole concept only exists *because* it's running on hardware in your hand, not in a browser tab.

## ✨ Features

- **🌿 Grow a plant by doing nothing** — the core loop: place your phone down, stay still, and watch it grow.
- **💧 Choose your plant** — pick a small plant for a quick win, or a bigger one that takes several longer sessions to fully bloom.
- **🌍 Onboarding in your language** — a short first-launch tutorial, available in Dutch and English, with your device's language pre-selected.
- **🌑 A screen designed to stay on** — the session screen uses a true-black, AMOLED-friendly design, since the display has to stay awake for the sensors to keep working throughout the session.
- **🤝 Focus together** — start a session with friends around the same table: everyone shares one plant, and moving your phone gives the whole group away.
- **📤 Share your plant** — capture and share how far your plant has grown.
- **🔕 A quiet screen** — the app suppresses its own notifications for the duration of a session, so nothing interrupts you while you're trying not to be interrupted.

## 🧠 How it works

1. **Place your phone down.** During a session, ZenBalance reads the device's accelerometer at a steady interval and checks whether the phone is lying still.
2. **Stay still, earn droplets.** As long as the phone doesn't move, droplets accumulate over the course of the session — longer sessions earn more.
3. **The plant grows.** Enough droplets push the plant into its next growth stage, from seedling to full bloom.
4. **Pick it up, and it stops.** Movement is detected almost immediately and ends the session's progress — no droplet, no growth, that time around.
5. **Do it together.** In a group session, one shared plant depends on *everyone* staying still — if anyone moves, the whole group finds out.

## 🛠️ Tech stack

| | |
|---|---|
| **Framework** | [Expo](https://expo.dev) (React Native), [Expo Router](https://docs.expo.dev/router/introduction/) |
| **Language** | TypeScript |
| **State** | [Zustand](https://github.com/pmndrs/zustand), persisted with `AsyncStorage` |
| **Sensors & device** | `expo-sensors` (Accelerometer), `expo-haptics`, `expo-keep-awake`, `expo-localization` |
| **Sharing & notifications** | `expo-sharing`, `expo-notifications`, `react-native-view-shot` |
| **Lists & UI** | `@shopify/flash-list`, `expo-image`, `expo-symbols` |
| **Group sessions** | Firebase (Firestore), `@react-native-community/netinfo` |
| **Visual polish** *(optional)* | `@shopify/react-native-skia`, `react-native-reanimated` |

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- The [Expo Go](https://expo.dev/go) app on a physical iOS or Android device — **a real device is required**, the accelerometer doesn't work in a simulator
- Xcode (for iOS builds) and/or Android Studio, if you want to build natively rather than run through Expo Go

### Installation

```bash
git clone https://github.com/<your-username>/zenbalance.git
cd zenbalance
npm install
```

### Running the app

```bash
npm start
```

Scan the QR code with Expo Go on your phone, or press `i` / `a` in the terminal to open an iOS/Android simulator (note: sensor-dependent features won't work in a simulator — use a real device to test the full experience).

## 📁 Project structure

```
zenbalance/
  src/
    app/          # screens — Expo Router file-based routing
    components/    # ThemedText, ThemedView, PlantView, tab bar, ...
    constants/      # theme tokens, layout constants
    hooks/          # sensor hook, timer hook, the Zustand store, ...
    data/            # static data, if any
  assets/            # plant illustrations, icons
```

For the full technical build plan and architectural conventions this project follows, see [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) and [`docs/STYLE_GUIDE.md`](./docs/STYLE_GUIDE.md) in this repo.

## 🗺️ Roadmap

- [x] Concept & design
- [ ] **Phase 1 — Solo experience:** onboarding, plant picker, the core stillness/timer/growth loop, sharing
- [ ] **Phase 2 — Focus together:** group sessions with friends, shared plant, synchronized timers
- [ ] **Phase 3 — Polish:** richer growth animations, additional plants, reminders

## 🎓 About

ZenBalance is a solo student project built for a React Native / Expo course, exploring what a focus app can look like when it's designed *around* native mobile capabilities (motion sensors, haptics, always-on displays) instead of just being a to-do list with a timer bolted on.

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [`LICENSE`](file:///Users/ian/Local%20docs/ExpertCode/ZenBalance/LICENSE) file for details.

