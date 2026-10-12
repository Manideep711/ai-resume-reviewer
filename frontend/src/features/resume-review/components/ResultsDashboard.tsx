import { useEffect, useRef } from 'react'
import {
  ArrowRight,
  Check,
  CheckCheck,
  FileText,
  Lightbulb,
  RotateCcw,
  Target,
  BriefcaseBusiness,
  ScanText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ResumeReviewResponse } from '../types'
import { Button } from '../../../components/ui/Button'

function FindingCard({
  title,
  subtitle,
  items,
  emptyMessage,
  icon: Icon,
  variant = '',
}: {
  title: string
  subtitle: string
  items: string[]
  emptyMessage: string
  icon: LucideIcon
  variant?: string
}) {
  return (
    <section className={`finding-card ${variant}`}>
      <div className="finding-heading">
        <span className="finding-icon">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className="finding-count">{items.length}</span>
      </div>
      {items.length ? (
        <ul className="finding-list">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>
              <span className="list-dot" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="finding-empty">{emptyMessage}</p>
      )}
    </section>
  )
}

export function ResultsDashboard({
  review,
  filename,
  onReset,
}: {
  review: ResumeReviewResponse
  filename: string
  onReset: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [])
  const circumference = 2 * Math.PI * 59
  return (
    <div className="results">
      <div className="results-top">
        <div>
          <div className="eyebrow">
            <CheckCheck size={15} aria-hidden="true" /> REVIEW COMPLETE
          </div>
          <h1 ref={heading} tabIndex={-1}>
            Your next step, clearer.
          </h1>
          <p>
            Here’s how your resume aligns with the role — and where to focus
            next.
          </p>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw size={16} aria-hidden="true" /> Analyze another resume
        </Button>
      </div>
      <section
        className="score-card"
        aria-label={`Overall match score: ${review.matchScore} out of 100`}
      >
        <div className="score-ring" aria-hidden="true">
          <svg viewBox="0 0 140 140">
            <circle className="score-track" cx="70" cy="70" r="59" />
            <circle
              className="score-progress"
              cx="70"
              cy="70"
              r="59"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - review.matchScore / 100)}
            />
          </svg>
          <div>
            <strong>{review.matchScore}</strong>
            <span>OUT OF 100</span>
          </div>
        </div>
        <div className="score-description">
          <span className="score-label">OVERALL MATCH</span>
          <h2>Your alignment with this role</h2>
          <p>
            An AI assessment of the experience, skills, and keywords in your
            resume against the job description. Use it as guidance, not a hiring
            prediction.
          </p>
          <span className="reviewed-file">
            <FileText size={14} aria-hidden="true" />
            <span title={filename}>{filename}</span>
          </span>
        </div>
        <div className="score-facts">
          <div>
            <strong>{review.strengths.length}</strong>
            <span>Strengths identified</span>
          </div>
          <div>
            <strong>{review.improvementSuggestions.length}</strong>
            <span>Recommended next steps</span>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <h2>Strengths & areas to strengthen</h2>
        <span>A closer look at your fit</span>
      </div>
      <div className="findings-grid">
        <FindingCard
          title="Your strengths"
          subtitle="What works in your favor"
          items={review.strengths}
          emptyMessage="The review did not identify specific strengths."
          icon={Check}
          variant="positive"
        />
        <FindingCard
          title="Relevant experience"
          subtitle="Evidence of alignment with the role"
          items={review.relevantExperience}
          emptyMessage="The review did not identify relevant experience for this role."
          icon={BriefcaseBusiness}
          variant="positive"
        />
        <FindingCard
          title="Missing skills"
          subtitle="Skill gaps to consider addressing"
          items={review.missingSkills}
          emptyMessage="No missing skills were reported in this review."
          icon={Target}
        />
        <FindingCard
          title="Missing keywords"
          subtitle="Language your resume may be missing"
          items={review.missingKeywords}
          emptyMessage="No missing keywords were reported in this review."
          icon={ScanText}
        />
      </div>
      <section className="recommendations">
        <div className="recommendation-header">
          <span className="finding-icon">
            <Lightbulb size={20} aria-hidden="true" />
          </span>
          <div>
            <span className="eyebrow">YOUR NEXT STEPS</span>
            <h2>Turn insight into a stronger resume.</h2>
          </div>
        </div>
        {review.improvementSuggestions.length ? (
          <ol>
            {review.improvementSuggestions.map((item, index) => (
              <li key={`${index}-${item}`}>
                <span className="step-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="finding-empty">
            No improvement suggestions were returned for this review.
          </p>
        )}
        <p className="recommendation-note">
          Keep every edit honest. Add skills and experience only when they
          reflect your background.
        </p>
      </section>
      <div className="results-bottom">
        <div>
          <h3>Ready for another perspective?</h3>
          <p>Compare a different resume or target a new role.</p>
        </div>
        <Button onClick={onReset}>
          Analyze another resume <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
