export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_DESCRIPTION_LENGTH = 50_000

export function validateResume(file: File | null): string | null {
  if (!file) return 'Choose a PDF resume to continue.'
  if (
    !file.name.toLowerCase().endsWith('.pdf') ||
    (file.type && file.type !== 'application/pdf')
  ) {
    return 'Please choose a PDF file. Other file formats are not supported.'
  }
  if (file.size === 0) return 'This file is empty. Please choose another PDF.'
  if (file.size > MAX_FILE_SIZE)
    return 'Your PDF is too large. Choose a file under 5 MB.'
  return null
}

export function validateDescription(value: string): string | null {
  if (!value.trim()) return 'Paste the job description to continue.'
  if (value.length > MAX_DESCRIPTION_LENGTH)
    return 'Keep the job description within 50,000 characters.'
  return null
}

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
