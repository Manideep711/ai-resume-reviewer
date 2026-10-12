package com.example.demo.dto;

import java.util.List;

public record ResumeReviewResponse(
        int matchScore,
        List<String> strengths,
        List<String> missingSkills,
        List<String> improvementSuggestions,
        List<String> relevantExperience,
        List<String> missingKeywords
) {}
