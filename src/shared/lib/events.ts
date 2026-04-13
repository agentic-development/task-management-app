/**
 * Typed domain event emitter.
 *
 * Provides a simple in-process event bus for cross-module communication.
 * Event handlers run asynchronously and failures are logged but never
 * propagate to the emitter.
 */

// ---- Event type definitions ----

export interface CardMovedEvent {
  type: 'card.moved';
  payload: {
    cardId: string;
    fromListId: string;
    toListId: string;
    newPosition: string;
    movedById: string;
    timestamp: Date;
  };
}

export interface CardCreatedEvent {
  type: 'card.created';
  payload: {
    cardId: string;
    listId: string;
    boardId: string;
    title: string;
    creatorId: string;
    timestamp: Date;
  };
}

export interface ListReorderedEvent {
  type: 'list.reordered';
  payload: {
    listId: string;
    boardId: string;
    newPosition: string;
    timestamp: Date;
  };
}

export interface BoardCreatedEvent {
  type: 'board.created';
  payload: {
    boardId: string;
    name: string;
    teamId: string;
    creatorId: string;
    timestamp: Date;
  };
}

export type DomainEvent =
  | CardMovedEvent
  | CardCreatedEvent
  | ListReorderedEvent
  | BoardCreatedEvent;

export type DomainEventType = DomainEvent['type'];

// ---- Event handler type ----

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

// ---- Emitter implementation ----

class DomainEventEmitter {
  private handlers = new Map<string, EventHandler[]>();

  /**
   * Register an event handler for a given event type.
   * Returns an unsubscribe function.
   */
  on<T extends DomainEvent>(
    type: T['type'],
    handler: EventHandler<T>,
  ): () => void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(type, existing);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const idx = handlers.indexOf(handler as EventHandler);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    };
  }

  /**
   * Emit a domain event. All registered handlers are invoked asynchronously.
   * Handler errors are logged but never propagate to the caller.
   */
  emit(type: string, event: DomainEvent): void {
    const handlers = this.handlers.get(type);
    if (!handlers || handlers.length === 0) return;

    for (const handler of handlers) {
      try {
        const result = handler(event);
        // If handler returns a promise, catch its rejection
        if (result && typeof result === 'object' && 'catch' in result) {
          (result as Promise<void>).catch((err) => {
            console.error(`[events] Handler error for "${type}":`, err);
          });
        }
      } catch (err) {
        console.error(`[events] Sync handler error for "${type}":`, err);
      }
    }
  }

  /** Remove all handlers (useful for testing). */
  removeAllListeners(): void {
    this.handlers.clear();
  }
}

// ---- Singleton ----

const globalForEvents = globalThis as unknown as {
  eventEmitter: DomainEventEmitter | undefined;
};

export const eventEmitter =
  globalForEvents.eventEmitter ?? new DomainEventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.eventEmitter = eventEmitter;
}
