'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Board, Card, List, ReorderCardInput } from '../types';
import { reorderCard } from '../actions/reorder-card';
import { generateKeyBetween } from '@/shared/lib/fractional-index';

// ---- Query keys ----

export const boardKeys = {
  all: ['boards'] as const,
  detail: (id: string) => ['boards', id] as const,
  cards: (boardId: string) => ['boards', boardId, 'cards'] as const,
};

// ---- Board query ----

async function fetchBoard(boardId: string): Promise<Board> {
  const res = await fetch(`/api/boards/${boardId}`);
  if (!res.ok) throw new Error('Failed to fetch board');
  return res.json();
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => fetchBoard(boardId),
    refetchInterval: 5000, // Poll every 5s for real-time-ish updates
  });
}

// ---- Card reorder mutation with optimistic update ----

interface MoveCardInput {
  boardId: string;
  cardId: string;
  fromListId: string;
  toListId: string;
  fromIndex: number;
  toIndex: number;
}

/**
 * React Query mutation for card drag-and-drop reordering.
 *
 * Performs an **optimistic update** so the UI reflects the move instantly,
 * then reconciles with the server response. If the server action fails,
 * the previous board state is restored automatically.
 */
export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MoveCardInput) => {
      const board = queryClient.getQueryData<Board>(
        boardKeys.detail(input.boardId),
      );
      if (!board) throw new Error('Board not in cache');

      const targetList = board.lists.find((l) => l.id === input.toListId);
      if (!targetList) throw new Error('Target list not found');

      // Compute neighbour positions in the target list (after optimistic reorder)
      const sortedCards = [...targetList.cards]
        .filter((c) => c.id !== input.cardId)
        .sort((a, b) => a.position.localeCompare(b.position));

      const afterPosition =
        input.toIndex > 0 ? sortedCards[input.toIndex - 1]?.position ?? null : null;
      const beforePosition =
        input.toIndex < sortedCards.length
          ? sortedCards[input.toIndex]?.position ?? null
          : null;

      const payload: ReorderCardInput = {
        cardId: input.cardId,
        targetListId: input.toListId,
        afterPosition,
        beforePosition,
      };

      return reorderCard(payload);
    },

    // Optimistic update: move the card in the cache immediately
    onMutate: async (input) => {
      // Cancel outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: boardKeys.detail(input.boardId),
      });

      // Snapshot the previous board state
      const previousBoard = queryClient.getQueryData<Board>(
        boardKeys.detail(input.boardId),
      );

      // Optimistically update the cache
      queryClient.setQueryData<Board>(
        boardKeys.detail(input.boardId),
        (old) => {
          if (!old) return old;
          return applyOptimisticMove(old, input);
        },
      );

      return { previousBoard };
    },

    // On error, roll back to the snapshot
    onError: (_err, input, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          boardKeys.detail(input.boardId),
          context.previousBoard,
        );
      }
    },

    // After settling (success or error), refetch to reconcile
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: boardKeys.detail(input.boardId),
      });
    },
  });
}

// ---- Optimistic update helper ----

function applyOptimisticMove(board: Board, input: MoveCardInput): Board {
  const { cardId, fromListId, toListId, toIndex } = input;

  // Deep clone the lists to avoid mutating the cache directly
  const newLists = board.lists.map((list) => ({
    ...list,
    cards: [...list.cards],
  }));

  // Find and remove the card from the source list
  const sourceList = newLists.find((l) => l.id === fromListId);
  if (!sourceList) return board;

  const cardIndex = sourceList.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return board;

  const [movedCard] = sourceList.cards.splice(cardIndex, 1);

  // Determine the target list
  const targetList = newLists.find((l) => l.id === toListId);
  if (!targetList) return board;

  // Compute a new fractional position
  const sortedTargetCards = targetList.cards.sort((a, b) =>
    a.position.localeCompare(b.position),
  );

  const afterPos =
    toIndex > 0 ? sortedTargetCards[toIndex - 1]?.position ?? null : null;
  const beforePos =
    toIndex < sortedTargetCards.length
      ? sortedTargetCards[toIndex]?.position ?? null
      : null;

  const newPosition = generateKeyBetween(afterPos, beforePos);

  // Insert the card at the target position
  const updatedCard: Card = {
    ...movedCard,
    listId: toListId,
    position: newPosition,
  };

  targetList.cards.splice(toIndex, 0, updatedCard);

  return { ...board, lists: newLists };
}
