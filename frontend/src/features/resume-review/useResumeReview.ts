import { useEffect, useRef, useState } from 'react'
import { analyzeResume } from './api'
import type { ResumeReviewResponse, ReviewStatus } from './types'

export function useResumeReview() {
  const [status, setStatus] = useState<ReviewStatus>('idle')
  const [review, setReview] = useState<ResumeReviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  useEffect(() => () => activeRequest.current?.abort(), [])

  async function submit(file: File, description: string) {
    if (activeRequest.current) return
    const controller = new AbortController()
    activeRequest.current = controller
    setStatus('loading')
    setError(null)
    setReview(null)
    try {
      const result = await analyzeResume(file, description, controller.signal)
      if (!controller.signal.aborted) {
        setReview(result)
        setStatus('success')
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Something went wrong. Please try again.',
        )
        setStatus('error')
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }

  function reset() {
    activeRequest.current?.abort()
    activeRequest.current = null
    setStatus('idle')
    setReview(null)
    setError(null)
  }
  return { status, review, error, submit, reset }
}
