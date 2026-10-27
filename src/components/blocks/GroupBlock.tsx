import React, { useState } from 'react';
import { GroupBlock as GroupBlockType } from '../../types';
import { EditableText } from '../EditableText';
import { splitPasteLines } from '../../utils/listHelpers';

interface GroupBlockProps {
  block: GroupBlockType;
  groupNumber: number;
  onUpdate: (block: GroupBlockType) => void;
  onDeleteBlock: () => void;
  autoFocus?: boolean;
}

export const GroupBlock: React.FC<GroupBlockProps> = ({
  block,
  groupNumber,
  onUpdate,
  onDeleteBlock,
  autoFocus = false,
}) => {
  const [bulletFocusIndex, setBulletFocusIndex] = useState<number | null>(null);

  const handleTitleCommit = (title: string) => {
    onUpdate({ ...block, title });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (block.items.length === 0) {
        onUpdate({ ...block, items: [''] });
      }
      setBulletFocusIndex(0);
    }
  };

  const handleItemCommit = (index: number, val: string) => {
    const next = [...block.items];
    next[index] = val;
    onUpdate({ ...block, items: next });
  };

  const handleKeyDownItem = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextItems = [...block.items];
      nextItems.splice(index + 1, 0, '');
      onUpdate({ ...block, items: nextItems });
      setBulletFocusIndex(index + 1);
      return;
    }

    if (e.key === 'Backspace') {
      const currentText = e.currentTarget.textContent || '';
      if (currentText === '' || currentText.trim() === '') {
        e.preventDefault();
        if (block.items.length <= 1) {
          // If only 1 bullet left and it's empty, and title is also empty, delete block
          if (!block.title || block.title.trim() === '') {
            onDeleteBlock();
            return;
          }
        }
        const nextItems = block.items.filter((_, i) => i !== index);
        onUpdate({ ...block, items: nextItems });
        setBulletFocusIndex(Math.max(0, index - 1));
        return;
      }
    }

    if (e.key === 'ArrowUp') {
      const sel = window.getSelection();
      if (sel && sel.focusOffset === 0) {
        e.preventDefault();
        if (index === 0) {
          // Move focus to title
          setBulletFocusIndex(null);
        } else {
          setBulletFocusIndex(index - 1);
        }
        return;
      }
    }

    if (e.key === 'ArrowDown' && index < block.items.length - 1) {
      const sel = window.getSelection();
      const textLen = (e.currentTarget.textContent || '').length;
      if (sel && sel.focusOffset >= textLen) {
        e.preventDefault();
        setBulletFocusIndex(index + 1);
        return;
      }
    }
  };

  const handlePasteItem = (rawText: string, index: number) => {
    const lines = splitPasteLines(rawText);
    if (lines.length > 1) {
      const nextItems = [...block.items];
      nextItems.splice(index, 1, ...lines);
      onUpdate({ ...block, items: nextItems });
      setBulletFocusIndex(index + lines.length - 1);
      return { handled: true, firstLine: lines[0] };
    }
    return false;
  };

  return (
    <div className="block-group-wrapper">
      {/* Title line in bold-italic with auto-numbered "N." */}
      <div className="block-group-title-row">
        <span className="block-group-number" aria-hidden="true">
          <strong><em>{groupNumber}.</em></strong>
        </span>
        <EditableText
          value={block.title}
          onCommit={handleTitleCommit}
          placeholder="Group title"
          multiline={false}
          autoFocus={autoFocus && bulletFocusIndex === null}
          className="block-group-title-input"
          ariaLabel={`Group ${groupNumber} title`}
          renderBlurred={true}
          onKeyDownExtra={handleTitleKeyDown}
        />
      </div>

      {/* Bullets beneath title */}
      <ul className="block-bullets-list block-group-bullets">
        {block.items.map((item, idx) => (
          <li key={idx} className="block-bullet-item">
            <span className="block-bullet-marker" aria-hidden="true">•</span>
            <EditableText
              value={item}
              onCommit={(val) => handleItemCommit(idx, val)}
              placeholder="Feature item..."
              multiline={false}
              autoFocus={bulletFocusIndex === idx}
              className="block-bullet-input"
              ariaLabel={`Group ${groupNumber} bullet ${idx + 1}`}
              renderBlurred={true}
              onKeyDownExtra={(e) => handleKeyDownItem(e, idx)}
              onPasteText={(text) => handlePasteItem(text, idx)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
