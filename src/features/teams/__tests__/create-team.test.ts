import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the action
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    team: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { createTeam } from '../actions/create-team';
import type { CreateTeamInput } from '../types';

describe('createTeam server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new team with name and slug', async () => {
    mockFindUnique.mockResolvedValue(null); // no duplicate slug
    mockCreate.mockResolvedValue({
      id: 'team-1',
      name: 'Engineering',
      slug: 'engineering',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const input: CreateTeamInput = {
      name: 'Engineering',
      slug: 'engineering',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(true);
    expect(result.team?.name).toBe('Engineering');
    expect(result.team?.slug).toBe('engineering');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Engineering',
          slug: 'engineering',
        }),
      }),
    );
  });

  it('rejects empty team name', async () => {
    const input: CreateTeamInput = {
      name: '   ',
      slug: 'engineering',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Team name cannot be empty');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects empty slug', async () => {
    const input: CreateTeamInput = {
      name: 'Engineering',
      slug: '',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Slug cannot be empty');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid slug format', async () => {
    const input: CreateTeamInput = {
      name: 'Engineering',
      slug: 'Engineering Team!',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      'Slug must contain only lowercase letters, numbers, and hyphens',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects duplicate slug', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'existing-team',
      slug: 'engineering',
    });

    const input: CreateTeamInput = {
      name: 'Engineering',
      slug: 'engineering',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('A team with this slug already exists');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('normalizes slug to lowercase', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'team-1',
      name: 'Engineering',
      slug: 'engineering-team',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const input: CreateTeamInput = {
      name: 'Engineering',
      slug: 'ENGINEERING-TEAM',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'engineering-team',
        }),
      }),
    );
  });

  it('trims whitespace from name and slug', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'team-1',
      name: 'Engineering',
      slug: 'engineering',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const input: CreateTeamInput = {
      name: '  Engineering  ',
      slug: '  engineering  ',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Engineering',
          slug: 'engineering',
        }),
      }),
    );
  });

  it('handles database errors gracefully', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error('Database connection lost'));

    const input: CreateTeamInput = {
      name: 'Engineering',
      slug: 'engineering',
    };

    const result = await createTeam(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection lost');
  });
});
