import React, { useState } from 'react';
import { Block, Section as SectionType } from '../types';
import { SectionHeading } from './SectionHeading';
import { TextBlock } from './blocks/TextBlock';
import { BulletsBlock } from './blocks/BulletsBlock';
import { NumberedBlock } from './blocks/NumberedBlock';
import { GroupBlock } from './blocks/GroupBlock';
import { BlockControls } from './BlockControls';
import { BlockPicker } from './BlockPicker';
import { generateId } from '../store/storage';

interface SectionProps {
  section: SectionType;
  isFirst: boolean;
  isLast: boolean;
  autoFocusHeading?: boolean;
  onUpdateHeading: (heading: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAddBlock: (type: Block['type'], afterBlockId?: string, id?: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDeleteBlock: (blockId: string) => void;
  onChangeBlockType: (blockId: string, newType: Block['type']) => void;
}

export const Section: React.FC<SectionProps> = ({
  section,
  isFirst,
  isLast,
  autoFocusHeading = false,
  onUpdateHeading,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddBlock,
  onUpdateBlock,
  onMoveBlock,
  onDeleteBlock,
  onChangeBlockType,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newlyAddedBlockId, setNewlyAddedBlockId] = useState<string | null>(null);

  // Auto-number GroupBlocks within this section
  let groupCounter = 0;

  const handleAddBlock = (type: Block['type']) => {
    const newId = generateId();
    setNewlyAddedBlockId(newId);
    onAddBlock(type, undefined, newId);
  };

  return (
    <div className="paper-section" data-section-id={section.id}>
      {/* External Section Controls in left margin */}
      <div className="section-controls-wrapper no-print" aria-label="Section management controls">
        <div className="section-controls">
          <button
            type="button"
            className="section-ctrl-btn"
            onClick={onMoveUp}
            disabled={isFirst}
            title={isFirst ? 'Already at top' : 'Move section up'}
            aria-label="Move section up"
          >
            ▲
          </button>
          <button
            type="button"
            className="section-ctrl-btn"
            onClick={onMoveDown}
            disabled={isLast}
            title={isLast ? 'Already at bottom' : 'Move section down'}
            aria-label="Move section down"
          >
            ▼
          </button>
          <button
            type="button"
            className="section-ctrl-btn section-ctrl-btn--delete"
            onClick={() => setConfirmDelete(true)}
            title="Delete section"
            aria-label="Delete section"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Inline Delete Confirmation Banner */}
      {confirmDelete && (
        <div className="section-delete-confirm-banner no-print" role="alert">
          <span className="section-delete-confirm-text">Delete this section?</span>
          <div className="section-delete-confirm-actions">
            <button
              type="button"
              className="section-confirm-btn section-confirm-btn--yes"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              Yes
            </button>
            <button
              type="button"
              className="section-confirm-btn section-confirm-btn--no"
              onClick={() => setConfirmDelete(false)}
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Section Heading Bar */}
      <SectionHeading
        heading={section.heading}
        onUpdate={onUpdateHeading}
        autoFocus={autoFocusHeading}
      />

      {/* Section Blocks Container */}
      <div className="section-body">
        {section.blocks.map((block, idx) => {
          const isFirstBlock = idx === 0;
          const isLastBlock = idx === section.blocks.length - 1;
          const isNewlyAdded = block.id === newlyAddedBlockId;

          let blockComponent: React.ReactNode = null;
          if (block.type === 'text') {
            blockComponent = (
              <TextBlock
                block={block}
                autoFocus={isNewlyAdded}
                onUpdate={(content) => onUpdateBlock(block.id, { content })}
              />
            );
          } else if (block.type === 'bullets') {
            blockComponent = (
              <BulletsBlock
                block={block}
                autoFocus={isNewlyAdded}
                onUpdate={(items) => onUpdateBlock(block.id, { items })}
                onDeleteBlock={() => onDeleteBlock(block.id)}
              />
            );
          } else if (block.type === 'numbered') {
            blockComponent = (
              <NumberedBlock
                block={block}
                autoFocus={isNewlyAdded}
                onUpdate={(items) => onUpdateBlock(block.id, { items })}
                onDeleteBlock={() => onDeleteBlock(block.id)}
              />
            );
          } else if (block.type === 'group') {
            groupCounter++;
            const currentGroupNum = groupCounter;
            blockComponent = (
              <GroupBlock
                block={block}
                groupNumber={currentGroupNum}
                autoFocus={isNewlyAdded}
                onUpdate={(updatedGroup) => onUpdateBlock(block.id, updatedGroup)}
                onDeleteBlock={() => onDeleteBlock(block.id)}
              />
            );
          }

          return (
            <div key={block.id} className="paper-block-item" data-block-id={block.id}>
              {/* Block content */}
              <div className="paper-block-content">{blockComponent}</div>

              {/* Block Controls in right margin outside content area */}
              <BlockControls
                block={block}
                isFirst={isFirstBlock}
                isLast={isLastBlock}
                onMoveUp={() => onMoveBlock(block.id, 'up')}
                onMoveDown={() => onMoveBlock(block.id, 'down')}
                onChangeType={(type) => onChangeBlockType(block.id, type)}
                onDelete={() => onDeleteBlock(block.id)}
              />
            </div>
          );
        })}

        {/* BlockPicker at the bottom of the section */}
        <BlockPicker
          onSelectType={handleAddBlock}
          hasBlocks={section.blocks.length > 0}
        />
      </div>
    </div>
  );
};
