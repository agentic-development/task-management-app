'use client';

import { useCallback, useRef, type DragEvent } from 'react';
import type { Card, DragItem } from '../types';
import { useBoardDnd } from './dnd-context';

interface BoardCardProps {
  card: Card;
  index: number;
  listId: string;
  onCardClick?: (cardId: string) => void;
}

/**
 * A draggable Kanban card using the HTML5 Drag and Drop API.
 *
 * Styled with DaisyUI card classes and the `kanban-card` CSS class
 * from the prototype for hover/active lift effects.
 */
export function BoardCard({ card, index, listId, onCardClick }: BoardCardProps) {
  const { startDrag, isDragging, dragItem } = useBoardDnd();
  const cardRef = useRef<HTMLDivElement>(null);

  const isBeingDragged = dragItem?.id === card.id;

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      const item: DragItem = {
        type: 'card',
        id: card.id,
        listId,
        index,
      };
      startDrag(item);

      // Required for Firefox
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.id);

      // Set a custom drag image (the card element itself)
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        e.dataTransfer.setDragImage(
          cardRef.current,
          e.clientX - rect.left,
          e.clientY - rect.top,
        );
      }
    },
    [card.id, listId, index, startDrag],
  );

  const handleClick = useCallback(() => {
    if (!isDragging) {
      onCardClick?.(card.id);
    }
  }, [card.id, isDragging, onCardClick]);

  // ---- Due date formatting ----
  const dueLabel = formatDueDate(card.dueDate);

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`
        kanban-card
        card card-compact bg-base-200 border border-base-300
        rounded-lg p-3 mb-2
        ${isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100'}
        transition-all duration-150
      `}
      data-card-id={card.id}
      data-card-index={index}
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(({ label }) => (
            <span
              key={label.id}
              className="badge badge-sm font-medium text-[10px]"
              style={{ backgroundColor: label.color, color: '#0f0f12' }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug">{card.title}</p>

      {/* Meta row: due date, comments count, assignee */}
      {(dueLabel || card.commentsCount > 0 || card.assignee) && (
        <div className="flex items-center gap-2 mt-2 text-xs">
          {dueLabel && (
            <span className={`flex items-center gap-1 ${dueLabel.className}`}>
              <ClockIcon />
              {dueLabel.text}
            </span>
          )}

          {card.commentsCount > 0 && (
            <span className="flex items-center gap-1 opacity-60">
              <CommentIcon />
              {card.commentsCount}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {card.assignee && (
            <div
              className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold"
              title={card.assignee.name ?? 'Assigned'}
            >
              {initials(card.assignee.name)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Helpers ----

function formatDueDate(
  dueDate: Date | null,
): { text: string; className: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dateStr = due.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (diffDays < 0) return { text: dateStr, className: 'due-overdue text-error' };
  if (diffDays <= 2) return { text: dateStr, className: 'due-soon text-warning' };
  return { text: dateStr, className: 'due-ok opacity-60' };
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---- Inline SVG icons (avoids external dependency) ----

function ClockIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443h2.887c1.6 0 2.994-1.123 3.227-2.707.16-1.087.283-2.185.369-3.293V9.75A2.25 2.25 0 0018 7.5H6A2.25 2.25 0 003.75 9.75v1.474z"
      />
    </svg>
  );
}
