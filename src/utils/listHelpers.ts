/**
 * Splits multi-line pasted text into individual clean list items,
 * removing leading bullet/number markers (e.g. "-", "•", "*", "1.", "1)").
 */
export function splitPasteLines(rawText: string): string[] {
  if (!rawText) return [];

  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^([•\-\*]|\d+[\.\)])\s*/, ''));
}
