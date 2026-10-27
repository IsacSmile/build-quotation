import React from 'react';

export interface RichTextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

/**
 * Parses markdown inline markers:
 * ***bold italic***, **bold**, *italic*.
 * Unmatched markers remain as literal text.
 * No HTML is ever generated.
 */
export function parseInline(input: string): RichTextSegment[] {
  if (!input) return [];

  const segments: RichTextSegment[] = [];
  const tokenRegex = /(\*\*\*[^*]+?\*\*\*|(?<!\*)\*\*[^*]+?\*\*(?!\*)|(?<!\*)\*[^*]+?\*(?!\*))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(input)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];

    // Push any literal text before this match
    if (matchIndex > lastIndex) {
      segments.push({
        text: input.substring(lastIndex, matchIndex),
        bold: false,
        italic: false,
      });
    }

    if (matchText.startsWith('***') && matchText.endsWith('***') && matchText.length > 6) {
      segments.push({
        text: matchText.slice(3, -3),
        bold: true,
        italic: true,
      });
    } else if (matchText.startsWith('**') && matchText.endsWith('**') && matchText.length > 4) {
      segments.push({
        text: matchText.slice(2, -2),
        bold: true,
        italic: false,
      });
    } else if (matchText.startsWith('*') && matchText.endsWith('*') && matchText.length > 2) {
      segments.push({
        text: matchText.slice(1, -1),
        bold: false,
        italic: true,
      });
    } else {
      segments.push({
        text: matchText,
        bold: false,
        italic: false,
      });
    }

    lastIndex = matchIndex + matchText.length;
  }

  // Push remaining literal text after last match
  if (lastIndex < input.length) {
    segments.push({
      text: input.substring(lastIndex),
      bold: false,
      italic: false,
    });
  }

  return segments;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function parseInlineToHtml(input: string, preserveNewlines = false): string {
  if (!input) return '';

  if (preserveNewlines && input.includes('\n')) {
    return input
      .split('\n')
      .map((line) => parseInlineToHtml(line, false))
      .join('<br>');
  }

  const segments = parseInline(input);
  return segments
    .map((seg) => {
      const escaped = escapeHtml(seg.text);
      if (seg.bold && seg.italic) {
        return `<strong><em>${escaped}</em></strong>`;
      }
      if (seg.bold) {
        return `<strong>${escaped}</strong>`;
      }
      if (seg.italic) {
        return `<em>${escaped}</em>`;
      }
      return escaped;
    })
    .join('');
}

export interface RichTextProps {
  value: string;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ value, className = '' }) => {
  const segments = parseInline(value);

  if (segments.length === 0) {
    return null;
  }

  return (
    <span className={`rich-text ${className}`}>
      {segments.map((seg, idx) => {
        let node: React.ReactNode = seg.text;
        if (seg.bold && seg.italic) {
          node = <strong><em>{node}</em></strong>;
        } else if (seg.bold) {
          node = <strong>{node}</strong>;
        } else if (seg.italic) {
          node = <em>{node}</em>;
        }
        return <React.Fragment key={idx}>{node}</React.Fragment>;
      })}
    </span>
  );
};
