import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns status ok with timestamp and HTTP 200', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'ok',
      timestamp: '2026-03-24T12:00:00.000Z',
    });
  });

  it('returns Content-Type application/json header', async () => {
    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
