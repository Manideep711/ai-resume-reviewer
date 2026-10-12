import { MAX_DESCRIPTION_LENGTH } from '../validation'
interface JobDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  error: string | null
  disabled?: boolean
}
export function JobDescriptionInput({
  value,
  onChange,
  error,
  disabled,
}: JobDescriptionInputProps) {
  return (
    <div>
      <div className="field-heading">
        <label htmlFor="job-description">Job description</label>
        <span>What’s the role you have in mind?</span>
      </div>
      <textarea
        id="job-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={
          error ? 'description-error description-help' : 'description-help'
        }
        placeholder="Paste the job description here. Include the responsibilities, required skills, and qualifications for the most useful review."
        className={error ? 'has-error' : ''}
      />
      <div className="textarea-footer">
        <span id="description-help">
          A little context makes a better review.
        </span>
        <span
          className={value.length > MAX_DESCRIPTION_LENGTH ? 'field-error' : ''}
        >
          {value.length.toLocaleString()} /{' '}
          {MAX_DESCRIPTION_LENGTH.toLocaleString()}
        </span>
      </div>
      {error && (
        <p className="field-error" id="description-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
