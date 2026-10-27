import React, { useEffect, useId, useRef, useState } from 'react';
import { useQuotation } from '../store/context';
import { fileToDataUrl } from '../utils/image';

// Automatically discover prebuilt logos from /src/assets/logos/
const logoModules = import.meta.glob(
  '/src/assets/logos/*.{svg,png,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

export const LogoPicker: React.FC = () => {
  const { settings, dispatch } = useQuotation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // Convert discovered modules to array
  const prebuiltList = Object.entries(logoModules).map(([path, url]) => {
    const filename = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'logo';
    return {
      path,
      url,
      name: filename,
    };
  });

  const currentKind = settings.logo?.kind || 'prebuilt';
  const currentSrc = settings.logo?.src || '';

  // If selected prebuilt file no longer exists or is empty, fall back to first available prebuilt logo
  useEffect(() => {
    if (prebuiltList.length === 0) return;

    if (currentKind === 'prebuilt') {
      const match = prebuiltList.find((p) => p.url === currentSrc);
      if (!match) {
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            logo: {
              kind: 'prebuilt',
              src: prebuiltList[0].url,
            },
          },
        });
      }
    }
  }, [prebuiltList, currentKind, currentSrc, dispatch]);

  const handleSelectPrebuilt = (url: string) => {
    setErrorMessage(null);
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        logo: {
          kind: 'prebuilt',
          src: url,
        },
      },
    });
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const dataUrl = await fileToDataUrl(file, {
        maxWidth: 600,
        maxHeight: 300,
        maxSizeBytes: 2 * 1024 * 1024,
      });

      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          logo: {
            kind: 'custom',
            src: dataUrl,
          },
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to process image file.');
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCustom = () => {
    setErrorMessage(null);
    const fallbackUrl = prebuiltList[0]?.url || '';
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        logo: {
          kind: 'prebuilt',
          src: fallbackUrl,
        },
      },
    });
  };

  const activeLogoUrl = currentSrc || prebuiltList[0]?.url || '';

  return (
    <div className="logo-picker">
      {/* Live Preview above grid */}
      <div className="logo-preview-box">
        <span className="logo-preview-label">Header Preview:</span>
        <div className="logo-preview-stage">
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt="Current Logo Preview"
              className="logo-preview-img"
            />
          ) : (
            <span className="logo-preview-empty">No logo selected</span>
          )}
        </div>
      </div>

      {/* Grid of thumbnails */}
      <div className="logo-grid" role="radiogroup" aria-label="Select agency logo">
        {prebuiltList.map((logo) => {
          const isSelected = currentKind === 'prebuilt' && currentSrc === logo.url;
          return (
            <div key={logo.path} className="logo-item">
              <button
                type="button"
                className={`logo-tile ${isSelected ? 'logo-tile--selected' : ''}`}
                onClick={() => handleSelectPrebuilt(logo.url)}
                role="radio"
                aria-checked={isSelected}
                title={logo.name}
              >
                <img src={logo.url} alt={logo.name} className="logo-tile-img" />
                {isSelected && (
                  <span className="logo-tile-check" aria-hidden="true">✓</span>
                )}
              </button>
              <span className="logo-tile-caption" title={logo.name}>
                {logo.name}
              </span>
            </div>
          );
        })}

        {/* Custom Upload Tile */}
        <div className="logo-item">
          {currentKind === 'custom' && currentSrc ? (
            <div className="logo-tile-custom-wrapper">
              <button
                type="button"
                className="logo-tile logo-tile--selected"
                onClick={() => fileInputRef.current?.click()}
                role="radio"
                aria-checked={true}
                title="Custom uploaded logo"
              >
                <img src={currentSrc} alt="Custom logo" className="logo-tile-img" />
                <span className="logo-tile-check" aria-hidden="true">✓</span>
              </button>
              <div className="logo-custom-actions">
                <span className="logo-tile-caption">Custom</span>
                <button
                  type="button"
                  className="logo-remove-btn"
                  onClick={handleRemoveCustom}
                  title="Remove custom logo"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="logo-tile logo-tile--upload"
                onClick={() => fileInputRef.current?.click()}
                title="Upload custom logo"
              >
                <span className="logo-upload-icon">+</span>
                <span className="logo-upload-text">Upload</span>
              </button>
              <span className="logo-tile-caption">Custom (Max 2MB)</span>
            </>
          )}

          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp"
            className="visually-hidden"
            onChange={handleCustomUpload}
          />
        </div>
      </div>

      {/* Inline Error Message */}
      {errorMessage && (
        <div className="settings-field-error" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
