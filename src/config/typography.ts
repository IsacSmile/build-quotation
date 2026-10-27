/**
 * Single source of truth for typography constants shared across
 * the Paper editor and the PDF renderer.
 */

export const FONT_FAMILY = 'Montserrat';

export const SIZES = {
  heading: 13,
  body: 11,
  headerLabel: 12,
  headerName: 15,
  headerAddress: 12,
  pageNumber: 9,
} as const;

export const LINE_HEIGHT = 1.5;

export const WEIGHTS = {
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
} as const;

export const CSS_VARIABLES: Record<string, string> = {
  '--paper-font-family': `${FONT_FAMILY}, system-ui, sans-serif`,
  '--paper-size-heading': `${SIZES.heading}px`,
  '--paper-size-body': `${SIZES.body}px`,
  '--paper-size-header-label': `${SIZES.headerLabel}px`,
  '--paper-size-header-name': `${SIZES.headerName}px`,
  '--paper-size-header-address': `${SIZES.headerAddress}px`,
  '--paper-size-page-number': `${SIZES.pageNumber}px`,
  '--paper-line-height': `${LINE_HEIGHT}`,
  '--paper-weight-regular': `${WEIGHTS.regular}`,
  '--paper-weight-medium': `${WEIGHTS.medium}`,
  '--paper-weight-semibold': `${WEIGHTS.semiBold}`,
  '--paper-weight-bold': `${WEIGHTS.bold}`,
};

/**
 * Injects typography CSS variables onto document.documentElement (:root)
 * before the first React render.
 */
export function injectTypographyCssVariables(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(CSS_VARIABLES)) {
    root.style.setProperty(key, value);
  }
}
