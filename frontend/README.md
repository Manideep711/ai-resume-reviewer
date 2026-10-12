# Align — AI Resume Reviewer frontend

React + Vite + TypeScript + Tailwind CSS. A responsive review workspace connected to the existing Spring Boot backend. Icons come from Lucide; the variable Inter font is served locally. The backend is preserved in `../backend/`.

## Run locally

Start the existing backend in IntelliJ with `GROQ_API_KEY` configured in its environment, or follow the exact PowerShell commands in the root README. It should listen at `http://localhost:8080`.

In a second terminal, from this `frontend/` directory:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`. Node 24 is supported by this project's dependencies.

The example sets `VITE_API_BASE_URL=http://localhost:8080`. The browser sends requests directly to Spring Boot, whose CORS configuration permits `http://localhost:5173` and `http://127.0.0.1:5173` by default. Vite uses port 5173 with `strictPort` to keep this origin predictable.

If you intentionally leave `VITE_API_BASE_URL` empty, requests use `/api/v1/resume-reviews` on the same origin, and Vite's development proxy forwards `/api` to the backend. Direct requests are the default integration setup; the proxy remains available for same-origin development.

For a separately hosted backend, set the public backend origin in `.env.local`, with no `/api` suffix:

```dotenv
VITE_API_BASE_URL=https://your-backend.example
```

Set `CORS_ALLOWED_ORIGINS` on the backend to the actual production frontend origin (for example, replace `https://your-frontend.example` with the deployed URL). Multiple exact origins may be comma-separated; setting the variable replaces the default local list. An empty list disables cross-origin requests. No cookies or authorization headers are needed by this endpoint.

Restart Vite after changing environment variables and restart the backend after changing its CORS environment. For production, set `VITE_API_BASE_URL` before building, or serve the frontend with a same-origin reverse proxy for `/api`. Vite's development proxy does not exist in the production build or preview server.

Never put `GROQ_API_KEY` or any secret into a `VITE_` variable: those variables are visible in the browser. The frontend only calls Spring Boot.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

`npm run preview` serves `dist/` for static inspection. Use the development server for the local backend proxy.

## API contract and labels

`POST /api/v1/resume-reviews` receives `FormData` containing `resume` and `jobDescription`. The browser supplies the multipart boundary. A successful response must contain all six required contract fields (extra fields are ignored):

| Backend field            | UI                                    |
| ------------------------ | ------------------------------------- |
| `matchScore`             | Overall match, 0–100                  |
| `strengths`              | Your strengths                        |
| `relevantExperience`     | Relevant experience / evidence of fit |
| `missingSkills`          | Missing skills / skill gaps           |
| `missingKeywords`        | Missing keywords                      |
| `improvementSuggestions` | Actionable next steps                 |

The backend has no `matchedSkills` or `weaknesses` fields. Relevant experience represents positive alignment; missing skills and keywords represent areas to strengthen. No additional AI findings are fabricated. Empty arrays get explicit empty states.

## Behavior

- PDF selection and drag/drop, filename and size, replacement and removal.
- Empty-file, file type, 5 MiB file limit, and blank-description validation. A frontend-only 50,000-character description limit keeps the request bounded; it is not a backend rule.
- Disabled submission until valid, loading feedback, duplicate submission prevention, cancellation, retry, and full reset.
- Two-minute request timeout and runtime response validation. Backend error messages are rendered as text; network and invalid-response errors receive friendly fallbacks.
- Keyboard controls, focus management, screen-reader status, reduced-motion support, and mobile layouts.
- Inputs and results remain in memory. This app does not persist PDFs; extracted text and the description are sent through the backend to Groq.

Tests use isolated contract fixtures and intercepted fetch calls only. There is no demo data, mocked service, or fake success path in the application.

## Source layout

```text
src/
  App.tsx                         page composition and form state
  components/ui/                  reusable Button and Alert
  features/resume-review/
    api.ts                        HTTP service and response guard
    types.ts                      Java DTO-aligned TypeScript types
    validation.ts                 input validation and size formatting
    useResumeReview.ts            request lifecycle and cancellation
    components/                   upload, description, preview, results
  index.css                       Tailwind import, theme, responsive styles
  test/setup.ts                   isolated test setup
```
