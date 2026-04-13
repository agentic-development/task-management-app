'use server';

import { prisma } from '@/shared/lib/prisma';
import type { UpdateCardInput, UpdateCardResult } from '../types';

/**
 * Server Action: update card fields (title, description, dueDate, assigneeId).
 *
 * Validates input before persisting. Returns the updated card fields on success
 * or a descriptive error message on failure.
 */
export async function updateCard(
  input: UpdateCardInput,
): Promise<UpdateCardResult> {
  try {
    const { cardId, title, description, dueDate, assigneeId } = input;

    // Validate title if provided
    if (title !== undefined && title.trim().length === 0) {
      return { success: false, card: null, error: 'Title cannot be empty' };
    }

    // Verify the card exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, listId: true, list: { select: { boardId: true } } },
    });

    if (!card) {
      return { success: false, card: null, error: 'Card not found' };
    }

    // Build the update payload — only include fields that were explicitly provided
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        assigneeId: true,
      },
    });

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('[update-card] Failed to update card:', error);
    return {
      success: false,
      card: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
