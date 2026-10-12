# Deployment: Render and Vercel

Deploy the backend first, verify its logs and health endpoint, then deploy the frontend.
Local builds passing does not establish that either hosted application works.

## Render backend

Create a Web Service connected to this GitHub repository:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Language | Docker |
| Root directory | `backend` |
| Dockerfile path | `./Dockerfile` |
| Docker build context | `.` (relative to root directory) |
| Health check path | `/api/health` |
| Docker command override | Leave empty |

The Dockerfile builds with Java 26 using `mvn -B -ntp verify`, including backend tests.
It starts `java -XX:MaxRAMPercentage=65.0 -Djava.awt.headless=true -jar /app/app.jar`
as a non-root user. Render Docker services use the Dockerfile rather than native build/start fields.
The server binds to `0.0.0.0` and `${PORT:8080}`; Render assigns `PORT` automatically.

Enter `GROQ_API_KEY` directly into Render's environment settings. Never put it in GitHub,
the Dockerfile, build arguments, frontend variables, screenshots, or chat.
The container sets `SPRING_PROFILES_ACTIVE=prod`. Production defaults to no cross-origin access.
After Vercel supplies the frontend URL, set `CORS_ALLOWED_ORIGINS` to its exact HTTPS origin,
without a path or trailing slash. Multiple approved origins can be comma-separated.
Do not allow every Vercel preview domain; add only explicitly intended origins.

Wait for a successful container build, application startup and healthy service logs.
Then check `GET https://YOUR-BACKEND.onrender.com/api/health`: expect `200` and
`{"status":"UP"}`. Health does not contact Groq. `/api/test-groq` is disabled in production.

## Vercel frontend (after backend verification)

Import the same repository with root directory `frontend`, framework Vite,
build command `npm run build`, and output directory `dist`.
Set `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com` in the intended deployment environments.
It is public configuration, not a secret. Do not append `/api/v1/resume-reviews`.
Vite embeds this value at build time, so redeploy after changing it.
Add the resulting frontend origin to Render's `CORS_ALLOWED_ORIGINS`, and wait for
the backend to restart successfully before testing uploads.

## Live verification checklist

- Confirm both deployment logs succeed and the backend health URL returns 200.
- From the deployed frontend, upload a text-based PDF and supply a job description.
- Inspect the request: POST `/api/v1/resume-reviews`, multipart fields `resume` and
  `jobDescription`, with a browser-generated boundary. It goes directly to Render.
- Confirm loading appears and the real six-field response renders successfully.
- Confirm the allowed frontend origin passes OPTIONS; an unapproved origin fails CORS.
- Check empty description, non-PDF, corrupt/encrypted PDF, and an oversized upload.
- Check safe errors for network failure and AI provider failure; never expose credentials
  or provider request headers in logs copied for troubleshooting.
- Confirm reset/replace/retry works. Health alone does not verify Groq or response parsing.

## Limits and costs

The application accepts PDFs up to 5 MiB and multipart requests up to 6 MiB.
Browser requests time out after 120 seconds. The backend currently has no explicitly configured
Groq read timeout; a browser timeout does not guarantee the provider request was cancelled.
Render cold starts can consume much of that window; open the health endpoint before a demo.
This frontend uses direct browser-to-backend uploads, not a Vercel Function upload proxy.

[Render Free services](https://render.com/docs/free) sleep after 15 minutes idle,
typically need about a minute to wake, share 750 free instance hours per workspace monthly,
and have ephemeral filesystems and usage quotas. Render recommends paid services for production.
For a portfolio demo, Free may suffice; for reliable availability, check the current paid
instance price in the dashboard before choosing. Bandwidth/build usage and Groq usage are separate.
[Vercel Hobby](https://vercel.com/docs/plans/hobby) is free for personal, non-commercial use
within its quotas. Commercial use requires an appropriate plan.
[Groq rate limits](https://console.groq.com/docs/rate-limits) depend on model and account;
exhausted quota can produce an AI error. Check your account's applicable pricing and limits.
A public review endpoint can spend your Groq quota; add authentication/rate limits before
promoting it beyond a controlled portfolio demo.

## Verification performed locally

Frontend lint, 22 tests and production build pass. Backend `mvn verify` passes 20 tests.
Tests use mock provider responses and do not require a real API key.
Docker image tags were verified, but the local Docker engine was unavailable, so the
container build remains to be confirmed by Render logs or a local Docker build.

References: [Render Docker](https://render.com/docs/docker),
[port binding](https://render.com/docs/web-services#port-binding),
[health checks](https://render.com/docs/health-checks),
[Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
