import React from 'react';
import { useQuotation } from '../store/context';
import { resolveLogoUrl } from '../utils/prebuiltLogos';

interface PaperHeaderProps {
  onOpenSettings?: () => void;
}

export const PaperHeader: React.FC<PaperHeaderProps> = ({ onOpenSettings }) => {
  const { settings } = useQuotation();
  const logoUrl = resolveLogoUrl(settings.logo);

  return (
    <header
      className="paper-header"
      onClick={onOpenSettings}
      role="button"
      tabIndex={0}
      title="Edit in Settings"
      aria-label="Click to edit agency settings"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenSettings?.();
        }
      }}
    >
      <div className="paper-header-content">
        {/* Left side agency info */}
        <div className="paper-header-left">
          <div className="paper-agency-label">AGENCY NAME :</div>
          <div className="paper-agency-name">{settings.agencyName || 'Agency Name'}</div>
          {settings.address && (
            <div className="paper-agency-address">{settings.address}</div>
          )}
        </div>

        {/* Right side logo */}
        {logoUrl && (
          <div className="paper-header-right">
            <img
              src={logoUrl}
              alt={`${settings.agencyName || 'Agency'} Logo`}
              className="paper-logo"
            />
          </div>
        )}
      </div>

      {/* 1px grey divider line below with 16px spacing */}
      <div className="paper-header-divider" />
    </header>
  );
};
