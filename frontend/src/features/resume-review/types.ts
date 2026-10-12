export interface ResumeReviewResponse {
  matchScore: number
  strengths: string[]
  missingSkills: string[]
  improvementSuggestions: string[]
  relevantExperience: string[]
  missingKeywords: string[]
}

export interface ApiErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
}

export type ReviewStatus = 'idle' | 'loading' | 'success' | 'error'
