/**
 * Single source of truth for prebuilt logos discovery, key normalization,
 * and build-safe URL resolution.
 */

export const PREBUILT_LOGO_MODULES = import.meta.glob(
  '/src/assets/logos/*.{svg,png,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

export const PREBUILT_LOGOS_BY_KEY: Record<string, string> = {};
export const PREBUILT_LOGO_KEYS: string[] = [];

for (const [path, url] of Object.entries(PREBUILT_LOGO_MODULES)) {
  const filename = path.split('/').pop() || '';
  if (filename) {
    PREBUILT_LOGOS_BY_KEY[filename] = url;
    PREBUILT_LOGO_KEYS.push(filename);
  }
}

// Default fallback key (e.g. 'faiz-dev-co-logo.png' or first discovered)
export const DEFAULT_PREBUILT_LOGO_KEY =
  PREBUILT_LOGO_KEYS.find((k) => k.startsWith('faiz-dev-co-logo')) ||
  PREBUILT_LOGO_KEYS[0] ||
  'faiz-dev-co-logo.png';

/**
 * Normalizes any prebuilt logo reference to its stable filename key.
 * Accepts:
 * - stable keys (e.g. "faiz-dev-co-logo.png")
 * - dev paths (e.g. "/src/assets/logos/faiz-dev-co-logo.png")
 * - production hashed URLs (e.g. "/assets/faiz-dev-co-logo-DDKvzXGZ.png")
 * Falls back to DEFAULT_PREBUILT_LOGO_KEY if unrecognized.
 */
export function normalizePrebuiltLogoKey(src: string | undefined | null): string {
  if (!src) return DEFAULT_PREBUILT_LOGO_KEY;

  // 1. Direct match with a known filename key
  if (PREBUILT_LOGOS_BY_KEY[src]) {
    return src;
  }

  // 2. Exact filename at end of path (e.g. "/src/assets/logos/faiz-dev-co-logo.png")
  const rawFilename = src.split('/').pop()?.split('?')[0] || '';
  if (PREBUILT_LOGOS_BY_KEY[rawFilename]) {
    return rawFilename;
  }

  // 3. Match against resolved production URLs or hashed filenames (e.g. "/assets/faiz-dev-co-logo-DDKvzXGZ.png")
  for (const [key, resolvedUrl] of Object.entries(PREBUILT_LOGOS_BY_KEY)) {
    if (src === resolvedUrl) {
      return key;
    }
    const dotIdx = key.lastIndexOf('.');
    if (dotIdx !== -1) {
      const baseName = key.slice(0, dotIdx);
      const ext = key.slice(dotIdx);
      if (rawFilename.startsWith(baseName + '-') && rawFilename.endsWith(ext)) {
        return key;
      }
      if (src.includes(`/${baseName}-`) && src.endsWith(ext)) {
        return key;
      }
    }
  }

  // Fallback to default
  return DEFAULT_PREBUILT_LOGO_KEY;
}

/**
 * Resolves any logo object (prebuilt or custom) to a usable image URL for <img> or canvas/PDF.
 */
export function resolveLogoUrl(logo?: { kind: 'prebuilt' | 'custom'; src: string } | null): string {
  if (!logo) {
    return PREBUILT_LOGOS_BY_KEY[DEFAULT_PREBUILT_LOGO_KEY] || '';
  }
  if (logo.kind === 'custom') {
    return logo.src;
  }
  const key = normalizePrebuiltLogoKey(logo.src);
  return PREBUILT_LOGOS_BY_KEY[key] || PREBUILT_LOGOS_BY_KEY[DEFAULT_PREBUILT_LOGO_KEY] || '';
}
