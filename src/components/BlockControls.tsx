import React, { useState } from 'react';
import { Block } from '../types';

interface BlockControlsProps {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChangeType: (type: Block['type']) => void;
  onDelete: () => void;
}

export function isBlockEmpty(block: Block): boolean {
  if (block.type === 'text') {
    return !block.content || block.content.trim() === '';
  }
  if (block.type === 'bullets' || block.type === 'numbered') {
    return block.items.length === 0 || (block.items.length === 1 && block.items[0].trim() === '');
  }
  if (block.type === 'group') {
    const titleEmpty = !block.title || block.title.trim() === '';
    const itemsEmpty = block.items.length === 0 || (block.items.length === 1 && block.items[0].trim() === '');
    return titleEmpty && itemsEmpty;
  }
  return true;
}

export const BlockControls: React.FC<BlockControlsProps> = ({
  block,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onChangeType,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (isBlockEmpty(block)) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="block-controls-wrapper no-print" aria-label="Block controls">
      {confirmDelete ? (
        <div className="block-delete-confirm-popup" role="alert">
          <span className="block-delete-confirm-prompt">Delete?</span>
          <button
            type="button"
            className="block-confirm-btn block-confirm-btn--yes"
            onClick={() => {
              setConfirmDelete(false);
              onDelete();
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="block-confirm-btn block-confirm-btn--no"
            onClick={() => setConfirmDelete(false)}
          >
            No
          </button>
        </div>
      ) : (
        <div className="block-controls-cluster">
          <button
            type="button"
            className="block-ctrl-btn block-ctrl-btn--up"
            onClick={onMoveUp}
            disabled={isFirst}
            title={isFirst ? 'Already at top' : 'Move block up'}
            aria-label="Move block up"
          >
            ▲
          </button>
          <button
            type="button"
            className="block-ctrl-btn block-ctrl-btn--down"
            onClick={onMoveDown}
            disabled={isLast}
            title={isLast ? 'Already at bottom' : 'Move block down'}
            aria-label="Move block down"
          >
            ▼
          </button>
          <select
            className="block-type-select"
            value={block.type}
            onChange={(e) => onChangeType(e.target.value as Block['type'])}
            title="Change block type"
            aria-label="Change block type"
          >
            <option value="text">Text</option>
            <option value="bullets">Bullets</option>
            <option value="numbered">Numbered</option>
            <option value="group">Group</option>
          </select>
          <button
            type="button"
            className="block-ctrl-btn block-ctrl-btn--delete"
            onClick={handleDeleteClick}
            title="Delete block"
            aria-label="Delete block"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
};
