<div align="center">
	<h1>ProvidaPro (Brico App)</h1>
	<p>A cross‑platform (iOS / Android / Web) on‑demand home & professional services marketplace built with Expo (React Native 0.79 / React 19) + Supabase + Stripe + Coinbase Commerce.</p>
</div>

---

## 📌 Table of Contents
- Overview
- Core Features
- Architecture
- Data & Backend (Supabase)
- Authentication Flow
- Navigation Structure
- State & Context Layer
- Services / Data Fetching Pattern
- Payments (Stripe & Crypto)
- Push Notifications
- Theming & UI System
- Project Structure
- Environment Configuration
- Running the Project
- Quality / Lint / Formatting
- Extending the App (How-To Guides)
- Security Considerations
- Troubleshooting
- Roadmap / Suggested Improvements

---
## 🔍 Overview
ProvidaPro is a service marketplace application where users can discover categories, view services, pick workers, chat, book appointments, and pay using traditional cards (Stripe) or cryptocurrency (Coinbase Commerce). It leverages Supabase for authentication, real-time data access, and custom RPC functions (e.g. `get_service_workers`). The UX uses modular reusable components and animated, categorized flows with tailored navigation transitions.

---
## ✨ Core Features
- Onboarding (4-step flow + profile creation + biometric PIN/Fingerprint)
- Email / (future: phone) based auth with Supabase sessions & persisted storage
- Category discovery & dynamic service listing with worker expansion
- Worker details, reviews (structure prepared), booking steps, cancellations
- Search with server filtering (`ilike`) + debuggable service transformations
- Multi-payment options:
	- Stripe (card entry, saved methods, success/decline flows)
	- Crypto (Coinbase Commerce charges / checkouts)
- Notifications center (unread badge + stats) & push token registration
- Chat / Call placeholders for real-time comms integration
- Settings: Notifications, Payment, Security, Language, Privacy Policy
- Invite friends / Help Center / Customer Service
- E-Receipt, bookings history & cancellation flows
- Theming / Dark mode readiness via custom ThemeProvider

---
## 🏗 Architecture
Layered, modular architecture:

UI Layer:
- `components/` – Reusable atomic + composite UI (inputs, cards, badges, etc.)
- `screens/` – Feature-level screens exported through `screens/index.js` and used in navigators

Navigation:
- Stack: `navigations/AppNavigation.js` (entry + conditional first-launch logic)
- Bottom tabs: `BottomTabNavigation.js` (not shown here, assumed Home / Inbox / Favourites / Profile, etc.)
- Custom transition orchestration: `utils/navigationTransitions.js` with semantic groups (auth, service, payment, modal, onboarding)

State / Context:
- `context/AuthContext.js` – Auth + user profile + session + push token registration
- `context/NotificationContext.js` – (Manages notification arrays, counts, stats) – referenced in Home

Data / Service Layer:
- `lib/supabase.js` – Configured Supabase client (storage with AsyncStorage, auto refresh on foreground)
- `lib/services/*` – Each domain (e.g., `home.js`) exposes fetch + transform utilities
- RPC usage: `supabase.rpc('get_service_workers', { service_id_param })`

Utilities:
- `utils/registerPushToken.js` – Dynamic import for notifications + token persistence
- `utils/navigationTransitions.js` – Centralized animation logic

Configuration:
- `config/stripe.config.js` (publishable key – secret must NOT stay client-side)
- `config/coinbase.config.js` (Currently commits LIVE/TEST keys – SHOULD be secured)

Assets & Constants:
- `constants/` – `icons`, `images`, `illustrations`, `theme` (COLORS, SIZES, FONTS), `socials`

---
## 🗄 Data & Backend (Supabase)
Tables implied from code:
- `service_categories` – id, name, description, created_at
- `services` – id, name, description, base_price, is_active, category_id, icon, created_at
- `worker_services` (in debug logs) – mapping workers to services with perhaps custom price
- `notifications` (inferred from notification context usage – id, type, title, message, is_read, related_id, related_type, channel, created_at)
- `profiles` (inferred for user profile fetch)

RPC / SQL Functions:
- `get_service_workers(service_id_param uuid)` – returns workers with fields: `worker_id`, `worker_service_id`, `first_name`, `last_name`, `custom_price`, `average_rating`, `total_jobs`, plus derived `worker_full_name`.

Transform Patterns:
- Raw Supabase results → UI-ready objects (adds image mapping, worker expansion, fallback values).

Performance Notes:
- Parallel worker fetch loops; consider batching or a single SQL join in future.
- Client-side filtering of services by category; scalable if service count moderate (< few hundred). For larger sets, move filtering to server queries.

---
## 🔐 Authentication Flow
1. `supabase.auth.getSession()` with an 8s timeout failsafe in `AuthContext`.
2. Session + user set; profile fetched via `getUserProfile(userId)` (service not shown; presumably selects from `profiles`).
3. Push token registered post-auth (silent failure safe).
4. Listener `onAuthStateChange` keeps session synchronized; auto refresh toggled with AppState.

Edge Handling:
- Timeout fallback ensures `loading` isn't stuck.
- Defensive null checks for user/profile.

---
## 🧭 Navigation Structure (Stack Extract)
Auth / Onboarding: Onboarding1–4, Welcome, Login, Signup, ForgotPassword*, OTP, CreateNewPassword, FillYourProfile, CreateNewPIN, Fingerprint.
Main: `Main` (bottom tabs). Core flows: Home, Search, PopularServices, ServiceDetails(+Reviews), BookingStep1, BookingDetails, MyBookings, Cancel flows.
Payments: PaymentMethods, AddNewPaymentMethod*, AddNewCard, PaymentMethod, CreditCardPayment, CryptoPayment.
Settings & Profile: EditProfile, Settings* screens, ChangePIN/Password/Email.
Support / Misc: HelpCenter, InviteFriends, CustomerService, Chat, Call, EReceipt, Notifications.

Transitions: Determined by `getTransitionConfig(screenName)` mapping groups to animation presets (slide, fade, modal slideUp, etc.).

---
## 🧠 State & Context Layer
- AuthContext: user, session, profile, `signOut()`, `refreshUserProfile()`.
- NotificationContext (referenced but not included in snippet): expected to provide `notifications`, `unreadCount`, `userNotificationStats`, `isUserAuthenticated`.

Potential Addition: Global query caching (React Query / TanStack Query) for consistent data invalidation.

---
## 🔄 Data Fetching Pattern (`home.js` example)
Contract:
- fetchServiceCategories(limit)
- fetchAllCategories()
- fetchActiveServices(limit) → includes worker expansion via RPC
- searchServices(query)
- transformCategories(raw)
- transformServices(rawWithWorkers)
- getWorkersForService(serviceId)

Key Transform Behavior:
- Adds synthetic "All" category (ensures uniqueness if one already present).
- Expands one service into multiple cards (one per worker) when workers exist.
- Maps service name keywords → themed image assets.

Edge Cases Covered:
- Empty lists return `[]` not null.
- Errors return `{ data: [], error }` patterns.
- Query guard for empty search strings.

---
## 💳 Payments
Stripe:
- Configured publishable key in `stripe.config.js`.
- Secret key MUST live on backend only (remove from repo / env!).
- Screens: AddNewCard, PaymentMethod, CreditCardPayment, success/decline variants.

Crypto (Coinbase Commerce):
- `coinbase.config.js` holds API key + webhook secret (currently exposed – MUST be moved to secure backend proxy).
- Supported currencies list + environment flag (sandbox vs prod).

Security Actions Needed Immediately:
1. Remove real keys from client bundle.
2. Use backend proxy to create charges / verify webhooks.
3. Provide `.env` template.

---
## 🔔 Push Notifications
Dynamic, safe registration (`registerPushTokenForUser`):
- Lazy loads `expo-notifications`, `expo-device`, `expo-constants`.
- Requests permissions; sets Android channel.
- Extracts projectId from `app.json` / EAS metadata if present.
- Upserts token via `upsertUserPushToken(userId, token, deviceInfo)` service (not shown; expected to write to Supabase table `user_push_tokens`).
- Silent failures logged; won't crash UI.

---
## 🎨 Theming & UI
- Color, spacing, typography via `constants/theme.js` (COLORS, SIZES, FONTS).
- Likely a `ThemeProvider` (seen `useTheme()` in `Home` screen) enabling dark mode toggles.
- Component patterns: Data-driven props, minimal inline logic, styling in StyleSheet blocks.

---
## 📁 Project Structure (Key Folders)
components/      Reusable UI widgets & composites
config/          Payment provider config (must be secured)
constants/       Assets & theme tokens
context/         React Context providers (Auth, Notifications)
data/            Static seed data (e.g., banners)
lib/             Supabase client + domain service modules
navigations/     Stack & Tab navigation
screens/         Feature screens (auth, booking, payment, profile, etc.)
utils/           Cross-cutting helpers (navigation transitions, push)
db/ / database/  SQL migrations / raw SQL (for schema + functions)

---
## ⚙ Environment Configuration
Create a `.env` (or `.env.local`) file:
```
REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
COINBASE_API_KEY=your_key   # (REMOVE keys from repo!)
COINBASE_WEBHOOK_SECRET=whsec_xxx
```
Add to `.gitignore`:
```
.env*
```

Replace any hardcoded secrets in `config/` with environment reads (e.g. via `react-native-dotenv`).

---
## ▶ Running the Project
1. Install dependencies:
	 `npm install`
2. Start Metro / Expo:
	 `npm start`
3. Choose platform (press `a` for Android, `i` for iOS if on macOS, `w` for web).
# ProvidaPro (Brico App)

A cross-platform (iOS / Android / Web) on-demand home & professional services marketplace built with Expo (React Native 0.79 / React 19) + Supabase + Stripe + Coinbase Commerce.

---

## Table of Contents

- Overview
- Core Features
- Architecture
- Data & Backend (Supabase)
- Authentication Flow
- Navigation Structure
- State & Context Layer
- Services / Data Fetching Pattern
- Payments (Stripe & Crypto)
- Push Notifications
- Theming & UI System
- Project Structure
- Environment Configuration
- Running the Project
- Quality / Lint / Formatting
- Extending the App (How-To Guides)
- Security Considerations
- Troubleshooting
- Roadmap / Suggested Improvements

---

## Overview

ProvidaPro is a service marketplace application where users can discover categories, view services, pick workers, chat, book appointments, and pay using traditional cards (Stripe) or cryptocurrency (Coinbase Commerce). It leverages Supabase for authentication, real-time data access, and custom RPC functions (e.g. `get_service_workers`). The UX uses modular reusable components and animated, categorized flows with tailored navigation transitions.

---

## Core Features

- Onboarding (4-step flow + profile creation + biometric PIN/Fingerprint)
- Email / (future: phone) based auth with Supabase sessions & persisted storage
- Category discovery & dynamic service listing with worker expansion
- Worker details, reviews (structure prepared), booking steps, cancellations
- Search with server filtering (`ilike`) + debuggable service transformations
- Multi-payment options:
	- Stripe (card entry, saved methods, success/decline flows)
	- Crypto (Coinbase Commerce charges / checkouts)
- Notifications center (unread badge + stats) & push token registration
- Chat / Call placeholders for real-time comms integration
- Settings: Notifications, Payment, Security, Language, Privacy Policy
- Invite friends / Help Center / Customer Service
- E-Receipt, bookings history & cancellation flows
- Theming / Dark mode readiness via custom ThemeProvider

---

## Architecture

Layered, modular architecture:

UI Layer:

- `components/` – Reusable atomic + composite UI (inputs, cards, badges, etc.)
- `screens/` – Feature-level screens exported through `screens/index.js` and used in navigators

Navigation:

- Stack: `navigations/AppNavigation.js` (entry + conditional first-launch logic)
- Bottom tabs: `BottomTabNavigation.js` (not shown here, assumed Home / Inbox / Favourites / Profile, etc.)
- Custom transition orchestration: `utils/navigationTransitions.js` with semantic groups (auth, service, payment, modal, onboarding)

State / Context:

- `context/AuthContext.js` – Auth + user profile + session + push token registration
- `context/NotificationContext.js` – (Manages notification arrays, counts, stats) – referenced in Home

Data / Service Layer:

- `lib/supabase.js` – Configured Supabase client (storage with AsyncStorage, auto refresh on foreground)
- `lib/services/*` – Each domain (e.g., `home.js`) exposes fetch + transform utilities
- RPC usage: `supabase.rpc('get_service_workers', { service_id_param })`

Utilities:

- `utils/registerPushToken.js` – Dynamic import for notifications + token persistence
- `utils/navigationTransitions.js` – Centralized animation logic

Configuration:

- `config/stripe.config.js` (publishable key – secret must NOT stay client-side)
- `config/coinbase.config.js` (currently commits keys – SHOULD be secured)

Assets & Constants:

- `constants/` – `icons`, `images`, `illustrations`, `theme` (COLORS, SIZES, FONTS), `socials`

---

## Data & Backend (Supabase)

Tables implied from code:

- `service_categories` – id, name, description, created_at
- `services` – id, name, description, base_price, is_active, category_id, icon, created_at
- `worker_services` (in debug logs) – mapping workers to services (custom price, etc.)
- `notifications` (inferred) – id, type, title, message, is_read, related_id, related_type, channel, created_at
- `profiles` (inferred for user profile fetch)

RPC / SQL Functions:

- `get_service_workers(service_id_param uuid)` – returns workers with fields: ids, names, pricing, rating, job counts.

Transform Patterns:

- Raw Supabase results → UI-ready objects (adds image mapping, worker expansion, fallback values).

Performance Notes:

- Parallel worker fetch loops; consider batching or a single SQL join later.
- Client-side filtering of services by category; fine for moderate volume.

---

## Authentication Flow

1. `supabase.auth.getSession()` with an 8s timeout failsafe in `AuthContext`.
2. Session + user set; profile fetched via `getUserProfile(userId)`.
3. Push token registered post-auth (silent failure safe).
4. Listener `onAuthStateChange` keeps session synchronized; auto refresh toggled with AppState.

Edge Handling:

- Timeout fallback ensures `loading` isn't stuck.
- Defensive null checks for user/profile.

---

## Navigation Structure (Stack Extract)

- Auth / Onboarding: Onboarding1–4, Welcome, Login, Signup, ForgotPassword*, OTP, CreateNewPassword, FillYourProfile, CreateNewPIN, Fingerprint
- Main: `Main` (bottom tabs). Core flows: Home, Search, PopularServices, ServiceDetails(+Reviews), BookingStep1, BookingDetails, MyBookings, Cancel flows
- Payments: PaymentMethods, AddNewPaymentMethod*, AddNewCard, PaymentMethod, CreditCardPayment, CryptoPayment
- Settings & Profile: EditProfile, Settings* screens, ChangePIN/Password/Email
- Support / Misc: HelpCenter, InviteFriends, CustomerService, Chat, Call, EReceipt, Notifications

Transitions: Determined by `getTransitionConfig(screenName)` mapping groups to animation presets.

---

## State & Context Layer

- AuthContext: user, session, profile, `signOut()`, `refreshUserProfile()`
- NotificationContext (referenced): provides `notifications`, `unreadCount`, `userNotificationStats`, `isUserAuthenticated`

Potential Addition: Global query caching (React Query / TanStack Query) for consistent data invalidation.

---

## Data Fetching Pattern (`home.js` example)

Contract:

- `fetchServiceCategories(limit)`
- `fetchAllCategories()`
- `fetchActiveServices(limit)` → includes worker expansion via RPC
- `searchServices(query)`
- `transformCategories(raw)`
- `transformServices(rawWithWorkers)`
- `getWorkersForService(serviceId)`

Key Transform Behavior:

- Adds synthetic "All" category (unique id handling)
- Expands one service into multiple cards (one per worker) when workers exist
- Maps service name keywords → image assets

Edge Cases Covered:

- Empty lists return `[]`
- Errors return `{ data: [], error }` patterns
- Query guard for empty search strings

---

## Payments

Stripe:

- Configured publishable key in `stripe.config.js`
- Secret key MUST live on backend only (remove from repo / env!)
- Screens: AddNewCard, PaymentMethod, CreditCardPayment, success/decline variants

Crypto (Coinbase Commerce):

- `coinbase.config.js` holds API key + webhook secret (exposed – move to backend)
- Supported currencies list + environment flag (sandbox vs prod)

Security Actions Needed Immediately:

1. Remove real keys from client bundle
2. Use backend proxy to create charges / verify webhooks
3. Provide `.env` template

---

## Push Notifications

Dynamic, safe registration (`registerPushTokenForUser`):

- Lazy loads `expo-notifications`, `expo-device`, `expo-constants`
- Requests permissions; sets Android channel
- Extracts projectId from `app.json` / EAS metadata if present
- Upserts token via `upsertUserPushToken` service (expected Supabase table `user_push_tokens`)
- Silent failures logged; no crashes

---

## Theming & UI

- Color, spacing, typography via `constants/theme.js` (COLORS, SIZES, FONTS)
- `useTheme()` in screens for dark/light adaptation
- Component patterns: Data-driven props, StyleSheet usage

---

## Project Structure (Key Folders)

```
components/      Reusable UI widgets & composites
config/          Payment provider config (must be secured)
constants/       Assets & theme tokens
context/         React Context providers (Auth, Notifications)
data/            Static seed data (e.g., banners)
lib/             Supabase client + domain service modules
navigations/     Stack & Tab navigation
screens/         Feature screens (auth, booking, payment, profile, etc.)
utils/           Cross-cutting helpers (navigation transitions, push)
db/ / database/  SQL migrations / raw SQL (for schema + functions)
```

---

## Environment Configuration

Create a `.env` (or `.env.local`) file:

```
REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
COINBASE_API_KEY=your_key   # (REMOVE keys from repo!)
COINBASE_WEBHOOK_SECRET=whsec_xxx
```

Add to `.gitignore`:

```
.env*
```

Replace hardcoded secrets in `config/` with environment reads (e.g. `react-native-dotenv`).

---

## Running the Project

1. Install dependencies: `npm install`
2. Start Metro / Expo: `npm start`
3. Choose platform (press `a` for Android, `i` for iOS (macOS), `w` for web)
4. Ensure Supabase env vars are set; otherwise auth/service fetch will fail silently

Optional tooling:

- Format: `npm run format:write`
- Lint: `npm run lint:fix`

---

## Quality Tooling

- ESLint + Prettier configured
- Expo SDK 53 + React Native 0.79 + React 19
- Reanimated / Gesture Handler for advanced UI

Recommended Additions:

- Jest or Detox tests
- TypeScript migration

---

## Extending the App (How-To)

Add a New Service Domain:

1. Create `lib/services/<domain>.js`
2. Add pure transform helpers
3. Add screen in `screens/` and export in `screens/index.js`
4. Register in `AppNavigation.js` + choose transition

Add Push Handling (Foreground):

1. Initialize `expo-notifications` listener in a root provider
2. Insert notifications into table → subscribe via Realtime

Implement Booking Flow Enhancements:

1. Add `booking` table + `booking_items` + statuses
2. Extend `ReviewSummary` to POST a review
3. Use RLS policies in Supabase

---

## Security Considerations

- Remove Stripe secret + Coinbase API key + webhook secret from client bundle
- Enable Row Level Security (RLS) in Supabase for all tables
- Validate all RPC inputs server-side
- Rate limit auth + search endpoints
- Sanitize chat inputs (if rendered on web)

---

## Troubleshooting

Blank Screen after Launch:

- Check `AuthContext` timeout logs; validate Supabase URL/key

No Services Appear:

- Confirm `services.is_active = true`
- Test RPC: `select * from get_service_workers('<service_uuid>');`

Push Token Missing:

- Ensure EAS project ID in `app.json` (extra.eas.projectId)

Crypto Payment Not Creating Charge:

- Implement backend relay; avoid calling Coinbase directly from client

---

## Roadmap / Suggested Improvements

- [ ] Secure secrets (env + backend proxy endpoints)
- [ ] Migrate to TypeScript
- [ ] Introduce React Query + optimistic updates
- [ ] Add testing (Jest + React Native Testing Library)
- [ ] Implement booking availability calendar + time slots
- [ ] Add review creation & rating aggregation table
- [ ] Real-time chat (Supabase Realtime / external provider)
- [ ] Offline caching for categories/services
- [ ] Accessibility pass (voiceover labels, larger hit boxes)
- [ ] Performance audit: virtualized lists for large service sets

---

## License

Proprietary (update with your chosen license). Remove sensitive keys before any public release.

---

## Contributing

1. Fork & branch: `feat/<feature-name>`
2. Ensure lint passes: `npm run lint:check`
3. Open PR with summary + screenshots / logs

---

## Quick Health Checklist

- Auth: Supabase session persisted via AsyncStorage ✔
- Navigation: Grouped transition strategy ✔
- Payments: Stripe & Coinbase integrated (needs secret handling hardening) ⚠
- Push: Dynamic registration + upsert path ✔ (backend function required)
- Data Layer: Transform abstraction for UI consumption ✔
- Secrets: Currently exposed in repo ❌ (fix required)

---

## Notes

This README was generated via automated static analysis of the repository structure and representative files (`AuthContext`, navigation, service layer, payments config, transforms, Home screen). Update sections as backend schemas evolve.

Feel free to edit / trim for distribution builds.

---

Happy building! 🚀
