package com.example.demo;

import com.example.demo.dto.ResumeReviewResponse;
import com.example.demo.exception.AiReviewException;
import com.example.demo.service.GroqService;
import com.example.demo.support.PdfFixtures;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

// Real embedded Tomcat and real multipart/PDF handling; only the external AI service is mocked.
@ActiveProfiles("prod")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "groq.api.key=integration-test-placeholder",
        "app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173,https://portfolio.example.test"
})
class ResumeReviewIntegrationTest {
    @Test
    void healthCheckDoesNotCallTheAiService() throws Exception {
        Result result = client.get().uri("/api/health").exchange((request, response) ->
                new Result(response.getStatusCode().value(), response.getHeaders(),
                        new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8)));
        assertThat(result.status()).isEqualTo(200);
        assertThat(json.readTree(result.body()).path("status").asText()).isEqualTo("UP");
        verifyNoInteractions(groqService);
    }

    @Test
    void productionDoesNotExposeTheBillableConnectionTest() {
        Result result = client.get().uri("/api/test-groq").exchange((request, response) ->
                new Result(response.getStatusCode().value(), response.getHeaders(),
                        new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8)));
        assertThat(result.status()).isEqualTo(404);
        verifyNoInteractions(groqService);
    }

    @Value("${local.server.port}")
    private int port;

    @MockitoBean
    private GroqService groqService;

    private RestClient client;
    private final ObjectMapper json = new ObjectMapper();

    @BeforeEach
    void setUp() {
        client = RestClient.builder().baseUrl("http://127.0.0.1:" + port).build();
    }

    @Test
    void uploadsPdfExtractsTextAndReturnsTheUnwrappedSixFieldContract() throws Exception {
        when(groqService.reviewResume(anyString(), anyString())).thenReturn(new ResumeReviewResponse(
                83, List.of("Java"), List.of("Docker"), List.of("Describe project impact"),
                List.of("Built REST APIs"), List.of("CI/CD")));

        Result result = upload(parts(PdfFixtures.resume(), "application/pdf", "Java developer"), "http://localhost:5173");
        assertThat(result.status()).isEqualTo(200);
        assertThat(result.headers().getFirst("Access-Control-Allow-Origin")).isEqualTo("http://localhost:5173");
        JsonNode body = json.readTree(result.body());
        assertThat(body.size()).isEqualTo(6);
        assertThat(body.path("matchScore").asInt()).isEqualTo(83);
        for (String field : List.of("strengths", "missingSkills", "improvementSuggestions", "relevantExperience", "missingKeywords")) {
            assertThat(body.path(field).isArray()).isTrue();
        }
        verify(groqService).reviewResume(contains("Java developer"), eq("Java developer"));
    }

    @Test
    void rejectsBlankDescriptionBeforeCallingAi() throws Exception {
        assertError(upload(parts(PdfFixtures.resume(), "application/pdf", "   "), "http://localhost:5173"),
                400, "Job description cannot be empty");
        verifyNoInteractions(groqService);
    }

    @Test
    void rejectsCorruptPdfAsClientError() throws Exception {
        assertError(upload(parts("not a PDF".getBytes(StandardCharsets.UTF_8), "application/pdf", "Java"), null),
                400, "Could not read this PDF");
        verifyNoInteractions(groqService);
    }

    @Test
    void rejectsNonPdfMimeType() throws Exception {
        assertError(upload(parts(PdfFixtures.resume(), "text/plain", "Java"), null), 400, "must be a PDF");
        verifyNoInteractions(groqService);
    }

    @Test
    void rejectsPdfWithoutReadableText() throws Exception {
        assertError(upload(parts(PdfFixtures.blank(), "application/pdf", "Java"), null), 400, "No readable text");
        verifyNoInteractions(groqService);
    }

    @Test
    void rejectsEmptyFile() throws Exception {
        assertError(upload(parts(new byte[0], "application/pdf", "Java"), null), 400, "Please upload a resume PDF");
        verifyNoInteractions(groqService);
    }

    @Test
    void reportsMissingMultipartFieldsAsBadRequests() throws Exception {
        MultiValueMap<String, Object> missingResume = new LinkedMultiValueMap<>();
        missingResume.add("jobDescription", "Java");
        assertError(upload(missingResume, null), 400, "Missing required field: resume");
        MultiValueMap<String, Object> missingDescription = parts(PdfFixtures.resume(), "application/pdf", "Java");
        missingDescription.remove("jobDescription");
        assertError(upload(missingDescription, null), 400, "Missing required field: jobDescription");
        verifyNoInteractions(groqService);
    }

    @Test
    void enforcesRealServletFileLimitAndKeepsCorsOnTheError() throws Exception {
        Result result = upload(parts(new byte[5 * 1024 * 1024 + 1], "application/pdf", "Java"), "http://localhost:5173");
        assertError(result, 413, "too large");
        assertThat(result.headers().getFirst("Access-Control-Allow-Origin")).isEqualTo("http://localhost:5173");
        verifyNoInteractions(groqService);
    }

    @Test
    void reportsAiFailureWithoutLeakingUpstreamDetails() throws Exception {
        when(groqService.reviewResume(anyString(), anyString())).thenThrow(new AiReviewException(
                "The AI review service is currently unavailable. Please try again.",
                new RuntimeException("private upstream diagnostics")));
        Result result = upload(parts(PdfFixtures.resume(), "application/pdf", "Java"), "http://localhost:5173");
        assertError(result, 502, "AI review service is currently unavailable");
        assertThat(result.body()).doesNotContain("private upstream diagnostics");
        assertThat(result.headers().getFirst("Access-Control-Allow-Origin")).isEqualTo("http://localhost:5173");
    }

    @Test
    void allowsConfiguredProductionPreflight() {
        Result result = client.options().uri("/api/v1/resume-reviews")
                .header("Origin", "https://portfolio.example.test")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type")
                .exchange((request, response) -> new Result(response.getStatusCode().value(), response.getHeaders(),
                        new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8)));
        assertThat(result.status()).isEqualTo(200);
        assertThat(result.headers().getFirst("Access-Control-Allow-Origin")).isEqualTo("https://portfolio.example.test");
        assertThat(result.headers().getFirst("Access-Control-Allow-Methods")).contains("POST");
        assertThat(result.headers().getFirst("Access-Control-Allow-Credentials")).isNull();
    }

    @Test
    void rejectsUnconfiguredOriginBeforeCallingAi() throws Exception {
        Result result = upload(parts(PdfFixtures.resume(), "application/pdf", "Java"), "https://untrusted.example.test");
        assertThat(result.status()).isEqualTo(403);
        assertThat(result.headers().getFirst("Access-Control-Allow-Origin")).isNull();
        verifyNoInteractions(groqService);
    }

    @Test
    void rejectsJsonInsteadOfMultipart() throws Exception {
        Result result = client.post().uri("/api/v1/resume-reviews").contentType(MediaType.APPLICATION_JSON)
                .body("{}").exchange((request, response) -> new Result(response.getStatusCode().value(), response.getHeaders(),
                        new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8)));
        assertError(result, 415, "multipart/form-data");
        verifyNoInteractions(groqService);
    }

    private MultiValueMap<String, Object> parts(byte[] pdf, String mime, String description) {
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(mime));
        ByteArrayResource resource = new ByteArrayResource(pdf) {
            @Override public String getFilename() { return "resume.pdf"; }
        };
        parts.add("resume", new HttpEntity<>(resource, headers));
        parts.add("jobDescription", description);
        return parts;
    }

    private Result upload(MultiValueMap<String, Object> parts, String origin) {
        RestClient.RequestBodySpec request = client.post().uri("/api/v1/resume-reviews")
                .contentType(MediaType.MULTIPART_FORM_DATA);
        if (origin != null) request.header("Origin", origin);
        // Spring's form converter supplies the boundary for this actual HTTP test.
        return request.body(parts).exchange((sent, response) -> new Result(response.getStatusCode().value(),
                response.getHeaders(), new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8)));
    }

    private void assertError(Result result, int status, String message) throws Exception {
        assertThat(result.status()).isEqualTo(status);
        JsonNode body = json.readTree(result.body());
        assertThat(body.size()).isEqualTo(4);
        assertThat(body.path("timestamp").isTextual()).isTrue();
        assertThat(body.path("status").asInt()).isEqualTo(status);
        assertThat(body.path("error").isTextual()).isTrue();
        assertThat(body.path("message").asText()).contains(message);
    }

    private record Result(int status, HttpHeaders headers, String body) {}
}
