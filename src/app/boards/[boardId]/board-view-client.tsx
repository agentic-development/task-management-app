'use client';

import { useCallback, useState } from 'react';
import { BoardView } from '@/features/boards';
import { TaskEditor } from '@/features/boards/components/task-editor';

interface BoardViewClientProps {
  boardId: string;
}

/**
 * Thin Client Component wrapper that renders the interactive BoardView
 * and the TaskEditor modal.
 *
 * This separation keeps the page.tsx a Server Component (for SEO and
 * initial data fetching) while the board content is a Client Component
 * (for drag-and-drop interactivity and React Query polling).
 */
export function BoardViewClient({ boardId }: BoardViewClientProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleCardClick = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
  }, []);

  const handleEditorClose = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  return (
    <>
      <BoardView boardId={boardId} onCardClick={handleCardClick} />
      <TaskEditor
        boardId={boardId}
        cardId={selectedCardId}
        onClose={handleEditorClose}
      />
    </>
  );
}
