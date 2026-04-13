import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the query
const mockFindMany = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { listUsers } from '../queries/list-users';

describe('listUsers query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all users', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        image: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        image: 'https://example.com/bob.jpg',
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-02'),
      },
    ]);

    const result = await listUsers();

    expect(result.success).toBe(true);
    expect(result.users).toHaveLength(2);
    expect(result.users[0].name).toBe('Alice');
    expect(result.users[1].name).toBe('Bob');
  });

  it('returns empty array when no users exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await listUsers();

    expect(result.success).toBe(true);
    expect(result.users).toEqual([]);
  });

  it('handles database errors gracefully', async () => {
    mockFindMany.mockRejectedValue(new Error('Database timeout'));

    const result = await listUsers();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database timeout');
    expect(result.users).toEqual([]);
  });
});
