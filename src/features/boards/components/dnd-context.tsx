'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DragItem, DropTarget } from '../types';

// ---- Context shape ----

interface DndContextValue {
  /** The item currently being dragged, or null if idle */
  dragItem: DragItem | null;
  /** The drop target the pointer is currently hovering, or null */
  dropTarget: DropTarget | null;
  /** Call when a drag operation starts */
  startDrag: (item: DragItem) => void;
  /** Call when the pointer enters a valid drop zone */
  updateDropTarget: (target: DropTarget | null) => void;
  /** Call when the drag ends (drop or cancel). Returns the final move or null. */
  endDrag: () => { item: DragItem; target: DropTarget } | null;
  /** Whether a drag is currently active */
  isDragging: boolean;
}

const DndCtx = createContext<DndContextValue | null>(null);

// ---- Provider ----

export function BoardDndProvider({ children }: { children: ReactNode }) {
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  // Use a ref for the latest drop target to avoid stale closures in endDrag
  const dropTargetRef = useRef<DropTarget | null>(null);

  const startDrag = useCallback((item: DragItem) => {
    setDragItem(item);
    setDropTarget(null);
    dropTargetRef.current = null;
  }, []);

  const updateDropTarget = useCallback((target: DropTarget | null) => {
    setDropTarget(target);
    dropTargetRef.current = target;
  }, []);

  const endDrag = useCallback(() => {
    const item = dragItem;
    const target = dropTargetRef.current;
    setDragItem(null);
    setDropTarget(null);
    dropTargetRef.current = null;

    if (!item || !target) return null;
    // Skip no-op moves (same list, same index)
    if (item.listId === target.listId && item.index === target.index) return null;
    return { item, target };
  }, [dragItem]);

  return (
    <DndCtx.Provider
      value={{
        dragItem,
        dropTarget,
        startDrag,
        updateDropTarget,
        endDrag,
        isDragging: dragItem !== null,
      }}
    >
      {children}
    </DndCtx.Provider>
  );
}

// ---- Hook ----

export function useBoardDnd(): DndContextValue {
  const ctx = useContext(DndCtx);
  if (!ctx) {
    throw new Error('useBoardDnd must be used within a <BoardDndProvider>');
  }
  return ctx;
}
