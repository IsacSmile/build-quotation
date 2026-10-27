import { AppState, Block, Quotation, Section, Settings } from '../types';
import { createDefaultQuotation, createEmptyBlock, generateId } from './storage';

export type AppAction =
  | { type: 'SET_ACTIVE_QUOTATION'; payload: { id: string } }
  | { type: 'CREATE_QUOTATION'; payload?: { title?: string } }
  | { type: 'DUPLICATE_QUOTATION'; payload: { id: string } }
  | { type: 'DELETE_QUOTATION'; payload: { id: string } }
  | { type: 'UPDATE_QUOTATION_TITLE'; payload: { id: string; title: string } }
  | { type: 'UPDATE_SECTION_HEADING'; payload: { quotationId: string; sectionId: string; heading: string } }
  | { type: 'ADD_SECTION'; payload: { quotationId: string; afterSectionId?: string; heading?: string } }
  | { type: 'MOVE_SECTION'; payload: { quotationId: string; sectionId: string; direction: 'up' | 'down' } }
  | { type: 'DELETE_SECTION'; payload: { quotationId: string; sectionId: string } }
  | { type: 'ADD_BLOCK'; payload: { quotationId: string; sectionId: string; type: Block['type']; afterBlockId?: string } }
  | { type: 'UPDATE_BLOCK'; payload: { quotationId: string; sectionId: string; blockId: string; block: Partial<Block> } }
  | { type: 'MOVE_BLOCK'; payload: { quotationId: string; sectionId: string; blockId: string; direction: 'up' | 'down' } }
  | { type: 'DELETE_BLOCK'; payload: { quotationId: string; sectionId: string; blockId: string } }
  | { type: 'CHANGE_BLOCK_TYPE'; payload: { quotationId: string; sectionId: string; blockId: string; newType: Block['type'] } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_SAVED_STATUS'; payload: boolean };

function convertBlockType(oldBlock: Block, newType: Block['type']): Block {
  const id = oldBlock.id;
  if (oldBlock.type === newType) return oldBlock;

  // Extract text lines from old block
  let lines: string[] = [];
  if (oldBlock.type === 'text') {
    lines = oldBlock.content.split('\n');
  } else if (oldBlock.type === 'bullets' || oldBlock.type === 'numbered') {
    lines = [...oldBlock.items];
  } else if (oldBlock.type === 'group') {
    lines = oldBlock.title ? [oldBlock.title, ...oldBlock.items] : [...oldBlock.items];
  }

  if (lines.length === 0) {
    lines = [''];
  }

  switch (newType) {
    case 'text':
      return { id, type: 'text', content: lines.join('\n') };
    case 'bullets':
      return { id, type: 'bullets', items: lines };
    case 'numbered':
      return { id, type: 'numbered', items: lines };
    case 'group': {
      const title = lines[0] || 'Feature Title';
      const items = lines.slice(1).length > 0 ? lines.slice(1) : [''];
      return { id, type: 'group', title, items };
    }
  }
}

function updateQuotation(
  state: AppState,
  quotationId: string,
  updater: (q: Quotation) => Quotation
): AppState {
  const nextQuotations = state.quotations.map((q) => {
    if (q.id === quotationId) {
      const updated = updater(q);
      return { ...updated, updatedAt: Date.now() };
    }
    return q;
  });

  return {
    ...state,
    quotations: nextQuotations,
    isSaved: false,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SAVED_STATUS':
      return { ...state, isSaved: action.payload };

    case 'SET_ACTIVE_QUOTATION':
      return {
        ...state,
        activeQuotationId: action.payload.id,
      };

    case 'CREATE_QUOTATION': {
      const newQuotation = createDefaultQuotation(action.payload?.title || 'Untitled Quotation');
      return {
        ...state,
        quotations: [newQuotation, ...state.quotations],
        activeQuotationId: newQuotation.id,
        isSaved: false,
      };
    }

    case 'DUPLICATE_QUOTATION': {
      const source = state.quotations.find((q) => q.id === action.payload.id);
      if (!source) return state;

      const duplicate: Quotation = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateId(),
        title: `${source.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Assign fresh IDs to sections and blocks in duplicate
      duplicate.sections = duplicate.sections.map((sec) => ({
        ...sec,
        id: generateId(),
        blocks: sec.blocks.map((blk) => ({
          ...blk,
          id: generateId(),
        })),
      }));

      const sourceIndex = state.quotations.findIndex((q) => q.id === action.payload.id);
      const nextQuotations = [...state.quotations];
      nextQuotations.splice(sourceIndex + 1, 0, duplicate);

      return {
        ...state,
        quotations: nextQuotations,
        activeQuotationId: duplicate.id,
        isSaved: false,
      };
    }

    case 'DELETE_QUOTATION': {
      if (state.quotations.length <= 1) {
        // Always keep at least one quotation
        const fresh = createDefaultQuotation('Untitled Quotation');
        return {
          ...state,
          quotations: [fresh],
          activeQuotationId: fresh.id,
          isSaved: false,
        };
      }

      const nextQuotations = state.quotations.filter((q) => q.id !== action.payload.id);
      const nextActiveId =
        state.activeQuotationId === action.payload.id
          ? nextQuotations[0].id
          : state.activeQuotationId;

      return {
        ...state,
        quotations: nextQuotations,
        activeQuotationId: nextActiveId,
        isSaved: false,
      };
    }

    case 'UPDATE_QUOTATION_TITLE':
      return updateQuotation(state, action.payload.id, (q) => ({
        ...q,
        title: action.payload.title,
      }));

    case 'UPDATE_SECTION_HEADING':
      return updateQuotation(state, action.payload.quotationId, (q) => ({
        ...q,
        sections: q.sections.map((sec) =>
          sec.id === action.payload.sectionId
            ? { ...sec, heading: action.payload.heading }
            : sec
        ),
      }));

    case 'ADD_SECTION': {
      return updateQuotation(state, action.payload.quotationId, (q) => {
        const newSection: Section = {
          id: generateId(),
          heading: action.payload.heading || '',
          blocks: [createEmptyBlock('text')],
        };

        const afterId = action.payload.afterSectionId;
        if (!afterId) {
          return {
            ...q,
            sections: [...q.sections, newSection],
          };
        }

        const index = q.sections.findIndex((s) => s.id === afterId);
        if (index === -1) {
          return { ...q, sections: [...q.sections, newSection] };
        }

        const next = [...q.sections];
        next.splice(index + 1, 0, newSection);
        return { ...q, sections: next };
      });
    }

    case 'MOVE_SECTION': {
      return updateQuotation(state, action.payload.quotationId, (q) => {
        const index = q.sections.findIndex((s) => s.id === action.payload.sectionId);
        if (index === -1) return q;

        const targetIndex = action.payload.direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= q.sections.length) return q;

        const next = [...q.sections];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);
        return { ...q, sections: next };
      });
    }

    case 'DELETE_SECTION': {
      return updateQuotation(state, action.payload.quotationId, (q) => ({
        ...q,
        sections: q.sections.filter((s) => s.id !== action.payload.sectionId),
      }));
    }

    case 'ADD_BLOCK': {
      return updateQuotation(state, action.payload.quotationId, (q) => {
        const newBlock = createEmptyBlock(action.payload.type);

        const nextSections = q.sections.map((sec) => {
          if (sec.id !== action.payload.sectionId) return sec;

          if (!action.payload.afterBlockId) {
            return {
              ...sec,
              blocks: [...sec.blocks, newBlock],
            };
          }

          const index = sec.blocks.findIndex((b) => b.id === action.payload.afterBlockId);
          if (index === -1) {
            return { ...sec, blocks: [...sec.blocks, newBlock] };
          }

          const nextBlocks = [...sec.blocks];
          nextBlocks.splice(index + 1, 0, newBlock);
          return { ...sec, blocks: nextBlocks };
        });

        return { ...q, sections: nextSections };
      });
    }

    case 'UPDATE_BLOCK': {
      return updateQuotation(state, action.payload.quotationId, (q) => ({
        ...q,
        sections: q.sections.map((sec) => {
          if (sec.id !== action.payload.sectionId) return sec;
          return {
            ...sec,
            blocks: sec.blocks.map((blk) =>
              blk.id === action.payload.blockId
                ? ({ ...blk, ...action.payload.block } as Block)
                : blk
            ),
          };
        }),
      }));
    }

    case 'MOVE_BLOCK': {
      return updateQuotation(state, action.payload.quotationId, (q) => ({
        ...q,
        sections: q.sections.map((sec) => {
          if (sec.id !== action.payload.sectionId) return sec;
          const index = sec.blocks.findIndex((b) => b.id === action.payload.blockId);
          if (index === -1) return sec;

          const targetIndex = action.payload.direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= sec.blocks.length) return sec;

          const nextBlocks = [...sec.blocks];
          const [moved] = nextBlocks.splice(index, 1);
          nextBlocks.splice(targetIndex, 0, moved);
          return { ...sec, blocks: nextBlocks };
        }),
      }));
    }

    case 'DELETE_BLOCK': {
      return updateQuotation(state, action.payload.quotationId, (q) => ({
        ...q,
        sections: q.sections.map((sec) => {
          if (sec.id !== action.payload.sectionId) return sec;
          return {
            ...sec,
            blocks: sec.blocks.filter((b) => b.id !== action.payload.blockId),
          };
        }),
      }));
    }

    case 'CHANGE_BLOCK_TYPE': {
      return updateQuotation(state, action.payload.quotationId, (q) => ({
        ...q,
        sections: q.sections.map((sec) => {
          if (sec.id !== action.payload.sectionId) return sec;
          return {
            ...sec,
            blocks: sec.blocks.map((blk) =>
              blk.id === action.payload.blockId
                ? convertBlockType(blk, action.payload.newType)
                : blk
            ),
          };
        }),
      }));
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
          logo: {
            ...state.settings.logo,
            ...(action.payload.logo || {}),
          },
          bank: {
            ...state.settings.bank,
            ...(action.payload.bank || {}),
          },
        },
        isSaved: false,
      };
    }

    default:
      return state;
  }
}
