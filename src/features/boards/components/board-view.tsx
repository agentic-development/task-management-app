'use client';

import { useCallback, type DragEvent } from 'react';
import type { Board } from '../types';
import { useBoard, useMoveCard } from '../queries/use-board';
import { BoardDndProvider, useBoardDnd } from './dnd-context';
import { BoardList } from './board-list';

interface BoardViewProps {
  boardId: string;
  onCardClick?: (cardId: string) => void;
}

/**
 * Top-level board view that renders all lists in a horizontal scrollable
 * layout and orchestrates drag-and-drop card moves.
 *
 * Wraps the content in `BoardDndProvider` so all child list/card
 * components can participate in the shared drag state.
 */
export function BoardView({ boardId, onCardClick }: BoardViewProps) {
  return (
    <BoardDndProvider>
      <BoardViewInner boardId={boardId} onCardClick={onCardClick} />
    </BoardDndProvider>
  );
}

// ---- Inner component (has access to DnD context) ----

function BoardViewInner({
  boardId,
  onCardClick,
}: BoardViewProps) {
  const { data: board, isLoading, error } = useBoard(boardId);
  const moveCard = useMoveCard();
  const { endDrag } = useBoardDnd();

  // Handle the drop event at the board level
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const result = endDrag();
      if (!result || !board) return;

      const { item, target } = result;

      moveCard.mutate({
        boardId,
        cardId: item.id,
        fromListId: item.listId,
        toListId: target.listId,
        fromIndex: item.index,
        toIndex: target.index,
      });
    },
    [board, boardId, endDrag, moveCard],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragEnd = useCallback(() => {
    // If drop didn't fire (e.g. dropped outside), cancel the drag
    endDrag();
  }, [endDrag]);

  // ---- Loading / error states ----

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
        <span>Failed to load board. Please try again.</span>
      </div>
    );
  }

  // Sort lists by fractional index position
  const sortedLists = [...board.lists]
    .filter((l) => !l.archived)
    .sort((a, b) => a.position.localeCompare(b.position));

  return (
    <div
      className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-7rem)] items-start"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {sortedLists.map((list) => (
        <BoardList key={list.id} list={list} onCardClick={onCardClick} />
      ))}

      {sortedLists.length === 0 && (
        <div className="flex items-center justify-center w-full h-48 text-base-content/40">
          <p className="text-lg">No lists yet. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}
