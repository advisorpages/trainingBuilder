import React, { useState } from 'react';

interface EmailEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const EmailEditor: React.FC<EmailEditorProps> = ({
  label,
  value = '',
  onChange,
  placeholder = 'Enter email content...',
  className = ''
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Extract email components
  const getEmailParts = (email: string) => {
    const lines = email.split('\n');
    const subjectMatch = email.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : '';

    // Find greeting line (usually starts with Hi, Hello, Dear)
    const greetingIndex = lines.findIndex(line =>
      /^(Hi|Hello|Dear)\s/i.test(line.trim())
    );
    const greeting = greetingIndex >= 0 ? lines[greetingIndex].trim() : '';

    // Estimate word count
    const wordCount = email.split(/\s+/).filter(word => word.length > 0).length;

    return { subject, greeting, wordCount };
  };

  const { subject, greeting, wordCount } = getEmailParts(value);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  // Format email for preview (convert line breaks to paragraphs)
  const formatEmailForPreview = (email: string) => {
    return email
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .join('\n\n');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>

        <div className="flex items-center space-x-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 text-xs font-medium rounded ${
              showPreview
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            title="Copy to clipboard"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Email Stats */}
      {value && (
        <div className="flex items-center space-x-4 text-xs text-gray-500 bg-gray-50 rounded p-2">
          <span>Words: {wordCount}</span>
          {subject && <span>Subject: ✓</span>}
          {greeting && <span>Greeting: ✓</span>}
          <span className={wordCount > 300 ? 'text-amber-600' : 'text-green-600'}>
            Length: {wordCount < 150 ? 'Short' : wordCount > 300 ? 'Long' : 'Good'}
          </span>
        </div>
      )}

      {/* Editor View */}
      {!showPreview ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500 font-mono"
        />
      ) : (
        /* Preview View */
        <div className="border border-gray-300 rounded p-4 bg-white min-h-[200px]">
          <div className="space-y-4">
            {/* Email Header */}
            {subject && (
              <div className="border-b pb-2">
                <div className="text-xs text-gray-500">Subject:</div>
                <div className="font-medium text-gray-900">{subject}</div>
              </div>
            )}

            {/* Email Body */}
            <div className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
              {formatEmailForPreview(value)}
            </div>
          </div>
        </div>
      )}

      {/* Email Structure Tips */}
      {value.length < 50 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-xs font-medium text-blue-800 mb-1">Email Structure Tips:</div>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Start with "Subject: [Your subject line]"</li>
            <li>• Include a greeting (Hi [Name], Dear [Name], etc.)</li>
            <li>• Use the AIDA framework: Attention, Interest, Desire, Action</li>
            <li>• End with a clear call-to-action</li>
          </ul>
        </div>
      )}

      {/* Character/Word Limits Warning */}
      {wordCount > 400 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2">
          <div className="text-xs text-amber-700">
            ⚠️ Email is quite long ({wordCount} words). Consider shortening for better engagement.
          </div>
        </div>
      )}
    </div>
  );
};