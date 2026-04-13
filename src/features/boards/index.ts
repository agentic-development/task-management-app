/**
 * Boards feature — public API.
 *
 * Re-exports the components and hooks needed by pages that render boards.
 */

export { BoardView } from './components/board-view';
export { BoardCard } from './components/board-card';
export { BoardList } from './components/board-list';
export { BoardDndProvider, useBoardDnd } from './components/dnd-context';
export { TaskEditor } from './components/task-editor';
export { useBoard, useMoveCard, boardKeys } from './queries/use-board';
export { useCardDetail, useUpdateCard, cardKeys } from './queries/use-card';
export { reorderCard } from './actions/reorder-card';
export { updateCard } from './actions/update-card';

export type {
  Board,
  Card,
  CardDetail,
  CardComment,
  List,
  Label,
  DragItem,
  DropTarget,
  ReorderCardInput,
  ReorderCardResult,
  UpdateCardInput,
  UpdateCardResult,
} from './types';
