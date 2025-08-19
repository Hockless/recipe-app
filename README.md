# recipe-app

my recipe app

Display name in app: "Oswald Dining" (see `app.json`).

---

## Quick start

Prereqs
- Node 18+ and npm 9+
- Android Studio (emulator) and/or Xcode (simulator) optional
- A device with Expo Go or a development client

Install and run

```bash
npm install
npm run start
```

When the dev server opens, choose:
- a for Android emulator
- i for iOS simulator (macOS)
- w to open web
- Or scan the QR with a device

You can start developing by editing files in the `app/` directory. This project uses [Expo Router](https://docs.expo.dev/router/introduction) with typed routes.

## Scripts

From `package.json`:

```bash
# Start Metro bundler (Expo)
npm run start

# Run on Android (prebuilds if needed)
npm run android

# Run on iOS (macOS only)
npm run ios

# Web (React DOM via Expo)
npm run web

# Lint
npm run lint

# Reset template starter code
npm run reset-project
```

Tips
- Clear caches: `npx expo start -c`
- Fix dependency versions to match SDK: `npx expo install --fix`

## EAS Build (CI-ready builds)

Profiles are defined in `eas.json`:
- `development`: internal dev build with a development client
- `preview`: internal distribution
- `production`: store-ready build (auto-increments version)

Commands (no global install required):

```bash
# Create dev client build
npx eas build -p android --profile development
npx eas build -p ios --profile development

# Start against the dev client once installed on device/emulator
npx expo start --dev-client

# Preview builds (internal)
npx eas build -p android --profile preview
npx eas build -p ios --profile preview

# Production builds
npx eas build -p android --profile production
npx eas build -p ios --profile production

# Submit to stores (after a production build)
npx eas submit -p android --profile production
npx eas submit -p ios --profile production
```

First-time EAS setup will prompt you to sign in and configure credentials.

## App configuration

From `app.json`:
- Name: `Oswald Dining`
- Slug: `oswald-dining`
- Scheme (deep links): `oswalddining`
- iOS bundle identifier: `com.oswald.dining`
- Android package: `com.oswald.dining`
- Android permissions: `CAMERA`, `POST_NOTIFICATIONS`
- Web: bundler `metro`, output `static`
- Plugins: `expo-router`, `expo-splash-screen`
- New Architecture: enabled

Notable dependencies
- `expo-camera`, `expo-image-picker`, `expo-notifications`, `expo-mlkit-ocr`
- `@react-navigation/*` for navigation, `expo-router` for file-based routes

## Project structure

- `app/` – routes/pages (Expo Router)
- `components/` – shared UI components
- `assets/` – images and fonts
- `utils/` – helpers (e.g., units)

Environment
- `.env*.local` is git-ignored; place local secrets there

## Troubleshooting

- Port in use: stop other Expo instances or set `EXPO_DEV_SERVER_PORT`.
- Android emulator not found: open Android Studio > Device Manager, start a device, then press `a`.
- iOS permissions: Camera and notifications are declared; allow when prompted.
- Windows line endings: if you see CRLF warnings, it’s safe; Git will normalize line endings.

## Learn more

- Expo docs: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- Expo Router: https://docs.expo.dev/router/introduction/
