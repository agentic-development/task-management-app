'use client';

import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react';
import type { Card, List } from '../types';
import { BoardCard } from './board-card';
import { useBoardDnd } from './dnd-context';

interface BoardListProps {
  list: List;
  onCardClick?: (cardId: string) => void;
  /** Render slot for the "add card" UI at the bottom of the list */
  addCardSlot?: ReactNode;
}

/**
 * A single Kanban list column.
 *
 * Acts as a **drop zone** for cards being dragged. Computes the drop index
 * based on the pointer's Y position relative to the card elements, and
 * renders a visual drop indicator line at the computed insertion point.
 */
export function BoardList({ list, onCardClick, addCardSlot }: BoardListProps) {
  const { dragItem, dropTarget, updateDropTarget, isDragging } = useBoardDnd();
  const listRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Sort cards by fractional index position
  const sortedCards = [...list.cards]
    .filter((c) => !c.archived)
    .sort((a, b) => a.position.localeCompare(b.position));

  // ---- Drop zone handlers ----

  const computeDropIndex = useCallback(
    (e: DragEvent<HTMLDivElement>): number => {
      if (!listRef.current) return sortedCards.length;

      const cardElements = listRef.current.querySelectorAll('[data-card-id]');
      for (let i = 0; i < cardElements.length; i++) {
        const rect = cardElements[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          return i;
        }
      }
      return sortedCards.length;
    },
    [sortedCards.length],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsHovering(true);

      const index = computeDropIndex(e);
      updateDropTarget({ listId: list.id, index });
    },
    [computeDropIndex, list.id, updateDropTarget],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      // Only clear if leaving the list itself (not entering a child)
      if (!listRef.current?.contains(e.relatedTarget as Node)) {
        setIsHovering(false);
        updateDropTarget(null);
      }
    },
    [updateDropTarget],
  );

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsHovering(true);
    },
    [],
  );

  // Determine if the drop indicator should be shown in this list
  const showDropIndicator =
    isDragging &&
    dropTarget?.listId === list.id &&
    dragItem?.type === 'card';

  const dropIndex = dropTarget?.listId === list.id ? dropTarget.index : -1;

  return (
    <div className="list-column flex flex-col bg-base-300/50 rounded-xl border border-base-300 h-fit max-h-[calc(100vh-10rem)]">
      {/* List header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-base-300">
        <h3 className="font-display font-semibold text-sm flex-1 truncate">
          {list.name}
        </h3>
        <span className="badge badge-sm badge-ghost font-mono text-xs">
          {sortedCards.length}
        </span>
      </div>

      {/* Card container / drop zone */}
      <div
        ref={listRef}
        className={`
          flex-1 overflow-y-auto px-2 py-2 min-h-[60px]
          transition-colors duration-150
          ${isHovering && isDragging ? 'bg-primary/5' : ''}
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {sortedCards.map((card, i) => (
          <div key={card.id}>
            {/* Drop indicator BEFORE this card */}
            {showDropIndicator && dropIndex === i && <DropIndicator />}
            <BoardCard
              card={card}
              index={i}
              listId={list.id}
              onCardClick={onCardClick}
            />
          </div>
        ))}

        {/* Drop indicator AFTER the last card */}
        {showDropIndicator && dropIndex === sortedCards.length && <DropIndicator />}

        {/* Empty list placeholder */}
        {sortedCards.length === 0 && !isDragging && (
          <div className="text-center py-6 text-xs opacity-40">
            No cards yet
          </div>
        )}
      </div>

      {/* Add card slot */}
      {addCardSlot && (
        <div className="px-2 pb-2 pt-1 border-t border-base-300/50">
          {addCardSlot}
        </div>
      )}
    </div>
  );
}

// ---- Drop indicator line ----

function DropIndicator() {
  return (
    <div className="h-0.5 bg-primary rounded-full mx-1 my-1 transition-all duration-100 animate-pulse" />
  );
}
