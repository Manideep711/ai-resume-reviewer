import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { MAX_FILE_SIZE } from './features/resume-review/validation'

const makePdf = (name = 'resume.pdf') =>
  new File(['%PDF test'], name, { type: 'application/pdf' })
const review = {
  matchScore: 81,
  strengths: ['Java and Spring Boot'],
  missingSkills: ['Container orchestration'],
  improvementSuggestions: ['Add measurable project outcomes'],
  relevantExperience: ['Built backend REST services'],
  missingKeywords: ['Observability'],
}

async function fillForm() {
  const user = userEvent.setup()
  await user.upload(screen.getByLabelText('Your resume'), makePdf())
  await user.type(
    screen.getByLabelText('Job description'),
    'Java engineer with Spring Boot',
  )
  return user
}

describe('review workspace', () => {
  it('starts empty with analysis disabled and no fake review', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: 'Analyze resume' }),
    ).toBeDisabled()
    expect(screen.queryByText('REVIEW COMPLETE')).not.toBeInTheDocument()
  })
  it('validates dropped files and supports replacing and removing the selection', async () => {
    render(<App />)
    const input = screen.getByLabelText('Your resume')
    const zone = document.querySelector('.upload-zone')!
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [new File(['text'], 'resume.txt', { type: 'text/plain' })],
      },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('choose a PDF file')
    const oversized = makePdf('large.pdf')
    Object.defineProperty(oversized, 'size', { value: MAX_FILE_SIZE + 1 })
    fireEvent.drop(zone, { dataTransfer: { files: [oversized] } })
    expect(screen.getByRole('alert')).toHaveTextContent('too large')
    const user = userEvent.setup()
    await user.upload(input, makePdf())
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.upload(input, makePdf('revised.pdf'))
    expect(screen.getByText('revised.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove resume' }))
    expect(
      screen.getByRole('button', { name: /Drop your resume/ }),
    ).toBeInTheDocument()
  })
  it('submits once, renders all six fields, and resets for a new review', async () => {
    let resolveRequest!: (response: Response) => void
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Analyze resume' }))
    expect(
      screen.getByRole('button', { name: /Analyzing your resume/ }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Job description')).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledOnce()
    resolveRequest(new Response(JSON.stringify(review)))
    expect(
      await screen.findByRole('heading', { name: 'Your next step, clearer.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', {
        name: 'Overall match score: 81 out of 100',
      }),
    ).toBeInTheDocument()
    for (const value of Object.values(review).filter(Array.isArray).flat())
      expect(screen.getByText(value)).toBeInTheDocument()
    await user.click(
      screen.getAllByRole('button', { name: /Analyze another resume/ })[0],
    )
    expect(screen.getByLabelText('Job description')).toHaveValue('')
    expect(
      screen.getByRole('button', { name: 'Analyze resume' }),
    ).toBeDisabled()
    expect(screen.queryByText('REVIEW COMPLETE')).not.toBeInTheDocument()
  })
  it('preserves input after a service error and allows a retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Resume review failed.' }), {
          status: 500,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(review)))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Analyze resume' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Resume review failed.',
    )
    expect(screen.getByLabelText('Job description')).toHaveValue(
      'Java engineer with Spring Boot',
    )
    await user.click(screen.getByRole('button', { name: 'Analyze resume' }))
    expect(await screen.findByText('REVIEW COMPLETE')).toBeInTheDocument()
  })
  it('cancels a request and ignores a late response', async () => {
    let resolveRequest!: (response: Response) => void
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Analyze resume' }))
    await user.click(screen.getByRole('button', { name: 'Cancel review' }))
    expect(screen.getByRole('button', { name: 'Analyze resume' })).toBeEnabled()
    resolveRequest(new Response(JSON.stringify(review)))
    await waitFor(() =>
      expect(screen.queryByText('REVIEW COMPLETE')).not.toBeInTheDocument(),
    )
  })
  it('clears stale backend errors when the user corrects the input', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 400,
            message: 'Could not read this PDF.',
          }),
          { status: 400 },
        ),
      ),
    )
    render(<App />)
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Analyze resume' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not read this PDF.',
    )
    await user.upload(
      screen.getByLabelText('Your resume'),
      makePdf('corrected.pdf'),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Job description')).toHaveValue(
      'Java engineer with Spring Boot',
    )
    expect(screen.getByRole('button', { name: 'Analyze resume' })).toBeEnabled()
  })
  it('renders honest empty-array states', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            matchScore: 0,
            strengths: [],
            missingSkills: [],
            improvementSuggestions: [],
            relevantExperience: [],
            missingKeywords: [],
          }),
        ),
      ),
    )
    render(<App />)
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Analyze resume' }))
    expect(
      await screen.findByText(
        'No missing skills were reported in this review.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'No improvement suggestions were returned for this review.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Overall match score: 0 out of 100' }),
    ).toBeInTheDocument()
  })
})
