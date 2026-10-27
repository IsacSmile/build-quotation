import React, { useEffect, useRef, useState } from 'react';
import { Block } from '../types';
import { useQuotation } from '../store/context';
import { generateId } from '../store/storage';
import { PaperHeader } from './PaperHeader';
import { Section } from './Section';
import { PaymentFooter } from './PaymentFooter';

interface PaperProps {
  onOpenSettings?: () => void;
}

export const Paper: React.FC<PaperProps> = ({ onOpenSettings }) => {
  const { activeQuotation, dispatch } = useQuotation();
  const [newlyAddedSectionId, setNewlyAddedSectionId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(1123);

  // Responsive scaling for screens narrower than 794px
  useEffect(() => {
    const updateDimensions = () => {
      const availableWidth = window.innerWidth - 32; // 16px margin on each side
      const targetWidth = 794;
      if (availableWidth < targetWidth) {
        setScale(Math.max(0.3, availableWidth / targetWidth));
      } else {
        setScale(1);
      }

      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.offsetHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Observe sheet height changes to adjust wrapper height when scaled
    const observer = new ResizeObserver(() => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.offsetHeight);
      }
    });

    if (sheetRef.current) {
      observer.observe(sheetRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Ensure active quotation exists
  useEffect(() => {
    if (!activeQuotation) {
      dispatch({ type: 'CREATE_QUOTATION' });
    }
  }, [activeQuotation, dispatch]);

  if (!activeQuotation) return null;

  const handleUpdateHeading = (sectionId: string, heading: string) => {
    dispatch({
      type: 'UPDATE_SECTION_HEADING',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        heading,
      },
    });
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    dispatch({
      type: 'MOVE_SECTION',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        direction,
      },
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    dispatch({
      type: 'DELETE_SECTION',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
      },
    });
  };

  const handleAddSection = (afterSectionId?: string) => {
    // Generate new section ID and pass to reducer so focus matches
    const newSectionId = generateId();
    setNewlyAddedSectionId(newSectionId);

    dispatch({
      type: 'ADD_SECTION',
      payload: {
        quotationId: activeQuotation.id,
        afterSectionId,
        heading: '',
        id: newSectionId,
      },
    });
  };

  const handleAddBlock = (sectionId: string, type: Block['type'], afterBlockId?: string, id?: string) => {
    dispatch({
      type: 'ADD_BLOCK',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        type,
        afterBlockId,
        id,
      },
    });
  };

  const handleUpdateBlock = (sectionId: string, blockId: string, updates: Partial<Block>) => {
    dispatch({
      type: 'UPDATE_BLOCK',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        blockId,
        block: updates,
      },
    });
  };

  const handleMoveBlock = (sectionId: string, blockId: string, direction: 'up' | 'down') => {
    dispatch({
      type: 'MOVE_BLOCK',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        blockId,
        direction,
      },
    });
  };

  const handleDeleteBlock = (sectionId: string, blockId: string) => {
    dispatch({
      type: 'DELETE_BLOCK',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        blockId,
      },
    });
  };

  const handleChangeBlockType = (sectionId: string, blockId: string, newType: Block['type']) => {
    dispatch({
      type: 'CHANGE_BLOCK_TYPE',
      payload: {
        quotationId: activeQuotation.id,
        sectionId,
        blockId,
        newType,
      },
    });
  };

  return (
    <div className="paper-viewport">
      <div
        className="paper-scale-container"
        style={{
          width: scale < 1 ? `${Math.round(794 * scale)}px` : '794px',
          height: scale < 1 ? `${Math.round(sheetHeight * scale)}px` : 'auto',
        }}
      >
        <div
          ref={sheetRef}
          className="paper-sheet"
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top center',
          }}
        >
          {/* Header */}
          <PaperHeader onOpenSettings={onOpenSettings} />

          {/* Sections list with insert dividers */}
          <div className="paper-sections-container">
            {activeQuotation.sections.map((section, index) => {
              const isFirst = index === 0;
              const isLast = index === activeQuotation.sections.length - 1;
              const prevSectionId = index > 0 ? activeQuotation.sections[index - 1].id : undefined;

              return (
                <React.Fragment key={section.id}>
                  {/* Insert divider between sections (hover to reveal) */}
                  {index > 0 && (
                    <div className="section-insert-line-wrapper">
                      <button
                        type="button"
                        className="section-insert-btn"
                        onClick={() => handleAddSection(prevSectionId)}
                        title="Insert section here"
                        aria-label="Insert section between"
                      >
                        <span className="section-insert-icon">+</span>
                        <span className="section-insert-text">Insert section</span>
                      </button>
                    </div>
                  )}

                  <Section
                    section={section}
                    isFirst={isFirst}
                    isLast={isLast}
                    autoFocusHeading={section.id === newlyAddedSectionId || (!section.heading && newlyAddedSectionId !== null)}
                    onUpdateHeading={(h) => handleUpdateHeading(section.id, h)}
                    onMoveUp={() => handleMoveSection(section.id, 'up')}
                    onMoveDown={() => handleMoveSection(section.id, 'down')}
                    onDelete={() => handleDeleteSection(section.id)}
                    onAddBlock={(type, afterBlockId, id) => handleAddBlock(section.id, type, afterBlockId, id)}
                    onUpdateBlock={(blockId, updates) => handleUpdateBlock(section.id, blockId, updates)}
                    onMoveBlock={(blockId, dir) => handleMoveBlock(section.id, blockId, dir)}
                    onDeleteBlock={(blockId) => handleDeleteBlock(section.id, blockId)}
                    onChangeBlockType={(blockId, newType) => handleChangeBlockType(section.id, blockId, newType)}
                  />
                </React.Fragment>
              );
            })}
          </div>

          {/* + Add section button at the end of the body */}
          <div className="add-section-bottom-wrapper">
            <button
              type="button"
              className="add-section-bottom-btn"
              onClick={() => handleAddSection(activeQuotation.sections[activeQuotation.sections.length - 1]?.id)}
              aria-label="Add new section"
            >
              <span className="add-section-icon">+</span>
              <span>Add section</span>
            </button>
          </div>

          {/* Payment Footer (reads current settings, not stored in quotation) */}
          <PaymentFooter onOpenSettings={onOpenSettings} />
        </div>
      </div>

      {/* Small grey note under the sheet */}
      <div className="paper-pagination-note">
        PDF will paginate automatically.
      </div>
    </div>
  );
};
