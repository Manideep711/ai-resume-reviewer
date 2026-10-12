import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Focus,
  Layers2,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import { Button } from './components/ui/Button'
import { Alert } from './components/ui/Alert'
import { JobDescriptionInput } from './features/resume-review/components/JobDescriptionInput'
import { ResumeUploader } from './features/resume-review/components/ResumeUploader'
import { ReviewPreview } from './features/resume-review/components/ReviewPreview'
import { ResultsDashboard } from './features/resume-review/components/ResultsDashboard'
import { useResumeReview } from './features/resume-review/useResumeReview'
import {
  validateDescription,
  validateResume,
} from './features/resume-review/validation'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const { status, review, error, submit, reset } = useResumeReview()
  const loading = status === 'loading'
  const canSubmit =
    !loading &&
    !fileError &&
    file !== null &&
    !validateResume(file) &&
    !validateDescription(description)
  function resetForm() {
    reset()
    setFile(null)
    setDescription('')
    setFileError(null)
    setDescriptionError(null)
    requestAnimationFrame(() =>
      document.getElementById('analysis-heading')?.focus(),
    )
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFileError = validateResume(file)
    const nextDescriptionError = validateDescription(description)
    setFileError(nextFileError)
    setDescriptionError(nextDescriptionError)
    if (nextFileError || nextDescriptionError || !file || loading) return
    void submit(file, description)
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#main" aria-label="Align home">
            <span className="brand-symbol">
              <Layers2 size={21} strokeWidth={1.8} aria-hidden="true" />
            </span>
            align
            <span className="brand-divider" />
            <span className="brand-caption">RESUME INTELLIGENCE</span>
          </a>
          <nav aria-label="Main navigation">
            <a
              href="#how-it-works"
              onClick={() => {
                if (review) resetForm()
              }}
            >
              How it works <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <span className="header-tag">
              <span className="status-dot" /> Built for your next move
            </span>
          </nav>
        </div>
      </header>
      <main id="main" className="main-container">
        {status === 'success' && review ? (
          <ResultsDashboard
            review={review}
            filename={file?.name ?? 'Resume PDF'}
            onReset={resetForm}
          />
        ) : (
          <>
            <section className="hero">
              <div className="eyebrow">
                <span className="hero-badge">
                  <Sparkles size={12} aria-hidden="true" /> A LITTLE CLARITY
                  GOES A LONG WAY
                </span>
              </div>
              <h1>
                Good experience deserves
                <br />a <span>better match.</span>
              </h1>
              <p>
                See your resume through the lens of your next role.
                <br className="desktop-break" /> Get focused feedback and a
                clear path to a stronger application.
              </p>
            </section>
            <div className="workspace-grid">
              <section
                className="analysis-card"
                aria-labelledby="analysis-heading"
              >
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">LET’S FIND YOUR FIT</span>
                    <h2 id="analysis-heading" tabIndex={-1}>
                      Start with your resume.
                    </h2>
                  </div>
                  <span className="card-step">01 / 02</span>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <ResumeUploader
                    file={file}
                    onChange={(nextFile) => {
                      setFile(nextFile)
                      if (status === 'error') reset()
                    }}
                    error={fileError}
                    onError={setFileError}
                    disabled={loading}
                  />
                  <JobDescriptionInput
                    value={description}
                    onChange={(value) => {
                      setDescription(value)
                      setDescriptionError(validateDescription(value))
                      if (status === 'error') reset()
                    }}
                    error={descriptionError}
                    disabled={loading}
                  />
                  {error && (
                    <Alert title="We couldn’t complete your review">
                      {error}
                    </Alert>
                  )}
                  <div className="submit-section">
                    <Button
                      type="submit"
                      className="analyze-button"
                      disabled={!canSubmit}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="spin"
                            aria-hidden="true"
                          />{' '}
                          Analyzing your resume…
                        </>
                      ) : (
                        <>
                          <span>Analyze resume</span>
                          <ArrowRight size={18} aria-hidden="true" />
                        </>
                      )}
                    </Button>
                    {loading ? (
                      <Button variant="ghost" onClick={reset}>
                        Cancel review
                      </Button>
                    ) : (
                      <p className="submit-help">
                        {error
                          ? 'Try again, or update your resume and job description.'
                          : canSubmit
                            ? 'You’re all set. Let’s take a closer look.'
                            : 'Add your resume and a job description to begin.'}
                      </p>
                    )}
                    <span className="sr-only" role="status" aria-live="polite">
                      {loading
                        ? 'Analysis in progress. Your results will appear when ready.'
                        : ''}
                    </span>
                  </div>
                </form>
                <div className="privacy-note">
                  <LockKeyhole size={14} aria-hidden="true" />
                  <p>
                    Your PDF isn’t stored by this app. Extracted text and the
                    job description are sent to Groq for analysis.
                  </p>
                </div>
              </section>
              <ReviewPreview loading={loading} />
            </div>
            <section
              className="how-it-works"
              id="how-it-works"
              aria-labelledby="how-heading"
            >
              <div className="how-title">
                <span className="eyebrow">FROM UPLOAD TO INSIGHT</span>
                <h2 id="how-heading">
                  A thoughtful review.
                  <br />
                  In three simple steps.
                </h2>
              </div>
              <div className="how-step">
                <span className="how-icon">
                  <FileText size={20} aria-hidden="true" />
                </span>
                <span className="step-caption">01 · ADD YOUR CONTEXT</span>
                <h3>Your resume. Your next role.</h3>
                <p>
                  Upload a PDF and paste the job description you’re considering.
                </p>
              </div>
              <div className="how-step">
                <span className="how-icon">
                  <Focus size={20} aria-hidden="true" />
                </span>
                <span className="step-caption">02 · SEE THE ALIGNMENT</span>
                <h3>Find the strengths and gaps.</h3>
                <p>
                  Understand how your experience connects with the role’s
                  requirements.
                </p>
              </div>
              <div className="how-step">
                <span className="how-icon">
                  <Check size={20} aria-hidden="true" />
                </span>
                <span className="step-caption">03 · MOVE FORWARD</span>
                <h3>Make your next edit count.</h3>
                <p>
                  Use practical recommendations to refine your application with
                  intention.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <span className="footer-brand">align</span>
          <span>A clearer path to your next role.</span>
        </div>
        <span>Made for thoughtful career moves.</span>
      </footer>
    </div>
  )
}
export default App
