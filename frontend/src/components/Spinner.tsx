interface SpinnerProps {
  /** full-screen centered (default) vs small inline */
  inline?: boolean
}

export default function Spinner({ inline = false }: SpinnerProps) {
  if (inline) {
    return <div className="spinner-sm" />
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-tg-bg">
      <div className="spinner" />
    </div>
  )
}
