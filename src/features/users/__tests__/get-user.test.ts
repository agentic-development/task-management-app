import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the query
const mockFindUnique = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { getUser } from '../queries/get-user';

describe('getUser query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user with teams when found', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      memberships: [
        {
          id: 'mem-1',
          role: 'admin',
          team: { id: 'team-1', name: 'Team Alpha', slug: 'team-alpha' },
        },
      ],
    });

    const result = await getUser('user-1');

    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('user-1');
    expect(result.user?.name).toBe('Alice');
    expect(result.user?.memberships).toHaveLength(1);
    expect(result.user?.memberships[0].role).toBe('admin');
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
      }),
    );
  });

  it('returns error when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await getUser('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(result.user).toBeNull();
  });

  it('handles database errors gracefully', async () => {
    mockFindUnique.mockRejectedValue(new Error('Connection refused'));

    const result = await getUser('user-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
    expect(result.user).toBeNull();
  });
});
