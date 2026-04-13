import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the action
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    card: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/shared/lib/events', () => ({
  eventEmitter: { emit: vi.fn() },
}));

import { updateCard } from '../actions/update-card';
import type { UpdateCardInput } from '../types';

describe('updateCard server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when card is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const input: UpdateCardInput = {
      cardId: 'nonexistent',
      boardId: 'board-1',
      title: 'Updated',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Card not found');
    expect(result.card).toBeNull();
  });

  it('updates the card title', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'New Title',
      description: null,
      dueDate: null,
      assigneeId: null,
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      title: 'New Title',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.title).toBe('New Title');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'card-1' },
        data: expect.objectContaining({ title: 'New Title' }),
      }),
    );
  });

  it('updates the card description', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'Card',
      description: 'A detailed description',
      dueDate: null,
      assigneeId: null,
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      description: 'A detailed description',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.description).toBe('A detailed description');
  });

  it('clears description when set to null', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'Card',
      description: null,
      dueDate: null,
      assigneeId: null,
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      description: null,
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.description).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      }),
    );
  });

  it('updates the due date', async () => {
    const dueDate = '2026-04-15T00:00:00.000Z';

    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'Card',
      description: null,
      dueDate: new Date(dueDate),
      assigneeId: null,
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      dueDate,
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.dueDate).toEqual(new Date(dueDate));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dueDate: new Date(dueDate) }),
      }),
    );
  });

  it('clears the due date when set to null', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'Card',
      description: null,
      dueDate: null,
      assigneeId: null,
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      dueDate: null,
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.dueDate).toBeNull();
  });

  it('updates the assignee', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'Card',
      description: null,
      dueDate: null,
      assigneeId: 'user-42',
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      assigneeId: 'user-42',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.assigneeId).toBe('user-42');
  });

  it('updates multiple fields at once', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockResolvedValue({
      id: 'card-1',
      title: 'Updated Title',
      description: 'Updated desc',
      dueDate: new Date('2026-05-01T00:00:00.000Z'),
      assigneeId: 'user-7',
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      title: 'Updated Title',
      description: 'Updated desc',
      dueDate: '2026-05-01T00:00:00.000Z',
      assigneeId: 'user-7',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(true);
    expect(result.card?.title).toBe('Updated Title');
    expect(result.card?.description).toBe('Updated desc');
    expect(result.card?.assigneeId).toBe('user-7');
  });

  it('rejects empty title', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      title: '   ',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Title cannot be empty');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('handles Prisma errors gracefully', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'card-1',
      listId: 'list-1',
      list: { boardId: 'board-1' },
    });

    mockUpdate.mockRejectedValue(new Error('Database connection lost'));

    const input: UpdateCardInput = {
      cardId: 'card-1',
      boardId: 'board-1',
      title: 'Updated',
    };

    const result = await updateCard(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection lost');
  });
});
