import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FeedItem } from '../data/feedStore'
import { MAX_FEATURED } from '../data/siteSettings'
import { SourceBadge, sourceKindFromFeedItem } from './SourceBadge'

type Props = {
  items: FeedItem[]
  busy?: boolean
  onReorder: (nextIds: string[]) => void
  onRemove: (id: string) => void
}

const measuring = {
  droppable: { strategy: MeasuringStrategy.WhileDragging },
}

const SortableCard = memo(function SortableCard({
  item,
  index,
  onRemove,
  busy,
}: {
  item: FeedItem
  index: number
  onRemove: (id: string) => void
  busy?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: busy })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="featured-bento__slot"
      {...attributes}
    >
      <span className="featured-bento__pos">{index + 1}</span>
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="featured-bento__grip"
        aria-label={`Arrastrar posición ${index + 1}`}
        disabled={busy}
        {...listeners}
      >
        ⠿
      </button>
      <div className="featured-bento__media">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            draggable={false}
            decoding="async"
            loading="eager"
          />
        ) : (
          <span className="featured-bento__placeholder" />
        )}
      </div>
      <div className="featured-bento__body">
        <SourceBadge kind={sourceKindFromFeedItem(item)} />
        <p className="featured-bento__title">{item.title}</p>
      </div>
      <button
        type="button"
        className="featured-bento__remove"
        disabled={busy}
        title="Quitar del carrusel"
        onClick={() => onRemove(item.id)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ✕
      </button>
    </div>
  )
})

function CardPreview({
  item,
  index,
}: {
  item: FeedItem
  index: number
}) {
  return (
    <div className="featured-bento__slot is-overlay">
      <span className="featured-bento__pos">{index + 1}</span>
      <span className="featured-bento__grip" aria-hidden>
        ⠿
      </span>
      <div className="featured-bento__media">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" draggable={false} decoding="async" />
        ) : (
          <span className="featured-bento__placeholder" />
        )}
      </div>
      <div className="featured-bento__body">
        <SourceBadge kind={sourceKindFromFeedItem(item)} />
        <p className="featured-bento__title">{item.title}</p>
      </div>
    </div>
  )
}

function sameIds(a: FeedItem[], b: FeedItem[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id) return false
  }
  return true
}

export function FeaturedBentoSortable({
  items,
  busy,
  onReorder,
  onRemove,
}: Props) {
  // Orden local inmediato al soltar → evita el salto “vuelve al viejo → aplica el nuevo”
  const [localItems, setLocalItems] = useState(items)
  const [activeId, setActiveId] = useState<string | null>(null)
  const draggingRef = useRef(false)
  // Tras soltar, no aceptar props viejas hasta que el padre alcance el mismo orden
  const holdLocalRef = useRef(false)

  useEffect(() => {
    if (draggingRef.current || activeId) return
    if (holdLocalRef.current) {
      if (sameIds(localItems, items)) holdLocalRef.current = false
      return
    }
    if (!sameIds(localItems, items)) setLocalItems(items)
  }, [items, activeId, localItems])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  )

  const ids = useMemo(() => localItems.map((i) => i.id), [localItems])
  const emptySlots = Math.max(0, MAX_FEATURED - localItems.length)
  const activeItem = activeId
    ? (localItems.find((i) => i.id === activeId) ?? null)
    : null
  const activeIndex = activeItem ? localItems.indexOf(activeItem) : -1

  function onDragStart(e: DragStartEvent) {
    draggingRef.current = true
    holdLocalRef.current = false
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    draggingRef.current = false

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      setActiveId(null)
      return
    }

    const nextIds = arrayMove(ids, oldIndex, newIndex)
    const nextItems = arrayMove(localItems, oldIndex, newIndex)
    // 1) Orden visual YA  2) bloquear sync con props viejas  3) soltar overlay  4) persistir
    holdLocalRef.current = true
    setLocalItems(nextItems)
    setActiveId(null)
    onReorder(nextIds)
  }

  function onDragCancel() {
    draggingRef.current = false
    holdLocalRef.current = false
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="featured-bento" aria-label="Orden del carrusel">
          {localItems.map((item, index) => (
            <SortableCard
              key={item.id}
              item={item}
              index={index}
              onRemove={onRemove}
              busy={busy}
            />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="featured-bento__slot is-empty"
              aria-hidden
            >
              <span className="featured-bento__pos">
                {localItems.length + i + 1}
              </span>
              <p className="featured-bento__hint">Vacío</p>
            </div>
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <CardPreview item={activeItem} index={activeIndex} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
