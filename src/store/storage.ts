import { Block, Quotation, Section, Settings } from '../types';

export const STORAGE_KEYS = {
  QUOTATIONS: 'quotation_builder_quotations_v1',
  ACTIVE_ID: 'quotation_builder_active_id_v1',
  SETTINGS: 'quotation_builder_settings_v1',
};

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export const DEFAULT_SETTINGS: Settings = {
  agencyName: 'Faiz Dev & Co.',
  address: 'Kerala, Kazhakuttom, 695582',
  logo: {
    kind: 'prebuilt',
    src: '',
  },
  paymentEnabled: true,
  bank: {
    holder: 'Faiz Dev & Co.',
    bankName: 'Federal Bank',
    accountNo: '123456789012',
    ifsc: 'FDRL0001234',
    swift: 'FDRLINBBXXX',
    upiId: 'faizdev@upi',
  },
};

export function createDefaultQuotation(title = 'Acme Corp'): Quotation {
  const now = Date.now();
  const quotationSectionId = generateId();

  const sections: Section[] = [
    {
      id: quotationSectionId,
      heading: 'QUOTATION –',
      blocks: [
        {
          id: generateId(),
          type: 'text',
          content: 'Client: Acme Corp\nInstagram Page: @acmecorp\nBusiness Type: Creative Agency & E-Commerce',
        },
      ],
    },
    {
      id: generateId(),
      heading: 'Project Scope',
      blocks: [
        {
          id: generateId(),
          type: 'text',
          content: 'Design and end-to-end development of custom modern web platform with responsive layouts and seamless workflows.',
        },
      ],
    },
    {
      id: generateId(),
      heading: 'Estimated Cost',
      blocks: [
        {
          id: generateId(),
          type: 'text',
          content: 'Total Estimated Cost: **₹45,000**\nIncludes full design, frontend and backend implementation, testing, and deployment.',
        },
      ],
    },
    {
      id: generateId(),
      heading: 'Features Included',
      blocks: [
        {
          id: generateId(),
          type: 'group',
          title: 'Student Registration & Login',
          items: [
            'Student signup and verification via email OTP',
            'Secure password reset and personal profile dashboard',
          ],
        },
        {
          id: generateId(),
          type: 'group',
          title: 'Course Management & Video Player',
          items: [
            'Interactive video player with lesson progress tracking',
            'Downloadable resource files and lecture materials',
          ],
        },
        {
          id: generateId(),
          type: 'group',
          title: 'Payment Gateway & Certificates',
          items: [
            'Secure online payment integration with instant activation',
            'Automated verifiable certificate generation upon completion',
          ],
        },
      ],
    },
    {
      id: generateId(),
      heading: 'Timeline',
      blocks: [
        {
          id: generateId(),
          type: 'text',
          content: '• Phase 1: UX Wireframes & UI Approval (1 Week)\n• Phase 2: Core Development & Database Integration (2 Weeks)\n• Phase 3: QA Testing, Final Polish & Launch (1 Week)',
        },
      ],
    },
    {
      id: generateId(),
      heading: 'Additional Details',
      blocks: [
        {
          id: generateId(),
          type: 'text',
          content: '• 100% intellectual property ownership transferred upon final payment.\n• 30 days of post-launch maintenance and technical support included.',
        },
      ],
    },
    {
      id: generateId(),
      heading: 'Payment terms',
      blocks: [
        {
          id: generateId(),
          type: 'text',
          content: '1. **40%** upfront advance to initiate project development\n2. **30%** upon milestone 1 delivery and review\n3. **30%** upon final deployment and handover',
        },
      ],
    },
  ];

  return {
    id: generateId(),
    title,
    createdAt: now,
    updatedAt: now,
    sections,
  };
}

export function safeSetItem(key: string, value: string): { success: boolean; isQuotaError?: boolean } {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error: any) {
    const isQuota =
      error?.name === 'QuotaExceededError' ||
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error?.code === 22 ||
      error?.code === 1014;
    return { success: false, isQuotaError: isQuota };
  }
}

export function loadSettingsFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      logo: { ...DEFAULT_SETTINGS.logo, ...(parsed.logo || {}) },
      bank: { ...DEFAULT_SETTINGS.bank, ...(parsed.bank || {}) },
    };
  } catch (e) {
    console.error('Failed to load settings from storage. Backing up corrupt data.', e);
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_corrupt_backup_${Date.now()}`, raw);
      }
    } catch {}
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: Settings): { success: boolean; isQuotaError?: boolean } {
  return safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadQuotationsFromStorage(): { quotations: Quotation[]; activeId: string } {
  try {
    const rawList = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);

    if (!rawList) {
      const defaultQuotation = createDefaultQuotation();
      const initial = [defaultQuotation];
      saveQuotationsToStorage(initial, defaultQuotation.id);
      return { quotations: initial, activeId: defaultQuotation.id };
    }

    const parsed: Quotation[] = JSON.parse(rawList);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaultQuotation = createDefaultQuotation();
      const initial = [defaultQuotation];
      saveQuotationsToStorage(initial, defaultQuotation.id);
      return { quotations: initial, activeId: defaultQuotation.id };
    }

    const resolvedActiveId =
      activeId && parsed.some((q) => q.id === activeId) ? activeId : parsed[0].id;

    return { quotations: parsed, activeId: resolvedActiveId };
  } catch (e) {
    console.error('Failed to load quotations from storage. Backing up corrupt data.', e);
    try {
      const rawList = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
      if (rawList) {
        localStorage.setItem(`${STORAGE_KEYS.QUOTATIONS}_corrupt_backup_${Date.now()}`, rawList);
      }
    } catch {}
    const defaultQuotation = createDefaultQuotation();
    return { quotations: [defaultQuotation], activeId: defaultQuotation.id };
  }
}

export function saveQuotationsToStorage(quotations: Quotation[], activeId: string): { success: boolean; isQuotaError?: boolean } {
  const result1 = safeSetItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
  const result2 = safeSetItem(STORAGE_KEYS.ACTIVE_ID, activeId);
  return {
    success: result1.success && result2.success,
    isQuotaError: Boolean(result1.isQuotaError || result2.isQuotaError),
  };
}

// Helper to derive title from the first section if needed
export function deriveQuotationTitle(quotation: Quotation): string {
  if (quotation.title && quotation.title.trim() && quotation.title !== 'Untitled') {
    return quotation.title;
  }
  const firstSection = quotation.sections[0];
  if (firstSection && firstSection.blocks.length > 0) {
    const firstBlock = firstSection.blocks[0];
    if (firstBlock.type === 'text') {
      const match = firstBlock.content.match(/Client:\s*(.+)/i);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  }
  return quotation.title || 'Untitled';
}

export function createEmptyBlock(type: Block['type']): Block {
  const id = generateId();
  switch (type) {
    case 'text':
      return { id, type: 'text', content: '' };
    case 'bullets':
      return { id, type: 'bullets', items: [''] };
    case 'numbered':
      return { id, type: 'numbered', items: [''] };
    case 'group':
      return { id, type: 'group', title: '', items: [''] };
  }
}
