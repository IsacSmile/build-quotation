import React from 'react';
import { TextBlock as TextBlockType } from '../../types';
import { EditableText } from '../EditableText';

interface TextBlockProps {
  block: TextBlockType;
  onUpdate: (content: string) => void;
  autoFocus?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block, onUpdate, autoFocus = false }) => {
  return (
    <div className="block-text-wrapper">
      <EditableText
        value={block.content}
        onCommit={onUpdate}
        placeholder="Type here..."
        multiline={true}
        autoFocus={autoFocus}
        className="block-text-input"
        ariaLabel="Text block"
        renderBlurred={true}
      />
    </div>
  );
};
