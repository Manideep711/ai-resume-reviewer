import { useRef, useState } from 'react'
import { FileText, Upload, X, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { formatFileSize, validateResume } from '../validation'

interface ResumeUploaderProps {
  file: File | null
  onChange: (file: File | null) => void
  error: string | null
  onError: (error: string | null) => void
  disabled?: boolean
}

export function ResumeUploader({
  file,
  onChange,
  error,
  onError,
  disabled = false,
}: ResumeUploaderProps) {
  const input = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)
  function selectFiles(files: FileList | null) {
    if (disabled || !files?.length) return
    if (files.length !== 1) {
      onError('Choose one resume PDF at a time.')
      return
    }
    const nextFile = files[0]
    const validation = validateResume(nextFile)
    onError(validation)
    if (!validation) onChange(nextFile)
  }
  return (
    <div>
      <div className="field-heading">
        <label htmlFor="resume-file">Your resume</label>
        <span>PDF only · up to 5 MB</span>
      </div>
      <input
        ref={input}
        id="resume-file"
        className="sr-only"
        type="file"
        accept=".pdf,application/pdf"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? 'resume-error resume-help' : 'resume-help'}
        onChange={(event) => {
          selectFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <div
        className={`upload-zone ${dragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) {
            dragDepth.current++
            setDragging(true)
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (!dragDepth.current) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          dragDepth.current = 0
          setDragging(false)
          selectFiles(event.dataTransfer.files)
        }}
      >
        {file ? (
          <div className="selected-file">
            <div className="file-icon">
              <FileText size={24} aria-hidden="true" />
              <span>PDF</span>
            </div>
            <div className="file-details">
              <strong title={file.name}>{file.name}</strong>
              <span>{formatFileSize(file.size)} · Ready to review</span>
            </div>
            <button
              className="icon-button"
              type="button"
              disabled={disabled}
              aria-label="Remove resume"
              onClick={() => {
                onChange(null)
                onError(null)
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <Button
              variant="ghost"
              className="replace-button"
              disabled={disabled}
              onClick={() => input.current?.click()}
            >
              <RefreshCw size={14} aria-hidden="true" /> Replace file
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="upload-trigger"
            disabled={disabled}
            onClick={() => input.current?.click()}
            aria-describedby="resume-help"
          >
            <span className="upload-icon">
              <Upload size={23} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <strong>Drop your resume here</strong>
            <span>
              or <span className="browse-link">browse files</span> to upload
            </span>
          </button>
        )}
      </div>
      <p className="field-help" id="resume-help">
        Use a text-based PDF. Scanned documents aren’t supported.
      </p>
      {error && (
        <p className="field-error" id="resume-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
