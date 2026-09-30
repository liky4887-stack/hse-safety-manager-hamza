# HSE Safety Manager — إدارة السلامة المهنية وتقارير HSE

A production-ready mobile application for **Al-Fayyad Oil Company** for HSE (Health, Safety & Environment) safety reporting and management.

Built with **Expo SDK 54**, **React Native**, **TypeScript**, and a **Liquid Glass** UI aesthetic inspired by iOS 26's glassmorphism design language.

---

## Features

### User Roles
- Employee, Supervisor, HSE Officer, Technician, Admin

### Report Types
- **Safe Condition/Behavior** — quick note + optional photo
- **Unsafe Condition/Act** — 5-step wizard:
  1. Classification (Unsafe Condition vs Unsafe Act)
  2. Details (description, corrective action, photo, GPS)
  3. Responsible Department (9 departments)
  4. Dynamic Subcategory (per department)
  5. Status & Priority (Open/Closed, Low/Medium/High/Critical)

### Screens
- **Login** — role + department selection with glass UI
- **Home** — two large glass cards for safe/unsafe reports + stats + recent reports
- **My Reports** — filterable list (type, status, department)
- **Report Details** — full report data, photo, GPS map link, timeline, action buttons
- **Notifications** — push notification list with deep links to reports
- **Dashboard** (Admin/HSE) — stats cards, bar chart by department, pie chart by priority, date range filter
- **Profile/Settings** — user info, language toggle (Arabic/English), theme mode (light/dark/system), logout

### UI/UX
- Liquid Glass effect on all cards, buttons, tab bar, and form containers
- Arabic RTL by default with English as secondary
- Cairo font family for Arabic
- Dark and light mode support
- Smooth Reanimated animations throughout
- Large touch targets for field use
- High contrast for outdoor visibility

---

## Technical Stack

| Category | Technology |
|---|---|
| Framework | Expo SDK 54, React Native |
| Language | TypeScript |
| Navigation | expo-router |
| State | Zustand + AsyncStorage |
| Glass Effect | expo-blur + LinearGradient |
| Animations | react-native-reanimated |
| Charts | react-native-gifted-charts |
| Camera | expo-image-picker, expo-camera |
| Location | expo-location |
| Notifications | expo-notifications |
| Fonts | @expo-google-fonts/cairo |

---

## Setup & Development Build

This app uses native modules (blur, camera, location) that require a **Development Build** — Expo Go will NOT work.

### Install dependencies
```bash
npm install
```

### Create a development build
```bash
npx expo prebuild
# iOS:
npx expo run:ios
# Android:
npx expo run:android
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Start the dev server
```bash
npm run dev
```

---

## Project Structure

```
app/
├── _layout.tsx          # Root layout (fonts, RTL, init)
├── login.tsx            # Login / role selection
├── +not-found.tsx
├── (tabs)/
│   ├── _layout.tsx      # Glass tab bar
│   ├── index.tsx        # Home screen
│   ├── reports.tsx      # My Reports list
│   ├── notifications.tsx
│   ├── dashboard.tsx    # Admin/HSE charts
│   └── profile.tsx      # Settings
└── report/
    ├── safe.tsx         # Safe report flow
    ├── unsafe.tsx       # Unsafe 5-step wizard
    └── details/[id].tsx # Report details

components/              # LiquidGlassCard, Button, Panel, etc.
config/                  # Departments & subcategories config
hooks/                   # useTheme, useI18n
i18n/                    # Arabic & English translations
store/                   # Zustand store with AsyncStorage
theme/                   # Color system (light/dark)
types/                   # TypeScript types
```

---

## Data Model

All data is stored locally via AsyncStorage. The Zustand store is designed so a backend (Supabase/Firebase/REST) can be added later by replacing the persistence layer.

- **User**: id, name, role, department, email, phone, avatar
- **Report**: id, type, category, description, correctiveAction, photoUri, department, subcategory, status, priority, location, createdBy, assignedTo, timeline, timestamps
- **Department**: id, nameAr, nameEn, subcategories[]
- **Notification**: id, reportId, title, body, targetRole, createdAt, read

---

## Liquid Glass Design

The glass effect is achieved through:
- **iOS**: `expo-blur` `BlurView` with tint modes + gradient highlights + subtle borders
- **Android**: Semi-transparent backgrounds + gradient overlays to simulate glassmorphism

The visual style takes inspiration from [liquid-glass-js](https://github.com/dashersw/liquid-glass-js) but uses React Native native modules instead of WebGL.

---

## License

Proprietary — Al-Fayyad Oil Company
