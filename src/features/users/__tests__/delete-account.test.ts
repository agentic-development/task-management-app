import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the action
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

vi.mock('@/shared/lib/events', () => ({
  eventEmitter: { emit: vi.fn() },
}));

import { deleteAccount } from '../actions/delete-account';

describe('deleteAccount server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes an existing user', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
    });
    mockDelete.mockResolvedValue({ id: 'user-1' });

    const result = await deleteAccount('user-1');

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
      }),
    );
  });

  it('returns error when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await deleteAccount('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1' });
    mockDelete.mockRejectedValue(new Error('Foreign key constraint failed'));

    const result = await deleteAccount('user-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Foreign key constraint failed');
  });
});
