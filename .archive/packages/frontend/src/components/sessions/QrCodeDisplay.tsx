import React, { useState } from 'react';

interface QrCodeDisplayProps {
  qrCodeUrl?: string;
  sessionId: string;
  sessionTitle: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  allowDownload?: boolean;
  allowCopy?: boolean;
  onRegenerate?: () => void;
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  qrCodeUrl,
  sessionId: _sessionId,
  sessionTitle,
  showLabel = true,
  size = 'medium',
  allowDownload = false,
  allowCopy = false,
  onRegenerate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleCopyUrl = async () => {
    if (!qrCodeUrl) return;

    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR code URL:', error);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${sessionTitle.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;

    setIsLoading(true);
    try {
      await onRegenerate();
    } finally {
      setIsLoading(false);
    }
  };

  if (!qrCodeUrl) {
    return (
      <div className="qr-code-display qr-code-missing">
        {showLabel && (
          <div className="qr-code-label">
            <span className="text-sm text-gray-600">QR Code:</span>
          </div>
        )}
        <div className={`qr-code-placeholder ${sizeClasses[size]} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center`}>
          <div className="text-center">
            <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div className="text-xs text-gray-500">No QR Code</div>
          </div>
        </div>
        {onRegenerate && (
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate QR Code'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="qr-code-display">
      {showLabel && (
        <div className="qr-code-label mb-2">
          <span className="text-sm text-gray-600">QR Code:</span>
        </div>
      )}

      <div className="qr-code-container">
        <img
          src={qrCodeUrl}
          alt={`QR Code for ${sessionTitle}`}
          className={`qr-code-image ${sizeClasses[size]} border rounded-lg shadow-sm`}
          loading="lazy"
        />

        {(allowDownload || allowCopy || onRegenerate) && (
          <div className="qr-code-actions mt-2 flex flex-wrap gap-1">
            {allowCopy && (
              <button
                onClick={handleCopyUrl}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                title="Copy QR code URL"
              >
                {copySuccess ? '✓ Copied!' : 'Copy URL'}
              </button>
            )}

            {allowDownload && (
              <button
                onClick={handleDownload}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                title="Download QR code image"
              >
                Download
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                title="Regenerate QR code"
              >
                {isLoading ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCodeDisplay;