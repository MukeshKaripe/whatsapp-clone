import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { ArrowLeft, Camera, Pencil, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer = ({ isOpen, onClose }: ProfileDrawerProps) => {
  const { user, updateProfile } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutVal, setAboutVal] = useState('');
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with current user
  useEffect(() => {
    if (user) {
      setNameVal(user.name || '');
      setAboutVal(user.about || 'Hey there! I am using WhatsApp.');
    }
  }, [user, isOpen]);

  // Handle ESC key to close drawer or cancel active edit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingName) {
          setIsEditingName(false);
          setNameVal(user?.name || '');
        } else if (isEditingAbout) {
          setIsEditingAbout(false);
          setAboutVal(user?.about || 'Hey there! I am using WhatsApp.');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingName, isEditingAbout, user, onClose]);

  if (!isOpen || !user) return null;

  // Handle Avatar Image Selection & Upload
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 1. Upload file to static media storage
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = uploadRes.data.fileUrl;

      // 2. Persist new avatar URL on user profile and broadcast live
      await updateProfile({ avatarUrl: newAvatarUrl });
    } catch (err: any) {
      console.error('Failed to update avatar:', err);
      setErrorMessage(
        err.response?.data?.error || 'Failed to upload profile picture'
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save Display Name
  const handleSaveName = async () => {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === user.name) {
      setIsEditingName(false);
      setNameVal(user.name);
      return;
    }

    setIsSavingName(true);
    setErrorMessage(null);

    try {
      await updateProfile({ name: trimmed });
      setIsEditingName(false);
    } catch (err: any) {
      console.error('Failed to update name:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setNameVal(user.name);
    }
  };

  // Save About Status
  const handleSaveAbout = async () => {
    const trimmed = aboutVal.trim();
    if (trimmed === user.about) {
      setIsEditingAbout(false);
      return;
    }

    setIsSavingAbout(true);
    setErrorMessage(null);

    try {
      await updateProfile({ about: trimmed });
      setIsEditingAbout(false);
    } catch (err: any) {
      console.error('Failed to update about:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to update about');
    } finally {
      setIsSavingAbout(false);
    }
  };

  const handleAboutKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveAbout();
    } else if (e.key === 'Escape') {
      setIsEditingAbout(false);
      setAboutVal(user.about || 'Hey there! I am using WhatsApp.');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-wa-surface animate-in slide-in-from-left duration-200 select-none">
      {/* Header Bar */}
      <header className="flex h-[108px] flex-col justify-end bg-wa-green dark:bg-wa-panel p-4 text-white dark:text-wa-primary shadow flex-shrink-0">
        <div className="flex items-center gap-6 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-medium">Profile</h2>
        </div>
      </header>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto bg-wa-bg/40">
        {/* Error Alert */}
        {errorMessage && (
          <div className="m-4 flex items-center justify-between rounded-md bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:opacity-80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 1. Large Profile Avatar with Hover Overlay */}
        <div className="flex flex-col items-center justify-center py-7">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) =>
              e.key === 'Enter' ? fileInputRef.current?.click() : null
            }
            className="group relative h-48 w-48 cursor-pointer overflow-hidden rounded-full shadow-md border-2 border-wa-border/50 focus:outline-none"
            title="Click to change profile picture"
          >
            <img
              src={
                user.avatar ||
                user.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
              }
              alt={user.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-200"
            />

            {/* Hover overlay scrim */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-7 w-7 mb-1.5" />
              <span className="text-[11px] font-semibold text-center uppercase tracking-wider px-3">
                Change Profile Photo
              </span>
            </div>

            {/* Uploading Spinner Overlay */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-wa-green mb-1" />
                <span className="text-xs">Uploading...</span>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* 2. Your Name Section */}
        <div className="bg-wa-surface px-6 py-3.5 shadow-sm border-y border-wa-border/40">
          <span className="text-xs font-medium text-wa-green block mb-1.5">
            Your name
          </span>

          {!isEditingName ? (
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-normal text-wa-primary truncate pr-2">
                {user.name}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-wa-secondary hover:text-wa-primary p-1.5 rounded-full hover:bg-wa-hover transition-colors focus:outline-none"
                title="Edit name"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center border-b-2 border-wa-green pb-1">
              <input
                type="text"
                autoFocus
                maxLength={50}
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={handleNameKeyDown}
                disabled={isSavingName}
                className="w-full bg-transparent text-[15px] text-wa-primary focus:outline-none pr-2"
              />
              <span className="text-xs text-wa-secondary mr-2 flex-shrink-0">
                {50 - nameVal.length}
              </span>
              {isSavingName ? (
                <Loader2 className="h-4 w-4 animate-spin text-wa-green" />
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="p-1 text-wa-green hover:opacity-80 focus:outline-none"
                    title="Save name"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameVal(user.name);
                    }}
                    className="p-1 text-wa-secondary hover:text-wa-primary focus:outline-none"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Name Info Disclaimer */}
        <div className="px-6 py-3 text-xs text-wa-secondary leading-relaxed">
          This is not your username or pin. This name will be visible to your
          WhatsApp contacts.
        </div>

        {/* 3. About Status Section */}
        <div className="bg-wa-surface px-6 py-3.5 shadow-sm border-y border-wa-border/40 mt-3">
          <span className="text-xs font-medium text-wa-green block mb-1.5">
            About
          </span>

          {!isEditingAbout ? (
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-wa-primary truncate pr-2">
                {user.about || 'Hey there! I am using WhatsApp.'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAbout(true)}
                className="text-wa-secondary hover:text-wa-primary p-1.5 rounded-full hover:bg-wa-hover transition-colors focus:outline-none"
                title="Edit about"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center border-b-2 border-wa-green pb-1">
              <input
                type="text"
                autoFocus
                maxLength={140}
                value={aboutVal}
                onChange={(e) => setAboutVal(e.target.value)}
                onKeyDown={handleAboutKeyDown}
                disabled={isSavingAbout}
                className="w-full bg-transparent text-[14px] text-wa-primary focus:outline-none pr-2"
              />
              <span className="text-xs text-wa-secondary mr-2 flex-shrink-0">
                {140 - aboutVal.length}
              </span>
              {isSavingAbout ? (
                <Loader2 className="h-4 w-4 animate-spin text-wa-green" />
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSaveAbout}
                    className="p-1 text-wa-green hover:opacity-80 focus:outline-none"
                    title="Save about"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAbout(false);
                      setAboutVal(user.about || 'Hey there! I am using WhatsApp.');
                    }}
                    className="p-1 text-wa-secondary hover:text-wa-primary focus:outline-none"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
