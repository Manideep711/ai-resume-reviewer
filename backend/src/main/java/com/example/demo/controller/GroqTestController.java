package com.example.demo.controller;

import com.example.demo.service.GroqService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.context.annotation.Profile;

@RestController
@Profile("!prod")
public class GroqTestController {
    private final GroqService groqService;

    public GroqTestController(GroqService groqService) {
        this.groqService = groqService;
    }

    @GetMapping("/api/test-groq")
    public String testGroq() {
        return groqService.testConnection();
    }
}
