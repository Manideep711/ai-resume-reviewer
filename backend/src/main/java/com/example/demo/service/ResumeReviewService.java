package com.example.demo.service;

import com.example.demo.dto.ResumeReviewResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ResumeReviewService {
    private final PdfExtractionService pdfExtractionService;
    private final GroqService groqService;

    public ResumeReviewService(PdfExtractionService pdfExtractionService, GroqService groqService) {
        this.pdfExtractionService = pdfExtractionService;
        this.groqService = groqService;
    }

    public ResumeReviewResponse review(String jobDescription, MultipartFile resume) {
        if (jobDescription == null || jobDescription.isBlank()) {
            throw new IllegalArgumentException("Job description cannot be empty");
        }
        if (resume == null || resume.isEmpty()) {
            throw new IllegalArgumentException("Please upload a resume PDF");
        }
        try {
            String resumeText = pdfExtractionService.extractText(resume);
            return groqService.reviewResume(resumeText, jobDescription);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to extract resume text", e);
        }
    }
}
