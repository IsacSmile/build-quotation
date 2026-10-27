import { AppState, Block, Quotation, Section, Settings } from '../types';
import { DEFAULT_SETTINGS, createDefaultQuotation, createEmptyBlock, deriveClientTitle, generateId } from './storage';

export type AppAction =
  | { type: 'SET_ACTIVE_QUOTATION'; payload: { id: string } }
  | { type: 'CREATE_QUOTATION'; payload?: { title?: string } }
  | { type: 'DUPLICATE_QUOTATION'; payload: { id: string } }
  | { type: 'DELETE_QUOTATION'; payload: { id: string } }
  | { type: 'UPDATE_QUOTATION_TITLE'; payload: { id: string; title: string; isManual?: boolean } }
  | { type: 'UPDATE_SECTION_HEADING'; payload: { quotationId: string; sectionId: string; heading: string } }
  | { type: 'ADD_SECTION'; payload: { quotationId: string; afterSectionId?: string; heading?: string; id?: string } }
  | { type: 'MOVE_SECTION'; payload: { quotationId: string; sectionId: string; direction: 'up' | 'down' } }
  | { type: 'DELETE_SECTION'; payload: { quotationId: string; sectionId: string } }
  | { type: 'ADD_BLOCK'; payload: { quotationId: string; sectionId: string; type: Block['type']; afterBlockId?: string; id?: string } }
  | { type: 'UPDATE_BLOCK'; payload: { quotationId: string; sectionId: string; blockId: string; block: Partial<Block> } }
  | { type: 'MOVE_BLOCK'; payload: { quotationId: string; sectionId: string; blockId: string; direction: 'up' | 'down' } }
  | { type: 'DELETE_BLOCK'; payload: { quotationId: string; sectionId: string; blockId: string } }
  | { type: 'CHANGE_BLOCK_TYPE'; payload: { quotationId: string; sectionId: string; blockId: string; newType: Block['type'] } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'RESET_SETTINGS' }
  | { type: 'SET_SAVED_STATUS'; payload: boolean }
  | { type: 'SET_STORAGE_ERROR'; payload: boolean };

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

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function isQuotationContentEqual(a: Quotation, b: Quotation): boolean {
  if (a.title !== b.title) return false;
  if (Boolean(a.titleManual) !== Boolean(b.titleManual)) return false;
  if (a.sections.length !== b.sections.length) return false;

  for (let i = 0; i < a.sections.length; i++) {
    const s1 = a.sections[i];
    const s2 = b.sections[i];
    if (s1.id !== s2.id || s1.heading !== s2.heading) return false;
    if (s1.blocks.length !== s2.blocks.length) return false;

    for (let j = 0; j < s1.blocks.length; j++) {
      const b1 = s1.blocks[j];
      const b2 = s2.blocks[j];
      if (b1.id !== b2.id || b1.type !== b2.type) return false;

      if (b1.type === 'text') {
        if (b1.content !== (b2 as typeof b1).content) return false;
      } else if (b1.type === 'bullets' || b1.type === 'numbered') {
        const items2 = (b2 as typeof b1).items;
        if (!arraysEqual(b1.items, items2)) return false;
      } else if (b1.type === 'group') {
        const g2 = b2 as typeof b1;
        if (b1.title !== g2.title) return false;
        if (!arraysEqual(b1.items, g2.items)) return false;
      }
    }
  }

  return true;
}

function isSettingsEqual(a: Settings, b: Settings): boolean {
  return (
    a.agencyName === b.agencyName &&
    a.address === b.address &&
    a.paymentEnabled === b.paymentEnabled &&
    a.qrImage === b.qrImage &&
    a.logo?.kind === b.logo?.kind &&
    a.logo?.src === b.logo?.src &&
    a.bank?.holder === b.bank?.holder &&
    a.bank?.bankName === b.bank?.bankName &&
    a.bank?.accountNo === b.bank?.accountNo &&
    a.bank?.ifsc === b.bank?.ifsc &&
    a.bank?.swift === b.bank?.swift &&
    a.bank?.upiId === b.bank?.upiId
  );
}

function updateQuotation(
  state: AppState,
  quotationId: string,
  updater: (q: Quotation) => Quotation
): AppState {
  const currentQuotation = state.quotations.find((q) => q.id === quotationId);
  if (!currentQuotation) return state;

  const updated = updater(currentQuotation);
  let nextTitle = updated.title;
  if (!updated.titleManual) {
    const derived = deriveClientTitle(updated.sections);
    nextTitle = derived;
  }

  const finalQuotation: Quotation = {
    ...updated,
    title: nextTitle,
  };

  // If quotation content did not actually change, return original state (NO-OP)
  if (isQuotationContentEqual(currentQuotation, finalQuotation)) {
    return state;
  }

  const nextQuotations = state.quotations.map((q) =>
    q.id === quotationId
      ? {
          ...finalQuotation,
          updatedAt: Date.now(),
        }
      : q
  );

  return {
    ...state,
    quotations: nextQuotations,
    isSaved: false,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  console.log('[REDUCER ACTION]', action.type, action);
  switch (action.type) {
    case 'SET_SAVED_STATUS':
      return { ...state, isSaved: action.payload };

    case 'SET_ACTIVE_QUOTATION':
      if (state.activeQuotationId === action.payload.id) return state;
      return {
        ...state,
        activeQuotationId: action.payload.id,
      };

    case 'CREATE_QUOTATION': {
      const newQuotation = createDefaultQuotation(action.payload?.title);
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
        id: generateId(),
        title: `${source.title} (copy)`,
        titleManual: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sections: source.sections.map((sec) => ({
          ...sec,
          id: generateId(),
          blocks: sec.blocks.map((blk) => ({
            ...blk,
            id: generateId(),
          })),
        })),
      };

      return {
        ...state,
        quotations: [duplicate, ...state.quotations],
        // Stays in list (does NOT switch active quotation)
        isSaved: false,
      };
    }

    case 'DELETE_QUOTATION': {
      if (state.quotations.length <= 1) {
        // Deleting the last remaining quotation creates a fresh default quotation
        const fresh = createDefaultQuotation();
        return {
          ...state,
          quotations: [fresh],
          activeQuotationId: fresh.id,
          isSaved: false,
        };
      }

      const nextQuotations = state.quotations.filter((q) => q.id !== action.payload.id);

      // Deleting the ACTIVE quotation switches to the most recently updated remaining one:
      let nextActiveId = state.activeQuotationId;
      if (state.activeQuotationId === action.payload.id) {
        const sortedRemaining = [...nextQuotations].sort((a, b) => b.updatedAt - a.updatedAt);
        nextActiveId = sortedRemaining[0].id;
      }

      return {
        ...state,
        quotations: nextQuotations,
        activeQuotationId: nextActiveId,
        isSaved: false,
      };
    }

    case 'UPDATE_QUOTATION_TITLE': {
      const rawTitle = action.payload.title.slice(0, 80);
      return updateQuotation(state, action.payload.id, (q) => {
        if (!rawTitle || rawTitle.trim() === '') {
          // Clearing title manually resets titleManual to false!
          return {
            ...q,
            titleManual: false,
            title: deriveClientTitle(q.sections),
          };
        }
        return {
          ...q,
          titleManual: action.payload.isManual !== undefined ? action.payload.isManual : true,
          title: rawTitle,
        };
      });
    }

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
          id: action.payload.id || generateId(),
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
        const newBlock = {
          ...createEmptyBlock(action.payload.type),
          id: action.payload.id || generateId(),
        };

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
      const nextSettings: Settings = {
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
      };

      if (isSettingsEqual(state.settings, nextSettings)) {
        return state;
      }

      return {
        ...state,
        settings: nextSettings,
        isSaved: false,
      };
    }

    case 'RESET_SETTINGS': {
      return {
        ...state,
        settings: {
          ...DEFAULT_SETTINGS,
          logo: { ...DEFAULT_SETTINGS.logo },
          bank: { ...DEFAULT_SETTINGS.bank },
        },
        isSaved: false,
      };
    }

    case 'SET_STORAGE_ERROR': {
      return {
        ...state,
        storageError: action.payload,
      };
    }

    default:
      return state;
  }
}
