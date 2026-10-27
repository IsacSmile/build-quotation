import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Quotation, Settings } from '../types';
import { prepareImages } from './prepareImages';
import { PdfDocument } from './PdfDocument';

/**
 * Sanitizes the quotation title to create a safe PDF filename.
 * Removes \ / : * ? " < > | and control characters, collapses spaces, trims, max 80 chars.
 * Fallback is "quotation.pdf".
 */
export function sanitizeFilename(title?: string): string {
  if (!title) return 'quotation.pdf';

  // Remove illegal characters: \ / : * ? " < > | and control characters
  let cleaned = title.replace(/[\\/:*?"<>|\x00-\x1f\x7f-\x9f]/g, '');

  // Collapse consecutive spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Max 80 chars
  if (cleaned.length > 80) {
    cleaned = cleaned.slice(0, 80).trim();
  }

  if (!cleaned) {
    return 'quotation.pdf';
  }

  return `${cleaned}-quotation.pdf`;
}

export interface ExportPdfResult {
  success: boolean;
  filename: string;
  warnings: string[];
  error?: string;
}

/**
 * Asynchronously generates the PDF blob and triggers a browser download.
 * Falls back to opening in a new tab if download is unsupported.
 */
export async function exportPdf(
  quotation: Quotation,
  settings: Settings
): Promise<ExportPdfResult> {
  const filename = sanitizeFilename(quotation.title);

  try {
    // 1. Prepare images (rasterize logo and QR to 3x PNG data URLs)
    const preparedImages = await prepareImages(
      settings.logo?.src,
      settings.paymentEnabled ? settings.qrImage : null
    );

    // 2. Render PDF to Blob
    const element = React.createElement(PdfDocument, {
      quotation,
      settings,
      preparedImages,
    });

    const blob = await pdf(element as any).toBlob();

    // 3. Trigger download
    const blobUrl = URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Standard <a> download failed, attempting window.open:', e);
      window.open(blobUrl, '_blank');
    }

    // Revoke object URL after short delay so the download has started
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return {
      success: true,
      filename,
      warnings: preparedImages.warnings,
    };
  } catch (err: any) {
    console.error('PDF export failed:', err);
    return {
      success: false,
      filename,
      warnings: [],
      error: err?.message || 'Failed to generate PDF.',
    };
  }
}
