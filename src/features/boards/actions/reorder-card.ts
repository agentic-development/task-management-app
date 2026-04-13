'use server';

import { prisma } from '@/shared/lib/prisma';
import { generateKeyBetween } from '@/shared/lib/fractional-index';
import type { ReorderCardInput, ReorderCardResult } from '../types';

/**
 * Server Action: move a card to a new position within the same or a different list.
 *
 * Uses fractional indexing to compute a new position key between the two
 * neighbouring cards at the drop target, without reindexing any other cards.
 *
 * Emits a `card.moved` domain event when the list changes.
 */
export async function reorderCard(
  input: ReorderCardInput,
): Promise<ReorderCardResult> {
  try {
    const { cardId, targetListId, afterPosition, beforePosition } = input;

    // Compute the new fractional index position
    const newPosition = generateKeyBetween(
      afterPosition,
      beforePosition,
    );

    // Fetch the card to check it exists and get the current list
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, listId: true, list: { select: { boardId: true } } },
    });

    if (!card) {
      return { success: false, card: null, error: 'Card not found' };
    }

    const fromListId = card.listId;

    // Update card position and (optionally) list
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        position: newPosition,
        listId: targetListId,
      },
      select: { id: true, listId: true, position: true },
    });

    // If moved across lists, emit domain event (async, non-blocking)
    if (fromListId !== targetListId) {
      // Domain event emission — fires asynchronously and does not block
      // the server action response.  The event handler creates the
      // ActivityEntry via Prisma middleware.
      void emitCardMovedEvent({
        cardId,
        fromListId,
        toListId: targetListId,
        newPosition,
        boardId: card.list.boardId,
      });
    }

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('[reorder-card] Failed to reorder card:', error);
    return {
      success: false,
      card: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ---- Internal helpers ----

interface CardMovedPayload {
  cardId: string;
  fromListId: string;
  toListId: string;
  newPosition: string;
  boardId: string;
}

async function emitCardMovedEvent(payload: CardMovedPayload): Promise<void> {
  try {
    // Import the shared event emitter lazily to avoid circular deps
    const { eventEmitter } = await import('@/shared/lib/events');
    eventEmitter.emit('card.moved', {
      type: 'card.moved' as const,
      payload: {
        cardId: payload.cardId,
        fromListId: payload.fromListId,
        toListId: payload.toListId,
        newPosition: payload.newPosition,
        movedById: '', // TODO: get from auth session
        timestamp: new Date(),
      },
    });
  } catch {
    // Event emission failure should never break the mutation
    console.warn('[reorder-card] Failed to emit card.moved event');
  }
}
