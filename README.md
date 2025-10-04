# Basic Financial Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.3.2-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10.17.1-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

A multilingual (English/Thai) suite of web-based calculators for Thai retail banking scenarios. Built with React, Vite, Material UI, and decimal-precise financial logic, the app covers loan amortisation, savings Actual/365 accruals, fixed and tiered deposits, and time-value simulations.

## ✨ Highlights
- **Clarity-first outputs** with rich tables, charts, and contextual explanations.
- **Consistent export tooling** for CSV and Excel across every dataset.
- **Localized UX**: language toggle, right-sized typography controls, and Thai-specific tax rules.
- **Offline-ready** build via Vite PWA integration and hashed routing for GitHub Pages.

## 🧱 Tech Stack
- React 18 + TypeScript + Vite
- Material UI (core + x-charts)
- Zustand for user preferences (theme, language, text scale)
- react-hook-form + zod for form validation
- decimal.js for financial calculations

## 🚀 Quick Start

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io) (enable with `corepack enable` if not installed)

### Installation & Development
```bash
pnpm install
pnpm dev
```
The dev server runs on [http://localhost:5173](http://localhost:5173) with hot module replacement.

## 🔐 Environment Configuration
1. Copy the example file and provide the secured BOT endpoint:
   ```bash
   cp .env.example .env
   ```
2. Set `VITE_BOT_ENDPOINT` to the API that returns Bank of Thailand deposit rates (Cloudflare Worker, proxy, or internal service).

If the variable is missing, runtime requests to the deposit rate service will throw an error to avoid accidentally calling the default demo endpoint.

## 📦 Project Scripts
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check and produce production bundle in `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | ESLint with type-aware rules |
| `pnpm typecheck` | Project references TypeScript check |
| `pnpm test` / `pnpm test:watch` | Vitest + Testing Library |
| `pnpm format` | Prettier formatting |

## 🗂️ Project Structure
```
.
├── src/
│   ├── app/                 # App shell, providers, router, theme
│   ├── assets/              # Static assets imported through Vite
│   ├── domain/finance/      # Pure financial logic (decimal.js)
│   ├── features/            # Calculator features (loan, deposits, time-value)
│   ├── hooks/               # Shared React hooks
│   ├── i18n/                # react-i18next configuration + locales
│   ├── services/            # API and storage adapters
│   ├── ui/                  # Reusable components and route-level pages
│   ├── utils/               # Formatting + export helpers
│   └── vite-env.d.ts        # Vite environment typings (VITE_BOT_ENDPOINT)
├── public/                  # Static assets copied as-is
├── docs/DesignDocument.md   # Consolidated design + implementation notes
└── legacy-site/             # Original static HTML reference
```

## 🧮 Calculator Notes
- **Loan Planner** – Standard amortisation formula with chart/table exports.
- **Savings Actual/365** – Handles 20,000 THB tax threshold, semiannual payouts, and clarity-first summaries.
- **Fixed & Tiered Deposits** – BOT rate integration with CSV/XLSX exports per breakdown.
- **Time Value** – Future Value schedule table and Net Present Value cash-flow comparison with export parity.

Further implementation details are captured in `docs/DesignDocument.md`; the former per-feature markdown files are archived as pointers to that document.

## 🌐 Internationalisation
- Translations live under `src/i18n/locales/{en|th}/translation.json`.
- `src/i18n/config.ts` lists supported languages; extend it when adding new locales.
- Components use `react-i18next` hooks and dynamic keys for menu/item generation.

## ✅ Testing & Quality
```bash
pnpm lint
pnpm typecheck
pnpm test
```
- Domain logic has targeted Vitest suites (see `src/domain/finance/__tests__/`).
- UI tests mock heavy chart components and focus on user flows.
- Use `pnpm test --coverage` for lcov + text reports when needed.

## 🚢 Deployment
- `pnpm build` outputs to `dist/` with the correct `base` for GitHub Pages (`/basic-financial-calculator/`).
- The dedicated workflow in `.github/workflows/deploy.yml` deploys `dist` on pushes to `main`.
- Router uses `HashRouter`, so no additional 404 handling is required.
- If the repository name changes, update `repoBase` in `vite.config.ts` and redeploy.

## 🤝 Contributing & Maintenance
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before pushing changes.
- Update dependencies with `pnpm update --interactive` and rerun quality checks.
- See `docs/DesignDocument.md` for architectural guidance prior to introducing new calculators or modifying tax logic.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Need a quick summary for stakeholders? Export-ready tables and the Design Document provide the authoritative reference for implementation details and future enhancements.
