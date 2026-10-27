import React, { useEffect, useRef, useState } from 'react';
import { Block } from '../types';

interface BlockPickerProps {
  onSelectType: (type: Block['type']) => void;
  hasBlocks: boolean;
}

const BLOCK_OPTIONS: { type: Block['type']; label: string; icon: string; description: string }[] = [
  { type: 'text', label: 'Text', icon: '¶', description: 'Paragraph with formatting' },
  { type: 'bullets', label: 'Bullets', icon: '•', description: 'Bullet list items' },
  { type: 'numbered', label: 'Numbered', icon: '1.', description: 'Numbered list items' },
  { type: 'group', label: 'Group', icon: '1•', description: 'Numbered feature with bullets' },
];

export const BlockPicker: React.FC<BlockPickerProps> = ({ onSelectType, hasBlocks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % BLOCK_OPTIONS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + BLOCK_OPTIONS.length) % BLOCK_OPTIONS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = BLOCK_OPTIONS[activeIndex];
        if (selected) {
          onSelectType(selected.type);
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeIndex, onSelectType]);

  const handleSelect = (type: Block['type']) => {
    onSelectType(type);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="block-picker-container no-print">
      {hasBlocks ? (
        <button
          ref={triggerRef}
          type="button"
          className="add-block-btn"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setActiveIndex(0);
          }}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          title="Add block"
        >
          <span className="add-block-icon">+</span>
          <span>Add block</span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="add-first-block-btn"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setActiveIndex(0);
          }}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          + Add your first block
        </button>
      )}

      {isOpen && (
        <div className="block-picker-popover" role="menu" aria-label="Select block type">
          {BLOCK_OPTIONS.map((opt, idx) => (
            <button
              key={opt.type}
              type="button"
              className={`block-picker-option ${activeIndex === idx ? 'block-picker-option--active' : ''}`}
              onClick={() => handleSelect(opt.type)}
              onMouseEnter={() => setActiveIndex(idx)}
              role="menuitem"
            >
              <span className="block-picker-option-icon" aria-hidden="true">{opt.icon}</span>
              <div className="block-picker-option-info">
                <span className="block-picker-option-label">{opt.label}</span>
                <span className="block-picker-option-desc">{opt.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
