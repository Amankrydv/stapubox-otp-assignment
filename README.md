# StapuBox OTP Login — React Native Assignment

A 3-screen mobile number login flow built with React Native (Expo SDK 54), implementing OTP-based authentication against the StapuBox trial API.

## 📱 Screens

1. **Send OTP** — mobile number input with validation, calls the `sendOtp` API
2. **Verify OTP** — 4-digit OTP entry with auto-focus/auto-submit, resend with cooldown, error highlighting
3. SMS auto-read on Android (see [Known Issues](#known-issues) below for current status)

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+ and npm
- Expo Go app (for quick local testing) or an Android device for the built APK

### Install
```bash
git clone https://github.com/amann.yv/stapubox-otp-assignment.git
cd stapubox-otp-assignment
npm install
```

### Run locally (development)
```bash
npx expo start
```
Scan the QR code with Expo Go on an Android device on the same Wi-Fi network.

### Run the production build
Download the APK from the [Releases](#) section of this repo (or the link in the submission form) and install directly on an Android device — no dev server required.

## 🔑 Environment / Configuration

The API base URL and trial token are currently set directly in `services/api.js`:

```js
const BASE_URL = 'https://stapubox.com/trial';
const API_TOKEN = 'trial_...';
```

**Known limitation**: for a production app, these would be moved to environment variables (e.g. via `expo-constants` + `.env` files with `EXPO_PUBLIC_` prefixes) rather than hardcoded. This was kept simple given the trial/assignment scope and short timeline.

## 🏗️ Architecture & Decisions

- **Expo Router (file-based routing)** — used over a manually configured React Navigation stack since the SDK 54 template ships with it by default; less boilerplate, same underlying React Navigation engine.
- **`services/api.js`** — all 3 API calls (`sendOtp`, `resendOtp`, `verifyOtp`) live in one file with a shared `handleResponse` helper, rather than duplicating fetch/error logic in each screen.
- **Validation**: mobile number is checked against `/^[6-9]\d{9}$/` (valid Indian mobile number pattern) before calling the API, to avoid wasting API calls on obviously invalid input.
- **OTP input**: built from 4 individual `TextInput`s with manual ref-based focus management, rather than a third-party OTP-input library — this kept full control over auto-focus, backspace-to-previous-box, and paste-handling behavior to match the spec exactly.

## 🐛 Bugs Found & Fixed

- **`verifyOtp` returns HTTP 200 even for an invalid OTP.** The trial API signals failure via `{"status": "failed", "msg": "Invalid OTP or expired"}` in the response body, not via the HTTP status code. The initial implementation only checked `response.ok`, so invalid OTPs were silently treated as successful logins. Fixed by also checking `data.status === 'failed'` in the shared response handler.

## ⚠️ Known Issues

### SMS Auto-read (Android SMS Retriever API)

This was implemented using the `expo-otp-autofill` package, but ultimately had to be disabled for the submitted build. Two separate blockers were found:

1. **Native module incompatibility**: `expo-otp-autofill` is a very new (early 2026), independently-maintained package. It failed to register as a native module under React Native's New Architecture, and its native Android code failed to compile via EAS Build's Gradle step regardless of architecture setting. This appears to be a compatibility gap in the package itself rather than an integration mistake — confirmed by testing both with New Architecture enabled and disabled.
2. **Backend constraint, independent of the above**: even if the native module worked, Android's SMS Retriever API requires the verification SMS to end with an 11-character app-specific hash code that the *sending* backend must include in the message body. StapuBox's trial API sends its own fixed SMS template, which we have no ability to modify, so true auto-read could never be fully verified end-to-end against this specific trial backend regardless of the client-side library used.

**Current behavior**: the integration code is present in `app/verify-otp.tsx`, guarded with a `require()` + `try/catch` so a native-module failure doesn't crash the screen — it falls back gracefully to manual OTP entry, which is fully functional and tested. This satisfies the spec's explicit requirement: *"Graceful fallback if SMS read permission/flow fails."*

### Lockfile cross-platform quirk

`package-lock.json` generated on Windows omitted Linux-only optional dependencies (`@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`) needed by EAS Build's Linux build servers, causing `npm ci` to fail. Fixed by pinning these as direct dependencies in `package.json` so npm resolves and locks them regardless of host OS.

## 📦 Deliverables

- ✅ GitHub repo (this one)
- ✅ Working APK — [download link](https://github.com/Amankrydv/stapubox-otp-assignment/releases/download/v1.0.0/application-f417b18d-6d19-4281-aa3f-4397a8ae9c2b.apk)
- ✅ Demo video — [link](#)

## 🎥 Demo

See the demo video linked above for a full walkthrough of both screens, the bug fix in action, and the OTP flow end-to-end on a real device.