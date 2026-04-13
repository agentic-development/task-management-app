import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { BoardViewClient } from './board-view-client';

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

/**
 * Board detail page — Server Component.
 *
 * Fetches the board name for the header on the server, then delegates
 * the interactive board view (drag-and-drop, polling) to a Client Component.
 */
export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, name: true, archived: true },
  });

  if (!board || board.archived) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Board header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-base-300 bg-base-100">
        <h1 className="font-display text-lg font-semibold truncate">
          {board.name}
        </h1>
      </header>

      {/* Board content — Client Component with drag-and-drop */}
      <BoardViewClient boardId={board.id} />
    </div>
  );
}
