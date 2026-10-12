# AI Resume Reviewer — integrated application

The existing Spring Boot backend is in `backend/`; the React/Vite/TypeScript/Tailwind frontend is in `frontend/`. The endpoint and its six-field review DTO are preserved.

For staged Render and Vercel setup, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Run locally on this Windows machine

Use two PowerShell terminals. If the backend is already running in IntelliJ, reuse it or stop it before launching another server on port 8080. The commands below use the installed JDK 26 and IntelliJ's bundled Maven, since neither is on the shell PATH.

Terminal 1 — backend:

```powershell
Set-Location 'C:\Users\manid\Downloads\resume-reviewer\backend'
$env:JAVA_HOME = 'C:\Users\manid\.jdks\openjdk-26'
$maven = 'C:\Program Files\JetBrains\IntelliJ IDEA 2026.1\plugins\maven\lib\maven3\bin\mvn.cmd'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
if (-not $env:GROQ_API_KEY) {
    $secureGroqKey = Read-Host 'Groq API key' -AsSecureString
    $env:GROQ_API_KEY = [System.Net.NetworkCredential]::new('', $secureGroqKey).Password
    $secureGroqKey.Dispose()
}
& $maven spring-boot:run
```

The key is entered without echo and stays in the backend terminal's environment. Do not add it to frontend configuration. Closing the terminal discards that process environment.

Terminal 2 — frontend:

```powershell
Set-Location 'C:\Users\manid\Downloads\resume-reviewer\frontend'
npm ci
if (-not (Test-Path -LiteralPath '.env.local')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
npm run dev
```

Open `http://localhost:5173`. The example sets `VITE_API_BASE_URL=http://localhost:8080`; the browser calls Spring directly using CORS. If `.env.local` already exists, make sure that public base URL is configured there. Restart Vite after environment changes. Port 5173 is fixed; stop another process using it rather than silently switching origins.

## Production environment

On the backend, set `GROQ_API_KEY` through the deployment's secret/environment settings and set `CORS_ALLOWED_ORIGINS` to the actual deployed frontend origin. For example, replace `https://your-frontend.example` with the real origin; do not include a path. Multiple origins are comma-separated. This variable replaces the local defaults, and an empty value disables cross-origin access.

On the frontend build, set `VITE_API_BASE_URL` to the public HTTPS backend origin, without `/api`. Alternatively, leave it empty and use a same-origin reverse proxy for `/api`. All `VITE_` variables are public. Neither the source nor the browser should contain the Groq key.

## Verification commands

Backend (no real key needed for these tests):

```powershell
Set-Location 'C:\Users\manid\Downloads\resume-reviewer\backend'
$env:JAVA_HOME = 'C:\Users\manid\.jdks\openjdk-26'
& 'C:\Program Files\JetBrains\IntelliJ IDEA 2026.1\plugins\maven\lib\maven3\bin\mvn.cmd' verify
```

Frontend:

```powershell
Set-Location 'C:\Users\manid\Downloads\resume-reviewer\frontend'
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Check CORS without a Groq request:

```powershell
$corsResponse = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/resume-reviews' -Method Options -Headers @{
    Origin = 'http://localhost:5173'
    'Access-Control-Request-Method' = 'POST'
    'Access-Control-Request-Headers' = 'content-type'
}
$corsResponse.StatusCode
$corsResponse.Headers['Access-Control-Allow-Origin']
```

Expected: status 200 and the exact requesting frontend origin. An unconfigured origin should be rejected.

## Integration checklist

- [ ] Open the frontend at the configured local origin; ensure the backend listens at the configured base URL.
- [ ] Upload one readable PDF under 5 MiB and paste a non-empty description. Analyze stays disabled until both inputs are valid.
- [ ] Analyze shows loading, disables duplicate submissions and input changes, and offers cancellation.
- [ ] In browser Network tools, the POST goes to `/api/v1/resume-reviews`; FormData contains `resume` and `jobDescription`; Content-Type includes the browser-generated boundary.
- [ ] A successful response displays `matchScore`, `strengths`, `relevantExperience`, `missingSkills`, `missingKeywords`, and `improvementSuggestions`; empty arrays show empty states.
- [ ] Analyze another resume clears the previous inputs/results and returns focus to the form.
- [ ] Non-PDF, empty, oversized files and blank descriptions produce local validation errors.
- [ ] A damaged `.pdf` with PDF MIME type reaches the backend and shows its readable 400 error, without losing the description.
- [ ] Backend tests verify missing fields (400), true server upload limits (413), unsupported request format (415), and AI failures (502), with the unchanged error JSON shape.
- [ ] Stop the backend temporarily and submit valid inputs: a network error appears, inputs remain, and retry works after restart.
- [ ] Production preflight accepts only the configured production origin; no Groq key or upstream diagnostics appear in browser responses.

Further details: [backend README](backend/README.md) and [frontend README](frontend/README.md).
