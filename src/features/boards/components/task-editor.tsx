'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useCardDetail, useUpdateCard } from '../queries/use-card';
import type { UpdateCardInput } from '../types';

interface TaskEditorProps {
  boardId: string;
  cardId: string | null;
  onClose: () => void;
}

/**
 * Modal form for viewing and editing a task (card).
 *
 * Opens as a DaisyUI modal overlay. Fields are populated from the card detail
 * API and saved via the `updateCard` server action through React Query.
 *
 * Supports editing: title, description, due date, and assignee clearing.
 * Displays labels (read-only) and comments list.
 */
export function TaskEditor({ boardId, cardId, onClose }: TaskEditorProps) {
  const { data: card, isLoading, error } = useCardDetail(boardId, cardId);
  const updateMutation = useUpdateCard(boardId);

  // ---- Local form state (initialised from fetched card) ----
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync local state when card data arrives or changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? '');
      setDueDate(card.dueDate ? toDateInputValue(new Date(card.dueDate)) : '');
      setIsDirty(false);
    }
  }, [card]);

  // Show the modal when a card is selected
  useEffect(() => {
    if (cardId) {
      dialogRef.current?.showModal();
      // Focus the title field after a short delay (let the modal animate)
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [cardId]);

  // Close handler — also closes the <dialog>
  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  // Handle backdrop click (DaisyUI modal-backdrop pattern)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        handleClose();
      }
    },
    [handleClose],
  );

  // Escape key closes the modal
  useEffect(() => {
    const dialog = dialogRef.current;
    const handler = () => onClose();
    dialog?.addEventListener('close', handler);
    return () => dialog?.removeEventListener('close', handler);
  }, [onClose]);

  // ---- Form submission ----

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!cardId || !isDirty) return;

      const input: UpdateCardInput = {
        cardId,
        boardId,
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      const result = await updateMutation.mutateAsync(input);
      if (result.success) {
        setIsDirty(false);
      }
    },
    [cardId, boardId, title, description, dueDate, isDirty, updateMutation],
  );

  // Mark form as dirty when user changes fields
  const onFieldChange = useCallback(
    <T,>(setter: (v: T) => void) =>
      (value: T) => {
        setter(value);
        setIsDirty(true);
      },
    [],
  );

  if (!cardId) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
    >
      <div className="modal-box w-11/12 max-w-2xl bg-base-200 border border-base-300">
        {/* Close button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={handleClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="alert alert-error">
            <span>Failed to load card details. Please try again.</span>
          </div>
        )}

        {/* Card form */}
        {card && (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Title */}
            <div className="form-control">
              <label className="label" htmlFor="card-title">
                <span className="label-text font-semibold">Title</span>
              </label>
              <input
                ref={titleRef}
                id="card-title"
                type="text"
                className="input input-bordered w-full bg-base-100"
                value={title}
                onChange={(e) => onFieldChange(setTitle)(e.target.value)}
                required
                minLength={1}
                placeholder="Card title"
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label" htmlFor="card-description">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                id="card-description"
                className="textarea textarea-bordered w-full bg-base-100 min-h-[120px]"
                value={description}
                onChange={(e) =>
                  onFieldChange(setDescription)(e.target.value)
                }
                placeholder="Add a more detailed description…"
              />
            </div>

            {/* Due date */}
            <div className="form-control">
              <label className="label" htmlFor="card-due-date">
                <span className="label-text font-semibold">Due Date</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="card-due-date"
                  type="date"
                  className="input input-bordered bg-base-100 flex-1"
                  value={dueDate}
                  onChange={(e) =>
                    onFieldChange(setDueDate)(e.target.value)
                  }
                />
                {dueDate && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onFieldChange(setDueDate)('')}
                    aria-label="Clear due date"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Labels (read-only display) */}
            {card.labels.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Labels</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {card.labels.map(({ label }) => (
                    <span
                      key={label.id}
                      className="badge font-medium"
                      style={{
                        backgroundColor: label.color,
                        color: '#0f0f12',
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assignee display */}
            {card.assignee && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Assignee</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {initials(card.assignee.name)}
                  </div>
                  <span className="text-sm">
                    {card.assignee.name ?? 'Unknown'}
                  </span>
                </div>
              </div>
            )}

            {/* Comments (read-only list) */}
            {card.comments && card.comments.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Comments ({card.comments.length})
                  </span>
                </label>
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                  {card.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-base-100 rounded-lg p-3 border border-base-300"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold">
                          {initials(comment.author.name)}
                        </div>
                        <span className="text-xs font-medium">
                          {comment.author.name ?? 'Unknown'}
                        </span>
                        <span className="text-xs opacity-40">
                          {new Date(comment.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs opacity-40 flex gap-4">
              <span>
                Created{' '}
                {new Date(card.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>
                Updated{' '}
                {new Date(card.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Action buttons */}
            <div className="modal-action mt-2">
              {updateMutation.error && (
                <span className="text-error text-sm mr-auto">
                  Failed to save. Please try again.
                </span>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${
                  updateMutation.isPending ? 'loading' : ''
                }`}
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

// ---- Helpers ----

function toDateInputValue(date: Date): string {
  // Format as YYYY-MM-DD for <input type="date">
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
