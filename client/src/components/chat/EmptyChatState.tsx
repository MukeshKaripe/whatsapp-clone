import { Lock, Laptop } from 'lucide-react';

export const EmptyChatState = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center border-b-[6px] border-wa-green bg-wa-panel p-8 text-center select-none transition-colors duration-150">
      <div className="max-w-[460px] flex flex-col items-center">
        {/* Device Sync Illustration Icon */}
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-wa-subtle text-wa-secondary shadow-sm">
          <Laptop className="h-16 w-16 stroke-[1.25]" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-light text-wa-primary">
          WhatsApp Web
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-sm leading-6 text-wa-secondary">
          Send and receive messages without keeping your phone online.
          <br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>

        {/* Encrypted Disclaimer Badge */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-wa-secondary/70">
          <Lock className="h-3.5 w-3.5" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};
