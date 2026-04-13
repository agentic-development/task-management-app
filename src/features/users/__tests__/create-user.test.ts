import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the action
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock('@/shared/lib/events', () => ({
  eventEmitter: { emit: vi.fn() },
}));

import { createUser } from '../actions/create-user';
import type { CreateUserInput } from '../types';

describe('createUser server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new user with name and email', async () => {
    mockFindUnique.mockResolvedValue(null); // no duplicate
    mockCreate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const input: CreateUserInput = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const result = await createUser(input);

    expect(result.success).toBe(true);
    expect(result.user?.name).toBe('Alice');
    expect(result.user?.email).toBe('alice@example.com');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Alice',
          email: 'alice@example.com',
        }),
      }),
    );
  });

  it('rejects empty name', async () => {
    const input: CreateUserInput = {
      name: '   ',
      email: 'alice@example.com',
    };

    const result = await createUser(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Name cannot be empty');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects empty email', async () => {
    const input: CreateUserInput = {
      name: 'Alice',
      email: '',
    };

    const result = await createUser(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email cannot be empty');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid email format', async () => {
    const input: CreateUserInput = {
      name: 'Alice',
      email: 'not-an-email',
    };

    const result = await createUser(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'alice@example.com',
    });

    const input: CreateUserInput = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const result = await createUser(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('A user with this email already exists');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates user with optional image', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://example.com/avatar.jpg',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const input: CreateUserInput = {
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://example.com/avatar.jpg',
    };

    const result = await createUser(input);

    expect(result.success).toBe(true);
    expect(result.user?.image).toBe('https://example.com/avatar.jpg');
  });

  it('handles database errors gracefully', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error('Database connection lost'));

    const input: CreateUserInput = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const result = await createUser(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection lost');
  });
});
