import React, { useState } from 'react';
import { NumberedBlock as NumberedBlockType } from '../../types';
import { EditableText } from '../EditableText';
import { splitPasteLines } from '../../utils/listHelpers';

interface NumberedBlockProps {
  block: NumberedBlockType;
  onUpdate: (items: string[]) => void;
  onDeleteBlock: () => void;
  autoFocus?: boolean;
}

export const NumberedBlock: React.FC<NumberedBlockProps> = ({
  block,
  onUpdate,
  onDeleteBlock,
  autoFocus = false,
}) => {
  const [focusIndex, setFocusIndex] = useState<number | null>(autoFocus ? 0 : null);

  const handleItemCommit = (index: number, val: string) => {
    const next = [...block.items];
    next[index] = val;
    onUpdate(next);
  };

  const handleKeyDownItem = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextItems = [...block.items];
      nextItems.splice(index + 1, 0, '');
      onUpdate(nextItems);
      setFocusIndex(index + 1);
      return;
    }

    if (e.key === 'Backspace') {
      const currentText = e.currentTarget.textContent || '';
      if (currentText === '' || currentText.trim() === '') {
        e.preventDefault();
        if (block.items.length <= 1) {
          onDeleteBlock();
          return;
        }
        const nextItems = block.items.filter((_, i) => i !== index);
        onUpdate(nextItems);
        setFocusIndex(Math.max(0, index - 1));
        return;
      }
    }

    if (e.key === 'ArrowUp' && index > 0) {
      const sel = window.getSelection();
      if (sel && sel.focusOffset === 0) {
        e.preventDefault();
        setFocusIndex(index - 1);
        return;
      }
    }

    if (e.key === 'ArrowDown' && index < block.items.length - 1) {
      const sel = window.getSelection();
      const textLen = (e.currentTarget.textContent || '').length;
      if (sel && sel.focusOffset >= textLen) {
        e.preventDefault();
        setFocusIndex(index + 1);
        return;
      }
    }
  };

  const handlePasteItem = (rawText: string, index: number) => {
    const lines = splitPasteLines(rawText);
    if (lines.length > 1) {
      const nextItems = [...block.items];
      nextItems.splice(index, 1, ...lines);
      onUpdate(nextItems);
      setFocusIndex(index + lines.length - 1);
      return { handled: true, firstLine: lines[0] };
    }
    return false;
  };

  return (
    <ol className="block-numbered-list">
      {block.items.map((item, idx) => (
        <li key={idx} className="block-numbered-item">
          <span className="block-numbered-marker" aria-hidden="true">{idx + 1}.</span>
          <EditableText
            value={item}
            onCommit={(val) => handleItemCommit(idx, val)}
            placeholder="Numbered item..."
            multiline={false}
            autoFocus={focusIndex === idx}
            className="block-numbered-input"
            ariaLabel={`Numbered item ${idx + 1}`}
            renderBlurred={true}
            onKeyDownExtra={(e) => handleKeyDownItem(e, idx)}
            onPasteText={(text) => handlePasteItem(text, idx)}
          />
        </li>
      ))}
    </ol>
  );
};
