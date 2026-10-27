import { Block, Quotation, Section, Settings } from '../types';
import { generateId } from '../store/storage';

export const BACKUP_STORAGE_KEY = 'quotation_builder_last_backup_at';

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface BackupData {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  activeQuotationId?: string;
  settings?: Settings;
  quotations: Quotation[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: BackupData;
}

const ALLOWED_BLOCK_TYPES = new Set<Block['type']>(['text', 'bullets', 'numbered', 'group']);

function checkSvgSecurity(svgText: string): boolean {
  const hasScriptTag = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(svgText) || /<script/i.test(svgText);
  const hasInlineHandlers = /\bon[a-z]+\s*=/i.test(svgText);
  return !hasScriptTag && !hasInlineHandlers;
}

function validateImageDataUrl(dataUrl: string, fieldName: string): string | null {
  if (typeof dataUrl !== 'string') {
    return `${fieldName} must be a string.`;
  }
  // Check max length (~2MB in base64 is ~2.8MB characters)
  if (dataUrl.length > 3 * 1024 * 1024) {
    return `${fieldName} exceeds the 2 MB image limit.`;
  }

  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.*)$/i);
  const svgUtf8Match = dataUrl.match(/^data:image\/svg\+xml;utf8,(.*)$/i);

  if (!match && !svgUtf8Match) {
    return `${fieldName} must be a valid image data URL (PNG, JPG, WebP, or SVG).`;
  }

  // If SVG, verify security
  if (dataUrl.startsWith('data:image/svg+xml')) {
    let svgContent = '';
    try {
      if (match) {
        svgContent = atob(match[2]);
      } else if (svgUtf8Match) {
        svgContent = decodeURIComponent(svgUtf8Match[1]);
      }
    } catch {
      return `Failed to decode ${fieldName} SVG data.`;
    }

    if (!checkSvgSecurity(svgContent)) {
      return `${fieldName} contains unsafe content (scripts or event handlers).`;
    }
  }

  return null;
}

export function validateBackupJson(rawText: string, fileSizeBytes?: number): ValidationResult {
  if (fileSizeBytes !== undefined && fileSizeBytes > 10 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 10 MB limit.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: false, error: 'Invalid JSON file.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'Backup root must be an object.' };
  }

  if (parsed.app !== 'quotation-builder') {
    return { valid: false, error: "Unrecognized backup file. Expected app 'quotation-builder'." };
  }

  if (typeof parsed.schemaVersion !== 'number') {
    return { valid: false, error: "Missing or invalid 'schemaVersion'." };
  }

  if (parsed.schemaVersion > 1) {
    return {
      valid: false,
      error: `Unsupported backup schema version: ${parsed.schemaVersion} (maximum supported version is 1).`,
    };
  }

  if (!Array.isArray(parsed.quotations)) {
    return { valid: false, error: "Invalid backup file: 'quotations' must be an array." };
  }

  if (parsed.quotations.length > 500) {
    return { valid: false, error: 'Too many quotations in backup (maximum 500).' };
  }

  const validatedQuotations: Quotation[] = [];

  for (let qIdx = 0; qIdx < parsed.quotations.length; qIdx++) {
    const rawQ = parsed.quotations[qIdx];
    if (!rawQ || typeof rawQ !== 'object') {
      return { valid: false, error: `Quotation at index ${qIdx} is not an object.` };
    }

    if (typeof rawQ.id !== 'string' || !rawQ.id.trim()) {
      return { valid: false, error: `Quotation at index ${qIdx} must have a valid string 'id'.` };
    }

    const title = typeof rawQ.title === 'string' ? rawQ.title.slice(0, 500) : 'Untitled quotation';
    const titleManual = Boolean(rawQ.titleManual);
    const createdAt = typeof rawQ.createdAt === 'number' ? rawQ.createdAt : Date.now();
    const updatedAt = typeof rawQ.updatedAt === 'number' ? rawQ.updatedAt : Date.now();

    if (!Array.isArray(rawQ.sections)) {
      return { valid: false, error: `Quotation '${title}' sections must be an array.` };
    }

    if (rawQ.sections.length > 200) {
      return { valid: false, error: `Quotation '${title}' exceeds maximum of 200 sections.` };
    }

    const validatedSections: Section[] = [];

    for (let sIdx = 0; sIdx < rawQ.sections.length; sIdx++) {
      const rawSec = rawQ.sections[sIdx];
      if (!rawSec || typeof rawSec !== 'object') {
        return { valid: false, error: `Section at index ${sIdx} in '${title}' is not an object.` };
      }

      if (typeof rawSec.id !== 'string' || !rawSec.id.trim()) {
        return { valid: false, error: `Section at index ${sIdx} in '${title}' must have a string 'id'.` };
      }

      const heading = typeof rawSec.heading === 'string' ? rawSec.heading.slice(0, 500) : '';

      if (!Array.isArray(rawSec.blocks)) {
        return { valid: false, error: `Section '${heading}' blocks must be an array.` };
      }

      if (rawSec.blocks.length > 500) {
        return { valid: false, error: `Section '${heading}' exceeds maximum of 500 blocks.` };
      }

      const validatedBlocks: Block[] = [];

      for (let bIdx = 0; bIdx < rawSec.blocks.length; bIdx++) {
        const rawBlk = rawSec.blocks[bIdx];
        if (!rawBlk || typeof rawBlk !== 'object') {
          return { valid: false, error: `Block at index ${bIdx} in section '${heading}' is not an object.` };
        }

        if (typeof rawBlk.id !== 'string' || !rawBlk.id.trim()) {
          return { valid: false, error: `Block at index ${bIdx} in section '${heading}' must have a string 'id'.` };
        }

        if (!ALLOWED_BLOCK_TYPES.has(rawBlk.type)) {
          return {
            valid: false,
            error: `Invalid block type: '${rawBlk.type}'. Allowed types are text, bullets, numbered, group.`,
          };
        }

        const hint = typeof rawBlk.hint === 'string' ? rawBlk.hint.slice(0, 500) : undefined;
        const bulletHint = typeof rawBlk.bulletHint === 'string' ? rawBlk.bulletHint.slice(0, 500) : undefined;

        if (rawBlk.type === 'text') {
          const content = typeof rawBlk.content === 'string' ? rawBlk.content.slice(0, 50000) : '';
          validatedBlocks.push({
            id: rawBlk.id,
            type: 'text',
            content,
            ...(hint ? { hint } : {}),
          });
        } else if (rawBlk.type === 'bullets' || rawBlk.type === 'numbered') {
          if (!Array.isArray(rawBlk.items)) {
            return { valid: false, error: `List block in section '${heading}' items must be an array.` };
          }
          if (rawBlk.items.length > 500) {
            return { valid: false, error: `List block in section '${heading}' exceeds maximum of 500 items.` };
          }
          const items = rawBlk.items.map((it: any) => (typeof it === 'string' ? it.slice(0, 5000) : ''));
          validatedBlocks.push({
            id: rawBlk.id,
            type: rawBlk.type,
            items,
            ...(hint ? { hint } : {}),
          });
        } else if (rawBlk.type === 'group') {
          const groupTitle = typeof rawBlk.title === 'string' ? rawBlk.title.slice(0, 1000) : '';
          if (!Array.isArray(rawBlk.items)) {
            return { valid: false, error: `Group block in section '${heading}' items must be an array.` };
          }
          if (rawBlk.items.length > 500) {
            return { valid: false, error: `Group block in section '${heading}' exceeds maximum of 500 items.` };
          }
          const items = rawBlk.items.map((it: any) => (typeof it === 'string' ? it.slice(0, 5000) : ''));
          validatedBlocks.push({
            id: rawBlk.id,
            type: 'group',
            title: groupTitle,
            items,
            ...(hint ? { hint } : {}),
            ...(bulletHint ? { bulletHint } : {}),
          });
        }
      }

      validatedSections.push({
        id: rawSec.id,
        heading,
        blocks: validatedBlocks,
      });
    }

    validatedQuotations.push({
      id: rawQ.id,
      title,
      titleManual,
      createdAt,
      updatedAt,
      sections: validatedSections,
    });
  }

  // Validate settings if present
  let validatedSettings: Settings | undefined = undefined;

  if (parsed.settings && typeof parsed.settings === 'object') {
    const rawSet = parsed.settings;
    const agencyName = typeof rawSet.agencyName === 'string' ? rawSet.agencyName.slice(0, 200) : '';
    const address = typeof rawSet.address === 'string' ? rawSet.address.slice(0, 500) : '';
    const paymentEnabled = Boolean(rawSet.paymentEnabled);

    // Validate logo
    let logo: { kind: 'prebuilt' | 'custom'; src: string } = { kind: 'prebuilt', src: '' };
    if (rawSet.logo && typeof rawSet.logo === 'object') {
      if (!['prebuilt', 'custom'].includes(rawSet.logo.kind)) {
        return { valid: false, error: "Settings logo.kind must be 'prebuilt' or 'custom'." };
      }
      if (rawSet.logo.kind === 'custom') {
        const err = validateImageDataUrl(rawSet.logo.src, 'Custom logo');
        if (err) return { valid: false, error: err };
        logo = { kind: 'custom', src: rawSet.logo.src };
      } else {
        logo = { kind: 'prebuilt', src: typeof rawSet.logo.src === 'string' ? rawSet.logo.src : '' };
      }
    }

    // Validate QR code
    let qrImage: string | undefined = undefined;
    if (rawSet.qrImage) {
      const err = validateImageDataUrl(rawSet.qrImage, 'UPI QR code');
      if (err) return { valid: false, error: err };
      qrImage = rawSet.qrImage;
    }

    // Validate bank
    const rawBank = rawSet.bank || {};
    const bank = {
      holder: typeof rawBank.holder === 'string' ? rawBank.holder.slice(0, 200) : '',
      bankName: typeof rawBank.bankName === 'string' ? rawBank.bankName.slice(0, 200) : '',
      accountNo: typeof rawBank.accountNo === 'string' ? rawBank.accountNo.slice(0, 100) : '',
      ifsc: typeof rawBank.ifsc === 'string' ? rawBank.ifsc.slice(0, 50) : '',
      swift: typeof rawBank.swift === 'string' ? rawBank.swift.slice(0, 50) : '',
      upiId: typeof rawBank.upiId === 'string' ? rawBank.upiId.slice(0, 100) : '',
    };

    validatedSettings = {
      agencyName,
      address,
      logo,
      paymentEnabled,
      qrImage,
      bank,
    };
  }

  return {
    valid: true,
    data: {
      app: parsed.app,
      schemaVersion: parsed.schemaVersion,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      activeQuotationId: typeof parsed.activeQuotationId === 'string' ? parsed.activeQuotationId : undefined,
      settings: validatedSettings,
      quotations: validatedQuotations,
    },
  };
}

export function mergeQuotations(
  existingQuotations: Quotation[],
  importedQuotations: Quotation[]
): { quotations: Quotation[]; activeId: string; importedCount: number } {
  const existingIds = new Set(existingQuotations.map((q) => q.id));

  const resolvedImported = importedQuotations.map((q) => {
    if (existingIds.has(q.id)) {
      return {
        ...q,
        id: generateId(),
        title: `${q.title} (imported)`,
        titleManual: true,
      };
    }
    return q;
  });

  const allQuotations = [...resolvedImported, ...existingQuotations];
  const sorted = [...resolvedImported].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeId = sorted[0]?.id || allQuotations[0]?.id || '';

  return {
    quotations: allQuotations,
    activeId,
    importedCount: resolvedImported.length,
  };
}
