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

## Cloud save (Supabase)

Progress stays on the device by default. Sign in from **LOG IN** on the menu to save coins, story unlocks, shop items, high scores, and custom levels to your account.

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the project URL and publishable (or anon) key from **Project Settings > API**.
4. Create `.env.local` from [`.env.example`](.env.example) and paste those values.
5. Restart `npm run dev`.

Email/password is on by default. For local testing you can turn off **Confirm email** under Authentication > Providers > Email.

**Unlock All** appears on the account screen only for developer accounts (`app_metadata.developer: true`). It unlocks every story level, secret, skin, and shape, and maxes shop power-ups. Sign out and back in after changing that flag so the session picks it up.

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
- [Supabase](https://supabase.com/) — email/password auth and cloud save
- [Capacitor 7](https://capacitorjs.com/) — iOS & Android shells
- [Tauri 2](https://tauri.app/) — desktop shell
