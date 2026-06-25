# FixMyHood 🏙️

**A hyperlocal civic issue-reporting platform** — styled like a municipal blueprint and stamped ledger. Citizens report, verify, and track local issues; Gemini AI handles categorization and resolution audits.

🔗 **[Live App](https://fixmyhood-1045854488767.asia-southeast1.run.app)**

Built for the **"Community Hero — Hyperlocal Problem Solver"** challenge.

<br />

## What it does

Communities struggle to report and track local issues — potholes, water leaks, broken streetlights, and waste management concerns — with little visibility into whether anything actually gets fixed.

FixMyHood lets citizens **identify, report, validate, track, and resolve** these issues together. AI handles categorization and resolution verification, while the community handles confirmation, keeping the whole process transparent.

<br />

## Features

- 🗺️ **Vector Blueprint Map** — Interactive custom-styled vector map with coordinate tracking, interactive pinning, and hotspot clustering for recurring problem areas.
- 📋 **Issue Feed** — Filter reports by category, status, or neighborhood; export filtered dockets directly to **CSV** or **JSON** spreadsheets.
- 🕒 **Audit Timeline** — Full chronological ledger of every issue, from first report to resolution, fully visible to anyone.
- ✅ **Community Verification** — "+1 I see this too" confirmations; 5+ marks an issue Verified, 6+ marks it High Priority.
- 🤖 **AI-Verified Resolution** — Gemini compares before/after photos side-by-side to verify a physical fix actually occurred before closing the ledger.
- 📊 **Impact Dashboard** — Statistics, metrics, and interactive charts on reported, in-progress, and resolved issues.
- 🏆 **Leaderboard & Badges** — Points for reporting and verifying issues, with Bronze/Silver/Gold reporter badge tiers.

<br />

## Visual Style: Blueprint & Ledger

Designed to feel like an official municipal record book, not a generic SaaS dashboard:
- Dark indigo "blueprint" backgrounds with stamped cream accents.
- Status badges (`VERIFIED`, `URGENT`, `AUDITED RESOLVED`) styled like rotated rubber ink stamps.
- Monospace logbook-style metadata for timestamps, coordinates, and report IDs.

<br />

## Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 19 (Vite) |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Backend** | Express.js + Node.js |
| **AI Engine** | Google Gen AI SDK (`@google/genai`) |
| **Charts** | Recharts |

<br />

## Getting Started

### Prerequisites
- Node.js v18 or newer
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
```bash
   git clone https://github.com/srushtibabar/fixmyhood.git
   cd fixmyhood
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root (or copy `.env.example`):
```env
   GEMINI_API_KEY="your_gemini_api_key_here"
```
   *(The Gemini API key remains 100% server-side and is never exposed to the client.)*

4. **Run the local server:**
```bash
   npm run dev
```

5. **Open the App:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

<br />

## Problem Statement

Communities frequently face fragmented, hard-to-track civic issues with little transparency into whether anything gets resolved. FixMyHood gives citizens a single platform to identify, report, validate, track, and resolve local issues — using AI to automate categorization and verify real-world resolution, while keeping the entire process visible to the community.

<br />

## License

Built for hackathon submission purposes. Add a license (e.g., MIT) if open-sourcing beyond the competition.
