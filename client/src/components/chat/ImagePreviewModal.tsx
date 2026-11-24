import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { X, Send } from 'lucide-react';

interface ImagePreviewModalProps {
  previewUrl: string;
  fileName?: string;
  onClose: () => void;
  onSend: (caption: string) => void;
}

export const ImagePreviewModal = ({
  previewUrl,
  fileName,
  onClose,
  onSend,
}: ImagePreviewModalProps) => {
  const [caption, setCaption] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus caption input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle ESC key to cancel preview
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSend = () => {
    onSend(caption.trim());
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-wa-bg text-wa-primary animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <header className="flex h-[60px] items-center justify-between border-b border-wa-border bg-wa-panel px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-wa-secondary transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
            title="Cancel"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-wa-primary truncate max-w-[200px] sm:max-w-xs">
            {fileName || 'Send Image'}
          </span>
        </div>
      </header>

      {/* Center Image Preview Area */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        <div className="relative max-h-full max-w-full overflow-hidden rounded-lg shadow-2xl">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      </div>

      {/* Bottom Caption & Send Bar */}
      <footer className="flex h-[72px] items-center gap-3 border-t border-wa-border bg-wa-panel px-4 py-2 sm:px-8">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Add a caption..."
            className="w-full rounded-lg bg-wa-input px-4 py-3 text-sm text-wa-primary placeholder-wa-secondary focus:outline-none shadow-sm"
          />
        </div>

        {/* Circular WhatsApp Green Send Button */}
        <button
          type="button"
          onClick={handleSend}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-wa-green text-white shadow-md transition-transform hover:scale-105 active:scale-95 focus:outline-none"
          title="Send photo"
          aria-label="Send photo"
        >
          <Send className="h-5 w-5 translate-x-0.5" />
        </button>
      </footer>
    </div>
  );
};
