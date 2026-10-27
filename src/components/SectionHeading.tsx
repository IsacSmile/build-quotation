import React from 'react';
import { EditableText } from './EditableText';

interface SectionHeadingProps {
  heading: string;
  onUpdate: (heading: string) => void;
  autoFocus?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  heading,
  onUpdate,
  autoFocus = false,
}) => {
  return (
    <div className="section-heading-bar">
      <EditableText
        value={heading}
        onCommit={onUpdate}
        placeholder="Click to add heading"
        multiline={false}
        autoFocus={autoFocus}
        selectOnFocus={autoFocus}
        className="section-heading-text"
        ariaLabel="Section Heading"
      />
    </div>
  );
};
