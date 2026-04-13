'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Board, CardDetail, UpdateCardInput } from '../types';
import { updateCard } from '../actions/update-card';
import { boardKeys } from './use-board';

// ---- Query keys ----

export const cardKeys = {
  detail: (boardId: string, cardId: string) =>
    ['boards', boardId, 'cards', cardId] as const,
};

// ---- Card detail query ----

async function fetchCardDetail(
  boardId: string,
  cardId: string,
): Promise<CardDetail> {
  const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`);
  if (!res.ok) throw new Error('Failed to fetch card details');
  return res.json();
}

/**
 * Fetches full card details including comments and labels.
 * Polls every 10 seconds for near-real-time updates in the editor.
 */
export function useCardDetail(boardId: string, cardId: string | null) {
  return useQuery({
    queryKey: cardId ? cardKeys.detail(boardId, cardId) : ['cards', 'none'],
    queryFn: () => {
      if (!cardId) throw new Error('No card selected');
      return fetchCardDetail(boardId, cardId);
    },
    enabled: !!cardId,
    refetchInterval: 10_000,
  });
}

// ---- Card update mutation ----

/**
 * React Query mutation that calls the `updateCard` server action
 * and invalidates both the card detail and parent board queries
 * so the Kanban view stays in sync.
 */
export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCardInput) => updateCard(input),

    onSuccess: (_data, input) => {
      // Invalidate the card detail cache
      queryClient.invalidateQueries({
        queryKey: cardKeys.detail(boardId, input.cardId),
      });
      // Invalidate the board cache so the Kanban view reflects changes
      queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
    },
  });
}
