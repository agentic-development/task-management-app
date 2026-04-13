/**
 * Board feature types.
 *
 * These types mirror the Prisma models from the charter's shared data models
 * but are decoupled from the ORM for use in client components and server actions.
 */

export interface Board {
  id: string;
  name: string;
  description: string | null;
  visibility: 'private' | 'team';
  archived: boolean;
  teamId: string;
  lists: List[];
  labels: Label[];
  createdAt: Date;
  updatedAt: Date;
}

export interface List {
  id: string;
  name: string;
  position: string; // fractional index
  archived: boolean;
  boardId: string;
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  position: string; // fractional index
  dueDate: Date | null;
  archived: boolean;
  listId: string;
  assigneeId: string | null;
  assignee: CardAssignee | null;
  labels: CardLabelEntry[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardAssignee {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string; // hex color code
  boardId: string;
}

export interface CardLabelEntry {
  label: Label;
}

/** Full card details returned by the card detail API, including comments. */
export interface CardDetail extends Card {
  comments: CardComment[];
}

export interface CardComment {
  id: string;
  content: string;
  authorId: string;
  author: CardAssignee;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Drag and Drop types ----

export type DragItemType = 'card' | 'list';

export interface DragItem {
  type: DragItemType;
  id: string;
  listId: string; // source list id (for cards)
  index: number; // visual index in the source list
}

export interface DropTarget {
  listId: string;
  index: number; // target visual index in the destination list
}

export interface CardMoveResult {
  cardId: string;
  fromListId: string;
  toListId: string;
  newPosition: string; // fractional index
}

// ---- Server action payloads ----

export interface ReorderCardInput {
  cardId: string;
  targetListId: string;
  /** Position key of the card above the drop target, or null if dropping at the top */
  afterPosition: string | null;
  /** Position key of the card below the drop target, or null if dropping at the bottom */
  beforePosition: string | null;
}

export interface ReorderCardResult {
  success: boolean;
  card: Pick<Card, 'id' | 'listId' | 'position'> | null;
  error?: string;
}

export interface UpdateCardInput {
  cardId: string;
  boardId: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null; // ISO string or null to clear
  assigneeId?: string | null; // user id or null to unassign
}

export interface UpdateCardResult {
  success: boolean;
  card: Pick<Card, 'id' | 'title' | 'description' | 'dueDate' | 'assigneeId'> | null;
  error?: string;
}
