# Runway

Runway turns a student loan into one number to spend each week, lets students check a purchase before they make it, and keeps every debt in one place.

Built with Next.js (App Router) and TypeScript.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Marketing website |
| `/signup` | Create an account (name, university, year, email, password, invite code) |
| `/signin` | Sign in |
| `/onboarding/consent` | AI disclosure and data consent |
| `/onboarding/setup` | Conversational setup (type or speak) |
| `/onboarding/confirm` | Review parsed details before saving |
| `/home` | Weekly safe-to-spend, runway strip, this week's plan, recent entries |
| `/debts` | Debt tracker and student loan repayment estimate |
| `/account` | Setup summary, loan rollover, sign out, data controls |

Guards in `lib/engine.ts` (`nextPath`) send each visitor to the right step.

## Project structure

```
app/
  page.tsx                 marketing site
  (frame)/                 app frame: about panel + phone column + sheets
    signup/  signin/
    onboarding/{consent,setup,confirm}/
    (main)/                top bar, composer, bottom nav, auth guard
      home/  debts/  account/
components/                UI primitives, composer (voice), bottom sheets
lib/engine.ts              types, language parsing, deterministic budget engine
lib/store.tsx              client state persisted to localStorage, toasts
```

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Import the repository in Vercel. The framework preset is detected as Next.js; no settings need changing.

## Prototype limits

- Accounts and budgets live in the browser (localStorage). Passwords are stored only as a SHA-256 hash. There is no server yet; see the Engineering spec for the planned API.
- Language understanding is rule-based and stands in for the LLM layer.
- Voice input needs HTTPS and a browser with speech recognition (Chrome, Edge, Safari).
