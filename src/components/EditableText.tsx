import React, { useEffect, useRef, useState } from 'react';
import { parseInlineToHtml } from '../utils/richText';

export interface EditableTextProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  selectOnFocus?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  renderBlurred?: boolean;
  onKeyDownExtra?: (e: React.KeyboardEvent<HTMLElement>) => void;
  onPasteText?: (text: string) => boolean | { handled: boolean; firstLine?: string };
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onCommit,
  placeholder = '',
  multiline = false,
  className = '',
  as = 'div',
  selectOnFocus = false,
  autoFocus = false,
  ariaLabel,
  renderBlurred = false,
  onKeyDownExtra,
  onPasteText,
}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const isFocusedRef = useRef(false);
  const [, setIsFocused] = useState(false);
  const lastCommittedRef = useRef(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value || value.trim() === '');

  // Keep lastCommittedRef and DOM in sync when external props update while NOT focused
  useEffect(() => {
    lastCommittedRef.current = value;
    if (elementRef.current && !isFocusedRef.current) {
      if (renderBlurred) {
        elementRef.current.innerHTML = parseInlineToHtml(value, multiline);
      } else {
        if (elementRef.current.textContent !== value) {
          elementRef.current.textContent = value;
        }
      }
      setIsEmpty(!value || value.trim() === '');
    }
  }, [value, renderBlurred, multiline]);

  // Handle autoFocus on mount or when autoFocus becomes true
  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        if (selectOnFocus) {
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, [autoFocus, selectOnFocus]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitValue = (val: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (val === lastCommittedRef.current) {
      return;
    }
    lastCommittedRef.current = val;
    onCommit(val);
  };

  const handleInput = () => {
    if (!elementRef.current) return;
    const currentText = multiline
      ? (elementRef.current.innerText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      : (elementRef.current.textContent || '');
    setIsEmpty(currentText.trim() === '');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      commitValue(currentText);
    }, 300);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    setIsFocused(true);

    if (renderBlurred && elementRef.current) {
      // While focused, show raw text with markers
      elementRef.current.textContent = lastCommittedRef.current;
    }

    if (selectOnFocus && elementRef.current) {
      const range = document.createRange();
      range.selectNodeContents(elementRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setIsFocused(false);

    if (!elementRef.current) return;
    const currentText = multiline
      ? (elementRef.current.innerText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      : (elementRef.current.textContent || '');
    if (currentText !== lastCommittedRef.current) {
      commitValue(currentText);
    }

    if (renderBlurred) {
      elementRef.current.innerHTML = parseInlineToHtml(value, multiline);
    } else {
      if (elementRef.current.textContent !== value) {
        elementRef.current.textContent = value;
      }
    }
    setIsEmpty(!value || value.trim() === '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (onKeyDownExtra) {
      onKeyDownExtra(e);
      if (e.defaultPrevented) return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (elementRef.current) {
        // Revert to last committed value
        elementRef.current.textContent = lastCommittedRef.current;
        setIsEmpty(!lastCommittedRef.current || lastCommittedRef.current.trim() === '');
        elementRef.current.blur();
      }
      return;
    }

    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      elementRef.current?.blur();
      return;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    const rawClipboard = e.clipboardData.getData('text/plain') || '';

    // Allow custom paste handler if provided (e.g. multi-line split in lists)
    if (onPasteText) {
      const handled = onPasteText(rawClipboard);
      if (handled) {
        e.preventDefault();
        const firstLine = typeof handled === 'object' && handled.firstLine !== undefined
          ? handled.firstLine
          : undefined;
        if (firstLine !== undefined && elementRef.current) {
          elementRef.current.textContent = firstLine;
          lastCommittedRef.current = firstLine;
          setIsEmpty(!firstLine || firstLine.trim() === '');
        }
        return;
      }
    }

    e.preventDefault();
    let text = rawClipboard;

    // If single line, collapse line breaks to single spaces
    if (!multiline) {
      text = text.replace(/[\r\n]+/g, ' ');
    }

    // Insert as plain text preserving browser undo stack
    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      selection.deleteFromDocument();
      selection.getRangeAt(0).insertNode(document.createTextNode(text));
      selection.collapseToEnd();
    }

    handleInput();
  };

  const Component = as as any;

  return (
    <Component
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck={true}
      role="textbox"
      aria-multiline={multiline}
      aria-label={ariaLabel || placeholder}
      data-placeholder={placeholder}
      data-empty={isEmpty}
      className={`editable ${className}`}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
};
