import type { NewsItem } from '../data/site'
import { EventSplitCard } from './EventSplitCard'

const WEEKDAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

/** “Semana del lunes X al domingo Y” */
export function weekRangeLabel(items: { dateISO: string }[]) {
  if (items.length === 0) return 'Semana'
  const monday = mondayOfWeek(items[0].dateISO)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const sameYear = monday.getFullYear() === sunday.getFullYear()
  const sameMonth = sameYear && monday.getMonth() === sunday.getMonth()

  if (sameMonth) {
    return `Semana del lunes ${monday.getDate()} al domingo ${sunday.getDate()} de ${MONTHS[sunday.getMonth()]} de ${sunday.getFullYear()}`
  }

  return `Semana del ${formatLongDay(monday, !sameYear)} al ${formatLongDay(sunday, true)}`
}

export function groupByWeekKey<T extends { weekKey: string; dateISO: string }>(
  items: T[],
) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.weekKey) ?? []
    list.push(item)
    map.set(item.weekKey, list)
  }

  const weeks = [...map.entries()].map(([weekKey, list]) => {
    const sorted = [...list].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    return [weekKey, sorted] as const
  })

  weeks.sort((a, b) => b[1][0].dateISO.localeCompare(a[1][0].dateISO))
  return weeks
}

export function groupNewsByWeek(items: NewsItem[]) {
  return groupByWeekKey(items)
}

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

/** Lunes de la semana ISO que contiene la fecha. */
function mondayOfWeek(iso: string) {
  const d = parseLocalDate(iso)
  const day = d.getDay()
  const delta = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + delta)
  return d
}

function formatLongDay(d: Date, withYear: boolean) {
  const w = WEEKDAYS[d.getDay()]
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return withYear
    ? `${w} ${day} de ${month} de ${year}`
    : `${w} ${day} de ${month}`
}

type Props = {
  weekKey: string
  items: NewsItem[]
}

export function WeekSection({ weekKey, items }: Props) {
  const label = weekRangeLabel(items)

  return (
    <section className="week-block" aria-labelledby={`week-${weekKey}`}>
      <header className="week-head">
        <span className="week-head__bar" aria-hidden />
        <p className="week-head__dates" id={`week-${weekKey}`}>
          {label}
        </p>
      </header>
      <div className="news-list">
        {items.map((item) => (
          <EventSplitCard
            key={item.id}
            item={item}
            to={`/vida/noticias/${item.id}`}
          />
        ))}
      </div>
    </section>
  )
}
