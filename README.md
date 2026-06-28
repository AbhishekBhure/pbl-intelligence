# PBL Intelligence & Grant Reporting Assistant

A full-stack program intelligence tool built for Mantra4Change's Lead Full-Stack Product Developer assessment. Converts raw Project-Based Learning (PBL) implementation data into review-ready decisions and grant-ready reporting.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite, React Router v6   |
| Backend  | Node.js, Express.js (ESM)         |
| Database | MongoDB Atlas via Mongoose        |
| AI       | Google Gemini 2.5 Flash           |
| Data     | 6 synthetic CSVs (6900+ records)  |

---

## Project Structure
pbl-intelligence/
├── client/               # Vite + React frontend
│   └── src/
│       ├── components/   # Layout, Dashboard, Filters, Grant UI
│       ├── pages/        # Dashboard, DistrictBlock, ReviewPrep, GrantReporting
│       ├── services/     # Axios API calls
│       └── utils/        # riskEngine.js (client-side classification)
├── server/               # Node.js + Express backend
│   └── src/
│       ├── config/       # MongoDB connection
│       ├── models/       # Mongoose schemas (4 collections)
│       ├── routes/       # dashboard, districts, grants, review
│       ├── services/     # riskEngine, aggregator, geminiService
│       └── scripts/      # seedData.js
├── data/                 # All 6 synthetic CSV files
└── README.md
---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### 1. Clone and install

```bash
git clone <your-repo-url>
cd pbl-intelligence

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Seed the database

```bash
cd server
npm run seed
```

Expected output:
✅ PBL_School_Response_Data_July_2025.csv: 2300 records inserted
✅ PBL_School_Response_Data_August_2025.csv: 2300 records inserted
✅ PBL_School_Response_Data_September_2025.csv: 2300 records inserted
✅ Grant profiles: 9 records inserted
✅ Grant performances: 9 records inserted
✅ Media evidence: 9 records inserted
🎉 Seed complete!
### 4. Run the application

```bash
# Terminal 1 — Start server
cd server && npm run dev

# Terminal 2 — Start client
cd client && npm run dev
```

Open `http://localhost:3000`

---

## Data Model

### `school_responses` (~6900 documents)
One document per school per month. Fields include school code, district, block, PBL conducted flag, evidence submitted flag, class-wise enrollment and attendance, derived totals, and risk status.

### `grant_profiles` (9 documents)
One document per grant per month. Contains budget lines with approved, monthly, and cumulative utilization units embedded as an array.

### `grant_performances` (9 documents)
One document per grant per month. Contains PBL completion rate, evidence rate, attendance rate, milestone summary, report status, and draft report text.

### `media_evidence` (9 documents)
Linked media assets (images and news clippings) associated with each grant.

---

## Risk Classification Logic

All risk classification is deterministic — computed in code with no AI dependency.
On Track  ≥ 75%
Behind    60% – 74.9%
At Risk   35% – 59.9%
Critical  < 35%
Applied to: attendance rate, participation rate, evidence submission rate — at school, block, district, and grant level.

Risk explanations are generated programmatically by `riskEngine.js` on both the server and client, describing exactly why a geography or indicator received its classification.

---

## AI Workflow
Deterministic calculations
↓
Structured facts object assembled on server
↓
Gemini 2.5 Flash generates narrative
using ONLY computed facts (no raw CSV rows)
↓
Response shows: [Facts Panel] + [Generated Narrative]
↓
If Gemini unavailable → deterministic fallback text shown

### Guardrails
- Gemini is prompted to use ONLY facts provided — no invention of data
- All dashboard metrics, risk classifications, and grant fact summaries work with AI disabled
- Fallback narratives are built from the same structured facts object
- Source is always labeled: `AI Generated` or `Deterministic Fallback`

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | KPIs with filters |
| GET | `/api/dashboard/mom` | Month-over-month comparison |
| GET | `/api/dashboard/filters` | Filter options |
| GET | `/api/districts` | District performance |
| GET | `/api/districts/blocks` | Block performance |
| GET | `/api/grants` | All grants list |
| GET | `/api/grants/:id` | Grant detail for selected month |
| POST | `/api/grants/:id/narrative` | Generate Gemini narrative |
| GET | `/api/review/summary` | Review summary with AI narrative |

---

## Assumptions

- Attendance rate is capped at 100% for display. The CSV stores average session attendance (science + math separately), which can sum above total enrollment when both subjects are taught. Display uses `Math.min(rate, 1)`.
- Risk status in the CSV is treated as the source of truth for school-level classification. District and block risk is re-derived from aggregated attendance rates.
- All data is synthetic. No real schools, donors, districts, or financial records are represented.
- Grant period covers July–September 2025 (3 months). Month-over-month for July shows no previous data.
- `covered_districts` in grant data links grants to geographies by name match.

---

## Limitations

- No authentication or user management — single shared view.
- Block filter options in the FilterBar are not yet scoped to the selected district.
- Gemini API latency (~2–4 seconds) means narrative generation is not instant.
- Media assets are metadata only — no actual image files are served.
- Export to PDF/DOCX not implemented (Tier 3 optional).

---

## Production Readiness Notes

- **Database**: MongoDB Atlas with indexed queries on `reportingMonth`, `district`, `block`, `riskStatus`. Compound index on `(reportingMonth, district, block)` for common filter patterns.
- **Security**: `.env` excluded via `.gitignore`. In production, use secret managers (AWS Secrets Manager, GCP Secret Manager).
- **Scalability**: Aggregation pipelines handle district/block grouping server-side. Adding more months requires only re-seeding with new CSV files.
- **AI fallback**: All routes return deterministic data even when Gemini is unavailable. The fallback is structurally identical to the AI output.
- **Error handling**: All routes have try/catch with structured error responses. Frontend shows error states gracefully.

---

## Future Improvements

- Scope block filter options dynamically based on selected district
- Add recommended actions (Tier 3) with owner, priority, due date per gap
- Export grant report sections to PDF
- Add authentication with role-based access (Program Manager vs Leadership)
- Real-time data ingestion via CSV upload UI instead of manual seeding
- Chart visualizations for trend lines across months using Recharts
- School-level drill-down from district/block tables

---

## Evaluation Notes

- **Deterministic first**: Every metric, risk classification, and fact summary works without AI
- **AI as narrative layer only**: Gemini receives structured facts, not raw CSV data
- **Grounded outputs**: Prompts explicitly instruct Gemini not to fabricate data
- **Graceful fallback**: `source: fallback` responses are structurally identical to `source: gemini`
- **Data integrity**: MongoDB schema enforces risk status enum values and required fields