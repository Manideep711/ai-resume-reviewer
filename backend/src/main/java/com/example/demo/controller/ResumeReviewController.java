package com.example.demo.controller;

import com.example.demo.dto.ResumeReviewResponse;
import com.example.demo.service.ResumeReviewService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/resume-reviews")
public class ResumeReviewController {
    private final ResumeReviewService resumeReviewService;

    public ResumeReviewController(ResumeReviewService resumeReviewService) {
        this.resumeReviewService = resumeReviewService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeReviewResponse reviewResume(
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam("resume") MultipartFile resume) {
        return resumeReviewService.review(jobDescription, resume);
    }
}
