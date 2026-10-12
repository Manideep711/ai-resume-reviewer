import {
  ArrowUpRight,
  Check,
  CircleDashed,
  ListChecks,
  LoaderCircle,
  Target,
} from 'lucide-react'
export function ReviewPreview({ loading }: { loading: boolean }) {
  return (
    <aside
      className="preview-card"
      aria-label="Review overview"
      aria-busy={loading}
    >
      <div className="eyebrow">
        <span className="status-dot" />
        {loading ? 'ANALYSIS IN PROGRESS' : 'BUILT FOR YOUR NEXT CHAPTER'}
      </div>
      <h2>
        {loading ? (
          'Finding the fit.'
        ) : (
          <>
            A clearer picture.
            <br />A stronger application.
          </>
        )}
      </h2>
      <p className="preview-intro">
        {loading
          ? 'Reading your resume and comparing it with the role. Your review will appear here when it’s ready.'
          : 'Understand where you stand, what’s missing, and what to improve before you apply.'}
      </p>
      <div className="preview-report" aria-hidden="true">
        <div className="preview-report-top">
          <span>YOUR PERSONALIZED REVIEW</span>
          <ArrowUpRight size={16} />
        </div>
        <div className="preview-score">
          <div className="empty-score">
            {loading ? (
              <LoaderCircle className="spin" size={26} />
            ) : (
              <CircleDashed size={37} strokeWidth={1.2} />
            )}
          </div>
          <div>
            <strong>
              {loading ? 'Reviewing your resume' : 'Overall match'}
            </strong>
            <span>
              {loading
                ? 'This may take a minute or two'
                : 'Your alignment with the role'}
            </span>
          </div>
        </div>
        <div className="preview-row">
          <span className="small-icon">
            <Check size={16} />
          </span>
          <div>
            <strong>Strengths & experience</strong>
            <span>See what already works in your favor</span>
          </div>
        </div>
        <div className="preview-row">
          <span className="small-icon">
            <Target size={16} />
          </span>
          <div>
            <strong>Skills & keyword gaps</strong>
            <span>Find opportunities to strengthen your fit</span>
          </div>
        </div>
        <div className="preview-row">
          <span className="small-icon">
            <ListChecks size={16} />
          </span>
          <div>
            <strong>Actionable next steps</strong>
            <span>Make improvements with a clear direction</span>
          </div>
        </div>
      </div>
      <div className="preview-note">
        {loading
          ? 'You can cancel the review at any time.'
          : 'No guesswork. Just a more informed next step.'}
      </div>
    </aside>
  )
}
