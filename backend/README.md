# AI Resume Reviewer

Spring Boot API that accepts a PDF resume and a job description, extracts PDF text using PDFBox,
asks Groq to evaluate the match, and returns structured JSON.

## Requirements
- Java 26 (or adjust java.version in pom.xml to a JDK supported by your Spring Boot version)
- Maven
- Groq API key

## Configure
Set GROQ_API_KEY in IntelliJ: Run > Edit Configurations > Environment variables.
Never commit or share the key.

Model configuration is in src/main/resources/application.properties. If Groq reports model_not_found,
choose a currently available model at https://console.groq.com/docs/models.

`CORS_ALLOWED_ORIGINS` is a comma-separated list of exact frontend origins. It defaults to
`http://localhost:5173,http://127.0.0.1:5173`. For production, set it to your deployed frontend origin,
such as `https://your-frontend.example` (replace this example). Setting the variable replaces the defaults.
An empty list disables cross-origin access. CORS applies only to the review endpoint, allows POST/OPTIONS,
and does not enable credentials. The filter runs before multipart parsing so upload errors also carry CORS headers.

Environment examples are documentation only; Spring Boot does not automatically load `.env` files.

## Run
Open as a Maven project in IntelliJ and run ResumeReviewerApplication.

## Test connection
GET http://localhost:8080/api/test-groq

This billable test endpoint is disabled with the `prod` profile. `GET /api/health`
returns readiness without calling Groq. See the repository's `DEPLOYMENT.md` for hosting setup.

## Review a resume
POST http://localhost:8080/api/v1/resume-reviews
Use multipart/form-data fields:
- resume: PDF file
- jobDescription: target job description

Example:
curl -X POST http://localhost:8080/api/v1/resume-reviews -F "resume=@resume.pdf" -F "jobDescription=Java developer with Spring Boot and REST API experience"

The response contains matchScore, strengths, missingSkills, improvementSuggestions,
relevantExperience, and missingKeywords.

## Error contract

Errors keep the existing JSON fields: `timestamp`, `status`, `error`, and `message`.

- 400: empty/missing inputs, non-PDF MIME type, damaged/password-protected PDF, or no readable text.
- 413: file over 5 MiB or multipart request over 6 MiB.
- 415: a request that is not multipart/form-data.
- 502: AI service/network failure or unreadable/incomplete AI response. Upstream details are not returned.
- 500: other unexpected application failures.

Previously, missing fields, damaged PDFs, and AI failures could become generic 500 errors. These statuses
are now specific while preserving the endpoint, multipart field names, success DTO, and error JSON shape.
Tomcat's upload-drain limit is 6 MiB so bounded rejected uploads can receive their 413 JSON response.

## Verify

```text
mvn verify
```

Tests run without a real Groq key: real embedded Tomcat tests exercise multipart uploads, PDF extraction,
response serialization, validation, servlet upload limits, and local/production CORS. Provider tests use
a loopback HTTP server to verify Groq parsing and safe AI failure handling. No tests call the real Groq API.

PDFs are processed in memory, not stored. Scanned PDFs require OCR, which is not included.
Before public deployment, add authentication, rate limiting, and stronger file validation.
