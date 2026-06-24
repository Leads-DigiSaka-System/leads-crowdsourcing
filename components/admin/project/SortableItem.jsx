"use client"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableItem({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  // Support render-prop children to allow drag handle usage.
  if (typeof children === 'function') {
    return (
      <div ref={setNodeRef} style={style}>
        {children({ attributes, listeners, isDragging, setActivatorNodeRef })}
      </div>
    )
  }

  // Backward-compat: if plain element children are passed, make the whole item draggable
  return (
    <div ref={setNodeRef} style={{ ...style, cursor: 'grab' }} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
