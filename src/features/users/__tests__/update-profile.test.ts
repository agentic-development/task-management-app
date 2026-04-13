import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing the action
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/shared/lib/events', () => ({
  eventEmitter: { emit: vi.fn() },
}));

import { updateProfile } from '../actions/update-profile';
import type { UpdateProfileInput } from '../types';

describe('updateProfile server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await updateProfile('nonexistent', { name: 'New Name' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
    expect(result.user).toBeNull();
  });

  it('updates the user name', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });
    mockUpdate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      image: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-24'),
    });

    const result = await updateProfile('user-1', { name: 'Alice Smith' });

    expect(result.success).toBe(true);
    expect(result.user?.name).toBe('Alice Smith');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ name: 'Alice Smith' }),
      }),
    );
  });

  it('updates the user email', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com' }) // exists check
      .mockResolvedValueOnce(null); // no duplicate

    mockUpdate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'newalice@example.com',
      image: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-24'),
    });

    const result = await updateProfile('user-1', { email: 'newalice@example.com' });

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('newalice@example.com');
  });

  it('rejects duplicate email', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com' }) // exists
      .mockResolvedValueOnce({ id: 'user-2', email: 'bob@example.com' }); // duplicate found

    const result = await updateProfile('user-1', { email: 'bob@example.com' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('A user with this email already exists');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('allows keeping the same email', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com' })
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com' }); // same user

    mockUpdate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-24'),
    });

    const result = await updateProfile('user-1', { email: 'alice@example.com' });

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('alice@example.com');
  });

  it('rejects invalid email format', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });

    const result = await updateProfile('user-1', { email: 'not-an-email' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects empty name', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });

    const result = await updateProfile('user-1', { name: '   ' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Name cannot be empty');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates image', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });
    mockUpdate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://example.com/new-avatar.jpg',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-24'),
    });

    const result = await updateProfile('user-1', {
      image: 'https://example.com/new-avatar.jpg',
    });

    expect(result.success).toBe(true);
    expect(result.user?.image).toBe('https://example.com/new-avatar.jpg');
  });

  it('clears image when set to null', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });
    mockUpdate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-24'),
    });

    const result = await updateProfile('user-1', { image: null });

    expect(result.success).toBe(true);
    expect(result.user?.image).toBeNull();
  });

  it('updates multiple fields at once', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com' })
      .mockResolvedValueOnce(null); // no duplicate for new email

    mockUpdate.mockResolvedValue({
      id: 'user-1',
      name: 'Alice Smith',
      email: 'alicesmith@example.com',
      image: 'https://example.com/alice.jpg',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-24'),
    });

    const input: UpdateProfileInput = {
      name: 'Alice Smith',
      email: 'alicesmith@example.com',
      image: 'https://example.com/alice.jpg',
    };

    const result = await updateProfile('user-1', input);

    expect(result.success).toBe(true);
    expect(result.user?.name).toBe('Alice Smith');
    expect(result.user?.email).toBe('alicesmith@example.com');
  });

  it('handles database errors gracefully', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'alice@example.com' });
    mockUpdate.mockRejectedValue(new Error('Database connection lost'));

    const result = await updateProfile('user-1', { name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection lost');
  });
});
