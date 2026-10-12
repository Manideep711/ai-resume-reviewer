import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
export function Alert({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="alert" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}
