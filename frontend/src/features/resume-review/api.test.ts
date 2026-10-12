import { describe, expect, it, vi } from 'vitest'
import { analyzeResume } from './api'

// Contract fixture used only in tests; the application has no mock response path.
const review = {
  matchScore: 76,
  strengths: ['Java'],
  missingSkills: ['Kubernetes'],
  improvementSuggestions: ['Quantify project impact'],
  relevantExperience: ['REST API development'],
  missingKeywords: [],
}
const resume = new File(['%PDF-1.7 test'], 'resume.pdf', {
  type: 'application/pdf',
})

describe('review API contract', () => {
  it('rejects empty descriptions before making a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(analyzeResume(resume, '   ')).rejects.toThrow(
      'Paste the job description',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('rejects invalid PDFs before making a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      analyzeResume(
        new File(['text'], 'resume.txt', { type: 'text/plain' }),
        'Java',
      ),
    ).rejects.toThrow('choose a PDF')
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('preserves the safe AI failure message and status from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            timestamp: '2026-10-12T18:00:00Z',
            status: 502,
            error: 'Bad Gateway',
            message:
              'The AI review service is currently unavailable. Please try again.',
          }),
          { status: 502 },
        ),
      ),
    )
    await expect(analyzeResume(resume, 'Java')).rejects.toMatchObject({
      status: 502,
      message:
        'The AI review service is currently unavailable. Please try again.',
    })
  })
  it('reports request timeouts clearly', async () => {
    const timeoutError = new DOMException('Request timed out', 'TimeoutError')
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(
      AbortSignal.abort(timeoutError),
    )
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError))
    await expect(analyzeResume(resume, 'Java')).rejects.toThrow(
      'taking longer than expected',
    )
  })
  it('preserves caller cancellation without presenting a network error', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(controller.signal.reason))
    await expect(analyzeResume(resume, 'Java', controller.signal)).rejects.toBe(
      controller.signal.reason,
    )
  })
  it('posts the exact multipart fields to the configured backend without a manual Content-Type', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.test/')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(review), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(analyzeResume(resume, '  Java engineer  ')).resolves.toEqual(
      review,
    )
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://backend.example.test/api/v1/resume-reviews')
    expect(options.method).toBe('POST')
    expect(options.headers).toBeUndefined()
    expect(options.body.get('resume')).toBe(resume)
    expect(options.body.get('jobDescription')).toBe('Java engineer')
    expect([...options.body.keys()]).toEqual(['resume', 'jobDescription'])
  })
  it('uses the development proxy when the base URL is empty', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(review)))
    vi.stubGlobal('fetch', fetchMock)
    await analyzeResume(resume, 'Java engineer')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/resume-reviews')
  })
  it('shows the backend validation error instead of treating it as a review', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 400,
            error: 'Bad Request',
            message: 'No readable text found in the PDF.',
          }),
          { status: 400 },
        ),
      ),
    )
    await expect(analyzeResume(resume, 'Java')).rejects.toThrow(
      'No readable text found in the PDF.',
    )
  })
  it.each([
    { ...review, matchScore: 101 },
    { ...review, matchScore: '76' },
    { ...review, strengths: [null] },
    { ...review, missingSkills: null },
    { matchScore: 76 },
  ])('rejects a malformed successful response: %j', async (payload) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))),
    )
    await expect(analyzeResume(resume, 'Java')).rejects.toThrow(
      'incomplete review',
    )
  })
  it('handles non-JSON gateway failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Bad gateway</html>', { status: 502 }),
        ),
    )
    await expect(analyzeResume(resume, 'Java')).rejects.toThrow(
      'unexpected error',
    )
  })
  it('handles a network failure without returning fabricated results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )
    await expect(analyzeResume(resume, 'Java')).rejects.toThrow(
      'couldn’t reach',
    )
  })
})
