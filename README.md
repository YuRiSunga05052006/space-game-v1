# Star Blaster

A mobile-first 2D space rocket game built with **Vite**, **TypeScript**, and **Phaser 3**.

Fly your rocket, dodge asteroids, and blast them to pieces!

## Controls

| Platform | Move | Shoot |
|----------|------|-------|
| **Desktop** | WASD or Arrow keys | Space (hold) |
| **Mobile** | Drag anywhere on screen | Auto-fire |

## Quick Start

```bash
npm install
npm run dev
```

Open the URL shown in your terminal. On your phone, connect to the same network and visit your machine's local IP (e.g. `http://192.168.x.x:5173`).

## Build

```bash
npm run build
npm run preview
```

The game runs **offline** after build (local fonts and bundled assets under `public/`).

## Native apps (offline iOS, Android, PC)

All platforms use the same web build in `dist/`.

### Mobile — Capacitor

1. Build and copy web assets into native projects:

   ```bash
   npm run cap:sync
   ```

2. Open the IDE and run on a device or emulator:

   ```bash
   npm run cap:android   # Android Studio
   npm run cap:ios       # Xcode (macOS only)
   ```

First-time setup (if `android/` or `ios/` is missing):

```bash
npx cap add android
npx cap add ios
```

Requires [Android Studio](https://developer.android.com/studio) and/or Xcode (macOS only for iOS builds).

### Desktop — Tauri

Requires [Rust](https://www.rust-lang.org/tools/install).

```bash
npm run tauri:dev     # dev window (Vite + Tauri)
npm run tauri:build   # installer / .exe in src-tauri/target/release/bundle/
```

## Stack

- [Vite 6](https://vitejs.dev/) — fast dev server & bundler
- [TypeScript 5](https://www.typescriptlang.org/) — type safety
- [Phaser 3](https://phaser.io/) — 2D game engine with arcade physics, touch & keyboard input
- [Capacitor 7](https://capacitorjs.com/) — iOS & Android shells
- [Tauri 2](https://tauri.app/) — desktop shell
