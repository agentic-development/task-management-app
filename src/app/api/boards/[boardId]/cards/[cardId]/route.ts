import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { generateKeyBetween } from '@/shared/lib/fractional-index';
import { eventEmitter } from '@/shared/lib/events';

/**
 * GET /api/boards/:boardId/cards/:cardId
 *
 * Returns a single card with its full details.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string; cardId: string }> },
) {
  try {
    const { cardId } = await params;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        assignee: {
          select: { id: true, name: true, image: true },
        },
        labels: {
          include: { label: true },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...card,
      commentsCount: card.comments.length,
    });
  } catch (error) {
    console.error('[GET /api/boards/:boardId/cards/:cardId] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/boards/:boardId/cards/:cardId
 *
 * Updates card fields. Supports:
 * - title, description, dueDate, assigneeId (field updates)
 * - listId + position (move/reorder via fractional index)
 * - afterPosition + beforePosition (compute new fractional index)
 *
 * This is the REST endpoint equivalent of the `reorderCard` server action,
 * used by external clients and the public API.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; cardId: string }> },
) {
  try {
    const { boardId, cardId } = await params;
    const body = await request.json();

    // Fetch current card state
    const currentCard = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, listId: true },
    });

    if (!currentCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Build the update data
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.archived !== undefined) updateData.archived = body.archived;

    // Handle position changes (drag-and-drop reordering)
    if (body.afterPosition !== undefined || body.beforePosition !== undefined) {
      const newPosition = generateKeyBetween(
        body.afterPosition ?? null,
        body.beforePosition ?? null,
      );
      updateData.position = newPosition;
    } else if (body.position !== undefined) {
      updateData.position = body.position;
    }

    if (body.listId !== undefined) {
      updateData.listId = body.listId;
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      select: { id: true, listId: true, position: true },
    });

    // Emit card.moved event if the list changed
    const fromListId = currentCard.listId;
    const toListId = updatedCard.listId;
    if (fromListId !== toListId) {
      eventEmitter.emit('card.moved', {
        type: 'card.moved' as const,
        payload: {
          cardId,
          fromListId,
          toListId,
          newPosition: updatedCard.position,
          movedById: '', // TODO: extract from auth session
          timestamp: new Date(),
        },
      });
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('[PATCH /api/boards/:boardId/cards/:cardId] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/boards/:boardId/cards/:cardId
 *
 * Soft-deletes (archives) a card.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string; cardId: string }> },
) {
  try {
    const { cardId } = await params;

    const card = await prisma.card.update({
      where: { id: cardId },
      data: { archived: true },
      select: { id: true },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error('[DELETE /api/boards/:boardId/cards/:cardId] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
