# Excel AI Analyst

An AI-powered web application that lets you talk to your spreadsheets, clean messy data automatically, and get instant insights — no coding or formulas required.

## What it does

**Chat with your data** — Ask questions in plain English like "show me top 10 customers by revenue" and get instant results with auto-generated charts. Multi-turn memory means it remembers context across questions.

**AI data cleaning** — Upload a messy file and the AI scans for duplicates, missing values, inconsistent formats, and whitespace issues. Shows a before/after diff so you can accept or reject individual changes before downloading the cleaned file.

**Insight generator** — One click scans your entire dataset and surfaces trends, anomalies, and statistical patterns with real numbers from your data.

**Formula explainer** — Paste any Excel formula and get a plain English explanation using your actual column names as context.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Python, Pandas, OpenAI GPT-4o |
| Database | Supabase (PostgreSQL) |
| File parsing | SheetJS (client), openpyxl (server) |
| Deployment | Vercel (frontend), Railway (backend) |

## Project structure
```
excel-ai-analyst/
  frontend/              # Next.js app
    app/                 # Pages and routing
    components/          # UI components
    lib/                 # API client, sheet parser
  backend/               # FastAPI server
    app/                 # Main entry point
    agents/              # AI agents (cleaning, NL, insights, formula)
    routes/              # API endpoints
    memory/              # Chat memory + session store
    db/                  # Supabase client
```

## Features in detail

### Natural language queries
Type any question about your data. The NL agent generates pandas code, executes it safely in a sandboxed environment, and returns the result as a table with an automatically chosen chart type.

### Data cleaning agent
Detects and fixes:
- Duplicate rows
- Missing values (fills numeric with median, text with "unknown")
- Inconsistent date formats (standardizes to YYYY-MM-DD)
- Whitespace in string columns
- Inconsistent casing

Returns a structured diff with old value → new value for every change made.

### Multi-turn chat memory
Every conversation is stored in Supabase and loaded on each request. The last 20 messages are sent to GPT-4o as context so follow-up questions work naturally.

### Auto chart generation
After every query that returns tabular data, a second AI call decides the best chart type (bar, line, pie, scatter) based on the column types and data shape.

## Local setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- OpenAI API key

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/excel-ai-analyst.git
cd excel-ai-analyst
```

### 2. Set up the database

Go to your Supabase project → SQL Editor → run this:
```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  original_columns jsonb,
  row_count integer,
  created_at timestamp with time zone default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

create index messages_session_id_idx on messages(session_id, created_at asc);
```

### 3. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-key
```

Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend setup
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload .xlsx or .csv file |
| GET | `/api/session/:id` | Get session metadata |
| POST | `/api/chat` | Send a message, get AI response |
| GET | `/api/chat/history/:id` | Load chat history |
| POST | `/api/clean` | Run AI cleaning agent |
| GET | `/api/export/:id` | Download cleaned file |
| POST | `/api/insights` | Generate dataset insights |
| POST | `/api/chart-suggest` | Get chart type suggestion |
| POST | `/api/formula/explain` | Explain an Excel formula |

## Supported file formats

- `.xlsx` — Excel 2007 and later
- `.xls` — Excel 97-2003
- `.csv` — Comma separated values

Maximum recommended file size: 50MB

## Environment variables

### Backend
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |

### Frontend
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## Deployment

- Frontend is deployed on Vercel — connects to GitHub for automatic deployments on every push
- Backend is deployed on Railway — auto-deploys from the `backend/` directory on every push
