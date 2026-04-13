import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

/**
 * GET /api/boards/:boardId
 *
 * Returns the board with all non-archived lists and cards, sorted by
 * fractional index position. Used by the `useBoard` React Query hook
 * for initial load and polling-based refresh.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId } = await params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        labels: true,
        lists: {
          where: { archived: false },
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { archived: false },
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, image: true },
                },
                labels: {
                  include: { label: true },
                },
                comments: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 },
      );
    }

    // Transform the response to match the Board type contract
    const transformed = {
      ...board,
      lists: board.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => ({
          ...card,
          commentsCount: card.comments.length,
          comments: undefined, // Strip raw comments array
        })),
      })),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('[GET /api/boards/:boardId] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
