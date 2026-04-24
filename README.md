# SimCopilot Frontend

React + Vite frontend for the local SimCopilot workflow.

## Local development

Start the FastAPI backend from the `ai_simulation_pilot` repository with `uv`:

```powershell
cd c:\Users\tsahi\ai_simulation_pilot
uv sync
uv run python -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

Start the frontend:

```powershell
cd c:\Users\tsahi\ai_simulation_pilot_frontend\simcopilot-frontend
npm install
npm run dev
```

The app defaults to `http://127.0.0.1:8000` for the backend.

## Backend URL

To point the frontend at a different API, create `.env.local` from `.env.example` and set:

```powershell
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Later, you can replace that value with the deployed backend URL.

## Production build

```powershell
npm install
npm run build
```

## Current UI flow

1. Select an Abaqus `.inp` file.
2. Click `Run analysis`.
3. Inspect the JSON response from `/explain`.
