import { Section } from '../types';

/**
 * Returns the 1-based index of a group block among all group blocks within the section.
 * Returns 0 if not found.
 */
export function getGroupNumber(section: Section, targetBlockId: string): number {
  let count = 0;
  for (const block of section.blocks) {
    if (block.type === 'group') {
      count++;
      if (block.id === targetBlockId) {
        return count;
      }
    }
  }
  return 0;
}

/**
 * Returns a map of blockId -> 1-based group number for all group blocks in a section.
 */
export function getSectionGroupNumbers(section: Section): Map<string, number> {
  const map = new Map<string, number>();
  let count = 0;
  for (const block of section.blocks) {
    if (block.type === 'group') {
      count++;
      map.set(block.id, count);
    }
  }
  return map;
}
