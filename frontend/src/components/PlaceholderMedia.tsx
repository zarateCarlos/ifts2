type Props = {
  label: string
  aspect?: string
}

export function PlaceholderMedia({ label, aspect = '4 / 3' }: Props) {
  return (
    <div className="placeholder-media" style={{ aspectRatio: aspect }} role="img" aria-label={label}>
      <span className="placeholder-media__label">Simulación · {label}</span>
    </div>
  )
}
