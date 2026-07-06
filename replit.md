# SAI FLOWERS AND DECORATORS

Premium bilingual (English + Marathi) flower decoration business website for SAI FLOWERS AND DECORATORS, Pune, India.

## Run & Operate

- `pnpm --filter @workspace/sai-flowers run dev` — run the website (main artifact)
- `pnpm run typecheck` — full typecheck across all packages
- Required secrets: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

## Stack

- React 19 + Vite + TypeScript + Tailwind CSS
- Framer Motion for animations
- Firebase (Auth, Firestore, Storage) for gallery, content, admin
- Wouter for client-side routing
- react-hook-form for enquiry form
- pnpm workspaces, Node.js 24, TypeScript 5.9
- Express 5 API server (not used by main site — Firebase handles data directly)

## Where things live

- `artifacts/sai-flowers/src/` — main website
  - `lib/firebase.ts` — Firebase init
  - `lib/i18n.tsx` — bilingual context + useLanguage hook
  - `translations/en.json` / `translations/mr.json` — all UI strings
  - `components/` — Navbar, Hero, About, Services, Gallery, Testimonials, FAQ, Enquiry, Contact, Footer, FloatingButtons, LoadingScreen, CustomCursor, ScrollProgress, SEOHead
  - `pages/Home.tsx` — main page assembling all sections
  - `pages/Admin.tsx` — Firebase-protected admin dashboard
  - `pages/AdminLogin.tsx` — Firebase auth login
- `attached_assets/generated_images/` — AI-generated images (hero, about, service cards)

## Architecture decisions

- Firebase-direct: All data (gallery, testimonials, FAQs, settings) stored in Firestore/Storage, no Express backend needed
- Enquiry form opens WhatsApp (wa.me/919960629513) with pre-filled message, no server-side form handling
- Gallery images right-click/download disabled; Firebase Storage as source of truth
- Admin at /admin route (Firebase Auth protected); /admin/login for login page
- All UI text goes through t() translation function; language toggle stored in localStorage

## Product

Premium bilingual (EN/MR) flower decoration business website:
- Home page with animated hero, about, 24 services, gallery, testimonials, FAQ, enquiry form, contact
- WhatsApp enquiry: form data auto-formats into WA message
- Firebase-powered gallery with category filters, lightbox, lazy loading
- Admin dashboard (login required): upload/delete gallery photos, manage testimonials, FAQs, settings
- Floating WhatsApp + Call buttons, scroll progress bar, custom cursor, loading screen

## User preferences

- Business name: SAI FLOWERS AND DECORATORS
- WhatsApp: +91 9960629513 / wa.me/919960629513
- Colors: Primary Green #1E5631, Gold #D4AF37
- Bilingual: English + Marathi

## Gotchas

- Google Fonts @import must be the FIRST line in index.css (before Tailwind imports)
- Firebase env vars must be prefixed VITE_ for Vite to expose them to the browser
- Gallery fallback to mock Unsplash images when Firestore is empty

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
