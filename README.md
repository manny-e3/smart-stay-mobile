# SmartStay Guest Experience Mobile App

A quiet-luxury React Native mobile application built with **Expo SDK 57**, **React Native 0.86**, and **React 19**, compatible with both **Apple iOS** and **Google Android** devices. Designed for autonomous guest hospitality with digital room key management, live IoT in-room environmental controls, concierge service dispatches, dining orders, and stay folio management.

Connected to the live SmartStay backend API via a zero-mock, session-authenticated REST architecture.

---

## 🎨 Design System & Aesthetics
- **Design Philosophy:** Quiet luxury, Scandinavian minimalism, editorial typography, and calm tactile feedback.
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) across all touchpoints (Regular, Medium, SemiBold, Bold).
- **Color Palette:**
  - **Primary Navy (`#0B1F3A`):** Structural anchor, luxury contrast typography, active tab states.
  - **Accent Gold (`#C9A227`):** Reserved for primary action CTAs ("Hold to Unlock", "Place Order", "Submit Request").
  - **Limestone Canvas (`#F7F7F5`):** Warm limestone neutral to minimize OLED glare and eye strain.
  - **Card Surface (`#FFFFFF`):** 16px radius cards with subtle ambient elevation and subtle borders (`#E2E8F0`).
  - **Semantic Statuses:** Active/Connected Green (`#16A34A`), Pending/Warning Amber (`#B45309`), Alert/Locked Red (`#DC2626`), Progress Blue (`#2563EB`).
- **Haptic Tactility:** Integrated native vibration feedback ([`expo-haptics`](https://docs.expo.dev/versions/latest/sdk/haptics/)) on key activations, door unlocks, card selections, and pull-to-refresh completions.

---

## 📱 Comprehensive Feature Suite

### 1. Keyless Access & Multi-Method Authentication (`WelcomeScreen`)
- **QR Code Camera Scanner (`QrScannerModal`):**
  - Live native camera scanner powered by `expo-camera` (`CameraView`).
  - Custom geometric scanning reticle, pulsing gold laser line, and animated corner brackets.
  - Torch / flashlight toggle for low-light scans.
  - Instant authentication via digital QR pass token, URL payload, or printed check-in card.
  - Manual code entry fallback with instant clipboard paste.
- **Booking Reference & Last Name:**
  - Direct PMS lookup via reservation confirmation number (e.g. `REF-1001`) and guest surname.
- **Direct Room & Access Code Entry:**
  - 1-tap room number and assigned 6-digit access PIN sign-in.
- **Guest Member Sign-In:**
  - Registered account login with Email and secure Password.
  - Password visibility toggle (`eye` / `eye-off`).
- **Guest Profile Self-Registration:**
  - In-app profile creation (First Name, Last Name, Email, Phone, Password).
  - Client-side validation, password match verification, and instant welcome confirmation.
- **Self-Service Password Recovery:**
  - **Forgot Password Flow:** Dispatches a 6-digit verification code to the guest's email.
  - **Reset Password Modal:** Validates verification code and updates credentials securely.
- **Booking Linking (`POST /guest/link-booking`):**
  - Allows signed-in members to link existing reservations, room codes, or scanned passes to their active account.
- **Dynamic API Server Configuration:**
  - In-app server connection modal to test against local development (`http://10.0.2.2:5000` / `6000`), local tunnels, or production servers (`https://dev.rekovryltd.com`).
  - Live server health check badge (`Online` / `Offline`).

---

### 2. Digital Key & Door Security (`HomeScreen`)
- **Hero Digital Key Card:**
  - Animated pulsing status ring (Emerald Green for connected/unlocked, Slate for locked/secure).
  - High-contrast visual lock state badges: `Door Secured`, `Unlocking...`, `Latch Disengaged`.
  - **1-Tap / Hold-to-Unlock:** Cryptographic key verification with smart lock deadbolt via `POST /guest/key/unlock`.
  - **Auto-Relock Countdown:** Dynamic 8-second relock countdown timer with security chime alert and auto-relock actuation.
  - Manual 1-tap door locking trigger.
  - Digital key hardware status monitoring (`GET /guest/key`).
- **Personalized Stay Greeting:**
  - Time-of-day greeting ("Good morning", "Good evening"), guest name, suite number, and room category.
- **Quick Suite Access Cards:**
  - 1-tap Privacy Mode / Do Not Disturb toggle (`PUT /guest/dnd`).
  - 1-tap Scheduled Room Cleaning request toggle (`PUT /guest/room-status`).
  - Climate target summary and rapid room device status overview.

---

### 3. In-Room IoT & Environmental Controls (`ControlsScreen`)
- **Smart Thermostat & HVAC Climate Control:**
  - Real-time temperature readout with automated Fahrenheit / Celsius conversion.
  - 48x48px precision steppers (`+` / `-`) for target temperature adjustments.
  - Multi-mode climate selection: **Cool**, **Heat**, **Eco**, and **Fan Only**.
  - 4-speed fan control: **Auto**, **Quiet**, **Medium**, and **High**.
  - Dynamic Eco Mode energy-saving preset.
  - Direct hardware actuation via `POST /guest/devices/:id/command`.
- **Architectural Lighting & Dimmer Automation:**
  - Master lighting power toggle with tactile haptic response.
  - Smooth 0–100% linear dimmer slider with live percentage readout.
  - Independent lighting zones: **Ceiling Ambient**, **Bedside Reading**, and **Bathroom Vanity**.
  - Designer mood scenes:
    - **Relax & Warmth:** 2700K warm amber illumination.
    - **Evening Sunset:** Intimate accent lighting with low luminescence.
    - **Daylight Work:** Crisp 4000K neutral focus lighting.
    - **Night Pathway:** Low-level bedside guidance lighting.
    - **Master All Off:** 1-tap darkness for uninterrupted sleep.
- **Motorized Curtains & Smart Privacy Glass:**
  - 1-tap open / close motorized blackout drapes and sheer curtains.
  - Smart electrochromic privacy glass toggle (Transparent vs. 100% Opaque).
- **Smart TV & In-Room Entertainment:**
  - TV power toggle, incremental volume adjustment (`+` / `-`), and 1-tap mute.
  - Source input switcher: HDMI 1, HDMI 2, Apple AirPlay, Chromecast, Netflix, Spotify.
- **Mini-Bar Cooler & Wine Refrigerator:**
  - Power toggle and eco standby mode.
  - Digital thermostat control (33°F – 48°F).
  - Quick cooling presets: **Standard Refresh** (38°F), **Quick Chill Boost** (34°F), **Wine & Cellar Temp** (45°F).
- **Sync Custom Comfort Presets:**
  - Saves current climate, lighting, and cooling states directly to guest cloud preferences (`PUT /guest/preferences`).

---

### 4. Concierge, Dining & Guest Services (`ServicesScreen`)
- **Live Service Request Tracker:**
  - Real-time list of all guest requests synced from the backend (`GET /guest/requests`).
  - Status badges: `Pending` (Amber), `In Progress` (Blue), `Completed` (Green), `Cancelled` (Red).
  - **Request Detail Modal (`RequestDetailModal`):**
    - Full timeline visualization: Submitted ➔ Received by Concierge ➔ Dispatched to Floor Attendant ➔ Completed.
    - 1-tap guest cancellation (`POST /guest/requests/:id/cancel`).
    - Pull-to-refresh to check real-time progress.
- **Quick-Dispatch Service Cards:**
  - **Fresh Towels & Toiletries:** Extra Egyptian cotton bath sheets and vanity amenities.
  - **Luggage & Valet Porter:** Luggage handling and vehicle retrieval assistance.
  - **Late Check-Out:** 1-tap request for complimentary 2:00 PM late departure.
- **In-Room Gastronomy Dining:**
  - Curated luxury menu organized by category: Breakfast, All-Day Dining, Beverages, and Desserts.
  - Interactive quantity adjustments (`+` / `-`), dietary tags (GF, V, Chef Specialty), and real-time subtotal calculation.
  - Itemized order placement dispatched straight to the hotel kitchen (`POST /guest/requests` with category `food`).
- **24/7 Concierge Live Chat (`ConciergeChatModal`):**
  - Two-way interactive messaging with front desk and chief concierge.
  - Pre-composed quick prompts (late check-out, ice bucket, valet retrieval, turndown schedule).
- **Feedback & Room Issue Reporting (`FeedbackIssueModal`):**
  - 5-star rating submission with department category tagging.
  - Maintenance & room issue reporting with optional camera / photo attachment upload using `expo-image-picker`.
  - Dispatches directly to General Management and Engineering.

---

### 5. Guest Profile, Stay Folio & Past Stays (`ProfileScreen`)
- **Guest Identity & Membership Tier:**
  - Avatar initials badge, guest name, VIP tier ("Verified Guest"), and registered email.
- **Reservation & Property Overview:**
  - Suite number, room category, check-in date, check-out date & departure time (11:00 AM).
  - **1-Tap High-Speed Wi-Fi Pass:** Copies hotel SSID and encrypted password to clipboard.
  - Backup numeric door PIN display for physical keypad fallback.
- **Stay History Archive (`GET /guest/stays/history`):**
  - Complete history of past stays showing reservation reference, suite number, room category, dates, and completion status.
- **Express Mobile Check-Out:**
  - Safe 1-tap checkout dialog with confirmation alert.
  - Instant digital key deactivation and stay session termination (`DELETE /guest/session`).
- **Folio Statement & Invoice:**
  - Itemized room charges, in-room dining, and incidentals breakdown.
  - 1-tap request to email a finalized PDF folio statement to the guest.
- **Guest Preference Toggles:**
  - High Floor / Quiet Zone room preference.
  - Digital Key auto-share permission.
  - Evening turndown service scheduling.

---

### 6. Hotel Directory & Amenities (`HotelInfoModal`)
- **24/7 Front Desk Hotline:** 1-tap phone dialer linking directly to reception (`tel:` scheme).
- **Quick Property Links:** External links to spa bookings, restaurant reservations, and valet parking guidelines.
- **Interactive FAQ Accordion:**
  - Check-in / check-out policies.
  - Pool, fitness center, and wellness spa operating hours.
  - Breakfast and executive lounge schedules.
  - Luggage storage, security, and parking procedures.
- **Privacy & Encryption Notice:** End-to-end cryptographic key disclosures and privacy commitments.

---

### 7. Universal Pull-to-Refresh & Tactile Feel
- **Pull-Down-to-Refresh (`RefreshControl`):**
  - Integrated across all primary screens:
    - `HomeScreen`: Refreshes room reservation, digital key connectivity, and active requests.
    - `ControlsScreen`: Refreshes live hardware device state from smart home adapters.
    - `ServicesScreen`: Fetches latest request fulfillment states and dining status.
    - `ProfileScreen`: Synchronizes guest profile, folio invoice items, and past stay history.
    - `WelcomeScreen`: Updates hotel info, directory, amenities, and connectivity health.
    - `HotelInfoModal` & `RequestDetailModal`: Pull down to refresh directory and live request timeline.
  - `alwaysBounceVertical={true}` enabled to ensure smooth pull-down across both iOS and Android regardless of content length.
  - Themed spinner styling (`tintColor="#C9A227"`, `colors={['#C9A227', '#0B1F3A']}`, `progressBackgroundColor="#FFFFFF"`).
  - Native light haptic feedback triggered when refresh completes.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Expo SDK 57](https://docs.expo.dev/) | Cross-platform mobile development framework |
| **Runtime** | [React Native 0.86](https://reactnative.dev/) | Native mobile engine with New Architecture support |
| **Core UI** | [React 19](https://react.dev/) | State management, hooks, and component lifecycle |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Navigation** | State-driven Tab Navigator | Seamless 4-tab bottom navigation with badge indicators |
| **Camera & QR** | [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/) | Fast QR code scanner with hardware torch control |
| **Haptics** | [`expo-haptics`](https://docs.expo.dev/versions/latest/sdk/haptics/) | Native tactile vibration feedback for luxury feel |
| **Clipboard** | [`expo-clipboard`](https://docs.expo.dev/versions/latest/sdk/clipboard/) | 1-tap Wi-Fi and access code copying |
| **Media Picker** | [`expo-image-picker`](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Guest issue photo capture & gallery uploads |
| **Fonts** | [`@expo-google-fonts/plus-jakarta-sans`](https://docs.expo.dev/versions/latest/sdk/font/) | High-contrast luxury editorial typography |
| **Icons** | [`@expo/vector-icons`](https://icons.expo.fyi/) (Ionicons) | Clean, scalable vector symbology |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Expo Go](https://expo.dev/go) app installed on your physical Android or iOS device
- (Optional) Android Studio emulator or Xcode simulator

### Installation
```bash
# Navigate to the guest-mobile directory
cd guest-mobile

# Install all SDK-compatible dependencies
npm install
```

---

## 📱 Running on Physical Devices

### Option 1: Expo Go (Quickest, No Native Build Required)
1. Start the Metro bundler with tunnel connection (recommended for cross-network connectivity):
   ```bash
   npx expo start --clear --tunnel
   ```
2. **On Android:** Open the **Expo Go** app and tap **"Scan QR code"**, then scan the terminal QR code.
3. **On iOS:** Open the default **Camera** app, scan the terminal QR code, and tap the **"Open in Expo Go"** banner.

### Option 2: Local Wi-Fi Network
If your computer and mobile phone share the exact same Wi-Fi subnet:
```bash
npx expo start
```

---

## 📦 Building Standalone Binaries (EAS Build)

The project includes production-ready configurations in [`eas.json`](file:///c:/xampp/htdocs/Nodepro/SmartStay/guest-mobile/eas.json).

### Generate a Standalone Android APK for Testers:
```bash
# 1. Log in to your Expo account
npx eas-cli login

# 2. Build shareable preview APK
npx eas-cli build -p android --profile preview
```
*This produces a direct download link and installable `.apk` file that testers can install directly without Google Play Store.*

### Generate iOS Ad-Hoc / TestFlight Build:
```bash
npx eas-cli build -p ios --profile preview
```

---

## 🧪 Quality Assurance & Verification Commands

Before committing or releasing updates, always run the quality verification suite:

```bash
# 1. Strict TypeScript check (must output 0 errors)
npx tsc --noEmit

# 2. ESLint code standard verification
npx expo lint

# 3. Expo dependency and SDK health check
npx expo-doctor

# 4. Run web preview in browser
npm run web
```

---

## 🏛️ Architecture & Directory Layout

```
guest-mobile/
├── App.tsx                     # Main application entry point & root state
├── app.json                    # Expo project configuration, permissions & plugins
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript strict configuration
├── eas.json                    # EAS cloud build profiles (preview, production)
└── src/
    ├── components/             # Reusable UI elements & interactive modals
    │   ├── ConciergeChatModal.tsx    # 24/7 direct messaging sheet
    │   ├── FeedbackIssueModal.tsx    # Rating & photo-attached issue reporter
    │   ├── HotelInfoModal.tsx        # Amenities directory & FAQ accordion
    │   ├── QrScannerModal.tsx        # Live camera QR scanner with reticle & torch
    │   ├── RequestDetailModal.tsx    # Service request timeline & cancellation
    │   ├── SmartStayBottomNav.tsx    # 4-tab bottom navigation bar
    │   ├── SmartStayHeader.tsx       # Suite status bar & header badge
    │   └── ToastNotification.tsx     # Floating status banner
    ├── context/
    │   └── GuestStayContext.tsx      # Central guest stay state & backend synchronization
    ├── screens/
    │   ├── WelcomeScreen.tsx         # Multi-method keyless access & member sign-in
    │   ├── HomeScreen.tsx            # Digital key card, quick controls & greetings
    │   ├── ControlsScreen.tsx        # Climate, lighting, TV, cooler & scenes
    │   ├── ServicesScreen.tsx        # In-room dining, housekeeping & request tracker
    │   └── ProfileScreen.tsx         # Guest profile, Wi-Fi pass, stay history & checkout
    ├── services/
    │   └── guestApi.ts               # Authenticated REST client for SmartStay API
    ├── theme/
    │   ├── colors.ts                 # Champagne gold, navy & limestone design tokens
    │   ├── shadows.ts                # Floating card elevation presets
    │   └── typography.ts             # Plus Jakarta Sans type scale
    └── types/
        └── index.ts                  # Shared data models & TypeScript interfaces
```
