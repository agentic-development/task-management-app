import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateKeyBetween } from '@/shared/lib/fractional-index';

/**
 * Unit tests for card reorder logic.
 *
 * These test the pure computation layer (fractional index generation
 * for card moves) without touching Prisma or the database.
 * Server action integration tests belong in E2E.
 */

describe('card reorder position computation', () => {
  describe('moving card within the same list', () => {
    it('computes a position between two existing cards', () => {
      // Given cards at positions A, M, Z
      const positions = ['A', 'M', 'Z'];

      // Moving last card between first and second
      const newPos = generateKeyBetween(positions[0], positions[1]);
      expect(newPos > positions[0]).toBe(true);
      expect(newPos < positions[1]).toBe(true);
    });

    it('computes a position at the beginning', () => {
      const firstPosition = 'M';
      const newPos = generateKeyBetween(null, firstPosition);
      expect(newPos < firstPosition).toBe(true);
    });

    it('computes a position at the end', () => {
      const lastPosition = 'M';
      const newPos = generateKeyBetween(lastPosition, null);
      expect(newPos > lastPosition).toBe(true);
    });
  });

  describe('moving card across lists', () => {
    it('generates a valid position when dropping into an empty list', () => {
      // Empty list: both neighbours are null
      const newPos = generateKeyBetween(null, null);
      expect(typeof newPos).toBe('string');
      expect(newPos.length).toBeGreaterThan(0);
    });

    it('generates a valid position when dropping at start of populated list', () => {
      const firstCardInTargetList = 'M';
      const newPos = generateKeyBetween(null, firstCardInTargetList);
      expect(newPos < firstCardInTargetList).toBe(true);
    });

    it('generates a valid position when dropping at end of populated list', () => {
      const lastCardInTargetList = 'M';
      const newPos = generateKeyBetween(lastCardInTargetList, null);
      expect(newPos > lastCardInTargetList).toBe(true);
    });

    it('generates a valid position when dropping between two cards', () => {
      const cardAbove = 'D';
      const cardBelow = 'R';
      const newPos = generateKeyBetween(cardAbove, cardBelow);
      expect(newPos > cardAbove).toBe(true);
      expect(newPos < cardBelow).toBe(true);
    });
  });

  describe('stress: many consecutive inserts at the same gap', () => {
    it('handles 100 consecutive inserts between two positions', () => {
      let before = 'A';
      let after = 'Z';
      const positions: string[] = [before, after];

      for (let i = 0; i < 100; i++) {
        const mid = generateKeyBetween(before, after);
        expect(mid > before).toBe(true);
        expect(mid < after).toBe(true);
        positions.push(mid);
        // Always insert into the left half to stress key growth
        after = mid;
      }

      // All positions should be unique
      const unique = new Set(positions);
      expect(unique.size).toBe(positions.length);
    });
  });
});

describe('optimistic move helper (pure logic)', () => {
  // Simulates the applyOptimisticMove logic without importing the React hook

  interface SimpleCard {
    id: string;
    listId: string;
    position: string;
  }

  function applyMove(
    lists: Map<string, SimpleCard[]>,
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
  ): Map<string, SimpleCard[]> {
    const result = new Map<string, SimpleCard[]>();
    for (const [lid, cards] of lists) {
      result.set(lid, [...cards]);
    }

    // Remove from source
    const sourceCards = result.get(fromListId)!;
    const cardIndex = sourceCards.findIndex((c) => c.id === cardId);
    const [card] = sourceCards.splice(cardIndex, 1);

    // Compute new position
    const targetCards = result.get(toListId)!;
    const sorted = [...targetCards].sort((a, b) =>
      a.position.localeCompare(b.position),
    );
    const afterPos = toIndex > 0 ? sorted[toIndex - 1]?.position ?? null : null;
    const beforePos =
      toIndex < sorted.length ? sorted[toIndex]?.position ?? null : null;

    const newPosition = generateKeyBetween(afterPos, beforePos);

    // Insert at target
    targetCards.splice(toIndex, 0, {
      ...card,
      listId: toListId,
      position: newPosition,
    });

    return result;
  }

  it('moves a card from one list to another', () => {
    const lists = new Map<string, SimpleCard[]>([
      [
        'list-1',
        [
          { id: 'card-1', listId: 'list-1', position: 'A' },
          { id: 'card-2', listId: 'list-1', position: 'M' },
        ],
      ],
      [
        'list-2',
        [
          { id: 'card-3', listId: 'list-2', position: 'A' },
        ],
      ],
    ]);

    const result = applyMove(lists, 'card-2', 'list-1', 'list-2', 0);

    // card-2 should now be in list-2
    expect(result.get('list-1')!.find((c) => c.id === 'card-2')).toBeUndefined();
    const movedCard = result.get('list-2')!.find((c) => c.id === 'card-2');
    expect(movedCard).toBeDefined();
    expect(movedCard!.listId).toBe('list-2');
    // Dropped at index 0 → should sort before card-3
    expect(movedCard!.position < 'A').toBe(true);
  });

  it('reorders a card within the same list', () => {
    const lists = new Map<string, SimpleCard[]>([
      [
        'list-1',
        [
          { id: 'card-1', listId: 'list-1', position: 'A' },
          { id: 'card-2', listId: 'list-1', position: 'M' },
          { id: 'card-3', listId: 'list-1', position: 'Z' },
        ],
      ],
    ]);

    // Move card-3 to index 0 (before card-1)
    const result = applyMove(lists, 'card-3', 'list-1', 'list-1', 0);

    const listCards = result.get('list-1')!;
    // card-3 should be removed from old position and inserted at 0
    expect(listCards.length).toBe(3);

    const movedCard = listCards.find((c) => c.id === 'card-3');
    expect(movedCard).toBeDefined();
    // Its new position should sort before card-1's position 'A'
    expect(movedCard!.position < 'A').toBe(true);
  });

  it('moves a card to an empty list', () => {
    const lists = new Map<string, SimpleCard[]>([
      [
        'list-1',
        [
          { id: 'card-1', listId: 'list-1', position: 'M' },
        ],
      ],
      ['list-2', []],
    ]);

    const result = applyMove(lists, 'card-1', 'list-1', 'list-2', 0);

    expect(result.get('list-1')!).toHaveLength(0);
    expect(result.get('list-2')!).toHaveLength(1);
    expect(result.get('list-2')![0].id).toBe('card-1');
    expect(result.get('list-2')![0].listId).toBe('list-2');
  });
});
