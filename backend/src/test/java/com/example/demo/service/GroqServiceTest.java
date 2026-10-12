package com.example.demo.service;

import com.example.demo.exception.AiReviewException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GroqServiceTest {
    private HttpServer provider;
    private GroqService service;
    private int providerStatus = 200;
    private String providerBody = "{}";
    private final ObjectMapper json = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        provider = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        provider.createContext("/chat/completions", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] bytes = providerBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(providerStatus, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        provider.start();
        service = new GroqService("http://127.0.0.1:" + provider.getAddress().getPort(),
                "unit-test-placeholder", "test-model", json);
    }

    @AfterEach
    void tearDown() { provider.stop(0); }

    @Test
    void parsesActualProviderEnvelopeIntoTheExistingDto() throws Exception {
        providerBody = envelope("""
                {"matchScore":75,"strengths":["Java"],"missingSkills":[],"improvementSuggestions":[],
                "relevantExperience":["REST APIs"],"missingKeywords":[]}
                """);
        assertThat(service.reviewResume("Java developer", "Java role").matchScore()).isEqualTo(75);
    }

    @Test
    void wrapsUpstreamHttpErrorsWithASafeMessage() {
        providerStatus = 429;
        providerBody = "private upstream diagnostics";
        assertThatThrownBy(() -> service.reviewResume("Java", "Java role"))
                .isInstanceOf(AiReviewException.class)
                .hasMessage("The AI review service is currently unavailable. Please try again.");
    }

    @Test
    void wrapsNetworkErrorsAsAiServiceFailures() {
        provider.stop(0);
        assertThatThrownBy(() -> service.reviewResume("Java", "Java role"))
                .isInstanceOf(AiReviewException.class).hasMessageContaining("currently unavailable");
    }

    @Test
    void rejectsInvalidJsonFromTheProvider() throws Exception {
        providerBody = envelope("not JSON");
        assertThatThrownBy(() -> service.reviewResume("Java", "Java role"))
                .isInstanceOf(AiReviewException.class).hasMessageContaining("unreadable review");
    }

    @Test
    void rejectsMissingReviewContent() {
        assertThatThrownBy(() -> service.reviewResume("Java", "Java role"))
                .isInstanceOf(AiReviewException.class).hasMessageContaining("empty review");
    }

    @Test
    void rejectsIncompleteReviewFields() throws Exception {
        providerBody = envelope("{\"matchScore\":75}");
        assertThatThrownBy(() -> service.reviewResume("Java", "Java role"))
                .isInstanceOf(AiReviewException.class).hasMessageContaining("invalid review");
    }

    private String envelope(String content) throws Exception {
        return json.writeValueAsString(Map.of("choices", List.of(Map.of("message", Map.of("content", content)))));
    }
}
