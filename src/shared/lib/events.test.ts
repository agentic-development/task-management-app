import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventEmitter, type CardMovedEvent } from './events';

describe('DomainEventEmitter', () => {
  beforeEach(() => {
    eventEmitter.removeAllListeners();
  });

  it('calls registered handlers when an event is emitted', () => {
    const handler = vi.fn();
    eventEmitter.on('card.moved', handler);

    const event: CardMovedEvent = {
      type: 'card.moved',
      payload: {
        cardId: 'card-1',
        fromListId: 'list-1',
        toListId: 'list-2',
        newPosition: 'M',
        movedById: 'user-1',
        timestamp: new Date(),
      },
    };

    eventEmitter.emit('card.moved', event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('does not call handlers for different event types', () => {
    const handler = vi.fn();
    eventEmitter.on('card.created', handler);

    const event: CardMovedEvent = {
      type: 'card.moved',
      payload: {
        cardId: 'card-1',
        fromListId: 'list-1',
        toListId: 'list-2',
        newPosition: 'M',
        movedById: 'user-1',
        timestamp: new Date(),
      },
    };

    eventEmitter.emit('card.moved', event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports unsubscribing via the returned function', () => {
    const handler = vi.fn();
    const unsubscribe = eventEmitter.on('card.moved', handler);

    unsubscribe();

    eventEmitter.emit('card.moved', {
      type: 'card.moved',
      payload: {
        cardId: 'card-1',
        fromListId: 'list-1',
        toListId: 'list-2',
        newPosition: 'M',
        movedById: 'user-1',
        timestamp: new Date(),
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw when a sync handler throws', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    eventEmitter.on('card.moved', () => {
      throw new Error('handler boom');
    });

    expect(() => {
      eventEmitter.emit('card.moved', {
        type: 'card.moved',
        payload: {
          cardId: 'card-1',
          fromListId: 'list-1',
          toListId: 'list-2',
          newPosition: 'M',
          movedById: 'user-1',
          timestamp: new Date(),
        },
      });
    }).not.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('removeAllListeners clears all handlers', () => {
    const handler = vi.fn();
    eventEmitter.on('card.moved', handler);
    eventEmitter.on('card.created', handler);

    eventEmitter.removeAllListeners();

    eventEmitter.emit('card.moved', {
      type: 'card.moved',
      payload: {
        cardId: 'card-1',
        fromListId: 'list-1',
        toListId: 'list-2',
        newPosition: 'M',
        movedById: 'user-1',
        timestamp: new Date(),
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
