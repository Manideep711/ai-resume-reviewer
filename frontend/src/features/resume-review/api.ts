import type { ResumeReviewResponse } from './types'
import { validateDescription, validateResume } from './validation'

const REVIEW_TIMEOUT_MS = 120_000
const arrayFields = [
  'strengths',
  'missingSkills',
  'improvementSuggestions',
  'relevantExperience',
  'missingKeywords',
] as const

export class ReviewApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ReviewApiError'
    this.status = status
  }
}

export function isResumeReview(value: unknown): value is ResumeReviewResponse {
  if (typeof value !== 'object' || value === null) return false
  const review = value as Record<string, unknown>
  return (
    typeof review.matchScore === 'number' &&
    Number.isInteger(review.matchScore) &&
    review.matchScore >= 0 &&
    review.matchScore <= 100 &&
    arrayFields.every(
      (field) =>
        Array.isArray(review[field]) &&
        (review[field] as unknown[]).every((item) => typeof item === 'string'),
    )
  )
}

export async function analyzeResume(
  resume: File,
  jobDescription: string,
  signal?: AbortSignal,
): Promise<ResumeReviewResponse> {
  const validationError =
    validateResume(resume) ?? validateDescription(jobDescription)
  if (validationError) throw new ReviewApiError(validationError)
  const form = new FormData()
  form.append('resume', resume)
  form.append('jobDescription', jobDescription.trim())
  const timeout = AbortSignal.timeout(REVIEW_TIMEOUT_MS)
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/v1/resume-reviews`, {
      method: 'POST',
      body: form,
      signal: requestSignal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted)
      throw new ReviewApiError(
        'The review is taking longer than expected. Please try again.',
      )
    throw new ReviewApiError(
      'We couldn’t reach the review service. Check your connection and make sure the backend is running.',
    )
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted)
      throw new ReviewApiError(
        'The review is taking longer than expected. Please try again.',
      )
    throw new ReviewApiError(
      response.ok
        ? 'The service returned an unreadable review. Please try again.'
        : 'The review service returned an unexpected error. Please try again.',
      response.status,
    )
  }
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string' &&
      payload.message.trim()
        ? payload.message
        : response.status === 413
          ? 'Your upload is too large. Choose a PDF under 5 MB.'
          : 'We couldn’t complete your review. Please try again.'
    throw new ReviewApiError(message, response.status)
  }
  if (!isResumeReview(payload))
    throw new ReviewApiError(
      'The service returned an incomplete review. Please try again.',
      response.status,
    )
  return payload
}
