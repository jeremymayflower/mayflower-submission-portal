# Mayflower Specialty — AI Risk Submission Portal

Client-facing submission portal for Mayflower Specialty's AI liability insurance products (D&O, EPL, E&O). Companies upload governance documents and answer adaptive questionnaire questions. Connects to a live backend API for extraction, scoring, and policy administration.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → "Add New Project"
3. Import your GitHub repo
4. Framework: **Vite** (auto-detected)
5. Click Deploy

That's it. Vercel handles the build automatically.

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Backend API

All data flows through the Railway backend at:
`https://mayflower-pipeline-production.up.railway.app`

Swagger docs: `https://mayflower-pipeline-production.up.railway.app/docs`

## Architecture

- **React + TypeScript** — UI framework
- **Tailwind CSS** — Styling with custom Mayflower brand palette
- **Zustand** — Cross-step state management
- **jsPDF** — PDF scorecard generation (internal underwriting use)
- **Vite** — Build tool

## Key Security Notes

- The applicant NEVER sees scoring data, premiums, or underwriting decisions
- The `/score` endpoint response is used only to trigger backend processing and generate the internal PDF scorecard
- The PDF scorecard is for underwriting team use only
