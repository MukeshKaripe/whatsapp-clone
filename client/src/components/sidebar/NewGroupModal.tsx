import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Check,
  Camera,
  Loader2,
  Users,
} from 'lucide-react';
import api from '../../services/api';
import { User, Chat } from '../../types/chat';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (chat: Chat) => void;
}

export const NewGroupModal = ({
  isOpen,
  onClose,
  onGroupCreated,
}: NewGroupModalProps) => {
  const [step, setStep] = useState<1 | 2>(1); // 1 = select participants, 2 = group subject & avatar
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearch('');
      setSelectedUsers([]);
      setGroupName('');
      setGroupAvatar(null);
      setError(null);
    }
  }, [isOpen]);

  // Fetch registered contacts
  useEffect(() => {
    if (!isOpen) return;

    const fetchContacts = async () => {
      setLoadingContacts(true);
      setError(null);
      try {
        const res = await api.get('/users', {
          params: { search: search.trim() || undefined },
        });
        setContacts(
          res.data.users.map((u: any) => ({
            ...u,
            avatar:
              u.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          }))
        );
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    const timer = setTimeout(fetchContacts, 200);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  if (!isOpen) return null;

  const toggleSelectUser = (user: User) => {
    setError(null);
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setGroupAvatar(res.data.fileUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload group avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please provide a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Please select at least 2 other contacts');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/chats/group', {
        name: groupName.trim(),
        participantIds: selectedUsers.map((u) => u.id),
        avatarUrl: groupAvatar || null,
      });

      const newChat: Chat = res.data.chat;
      onGroupCreated(newChat);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-wa-surface animate-in slide-in-from-left duration-200">
      {/* Top Header */}
      <header className="flex h-[108px] flex-col justify-end bg-wa-green dark:bg-wa-panel p-4 text-white dark:text-wa-primary shadow">
        <div className="flex items-center gap-6 pb-2">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-medium leading-tight">
              {step === 1 ? 'Add group members' : 'New group'}
            </h2>
            {step === 1 && (
              <p className="text-xs text-white/80 dark:text-wa-secondary">
                {selectedUsers.length} of {contacts.length} selected
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Step 1: Select Participants */}
      {step === 1 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Selected Users Chips Container */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-wa-border bg-wa-panel/40 p-2.5 max-h-28 overflow-y-auto">
              {selectedUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 rounded-full bg-wa-hover py-1 pl-1.5 pr-2 text-xs text-wa-primary shadow-sm border border-wa-border"
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span className="font-medium max-w-[100px] truncate">{u.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedUser(u.id)}
                    className="text-wa-secondary hover:text-red-500 focus:outline-none ml-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="border-b border-wa-border bg-wa-surface p-3">
            <div className="flex items-center rounded-lg bg-wa-input px-3 py-1.5 shadow-sm">
              <Search className="mr-2.5 h-4 w-4 text-wa-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email"
                className="w-full bg-transparent text-sm text-wa-primary placeholder-wa-secondary focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-wa-secondary hover:text-wa-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 px-4 py-2 text-center text-xs text-red-500">
              {error}
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex h-32 items-center justify-center text-wa-secondary">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-wa-green" />
                <span className="text-xs">Loading contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-wa-secondary">
                No contacts found matching "{search}"
              </div>
            ) : (
              contacts.map((u) => {
                const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                return (
                  <div
                    key={u.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSelectUser(u)}
                    onKeyDown={(e) => (e.key === 'Enter' ? toggleSelectUser(u) : null)}
                    className={`flex items-center gap-3 border-b border-wa-border/50 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-wa-hover' : 'hover:bg-wa-hover/60'
                    }`}
                  >
                    <div className="relative h-11 w-11 flex-shrink-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-wa-green text-white shadow">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium text-wa-primary">
                        {u.name}
                      </span>
                      <span className="truncate text-xs text-wa-secondary">
                        {u.about || u.email}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Forward Button (Step 1 -> Step 2) */}
          {selectedUsers.length >= 2 && (
            <div className="flex justify-center p-4 bg-wa-panel/30 border-t border-wa-border">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-wa-green text-white shadow-lg hover:bg-wa-green-hover transition-transform hover:scale-105 focus:outline-none"
                title="Next"
              >
                <ArrowRight className="h-6 w-6 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Group Subject & Avatar */}
      {step === 2 && (
        <div className="flex flex-1 flex-col p-6 animate-in fade-in duration-150">
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-wa-border bg-wa-panel shadow-inner">
              {groupAvatar ? (
                <img
                  src={groupAvatar}
                  alt="Group Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-wa-secondary">
                  <Users className="h-14 w-14 stroke-[1.2]" />
                </div>
              )}

              {/* Upload Overlay */}
              <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      Add icon
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-wa-secondary">
              Optional group icon
            </p>
          </div>

          {/* Group Subject Name Input */}
          <div className="mt-6 flex flex-col gap-1">
            <label className="text-xs font-semibold text-wa-green uppercase tracking-wider">
              Group Subject
            </label>
            <div className="flex items-center border-b-2 border-wa-green bg-transparent pb-1">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
                placeholder="Type group subject here..."
                autoFocus
                className="w-full bg-transparent text-sm text-wa-primary placeholder-wa-secondary focus:outline-none"
              />
              <span className="text-xs text-wa-secondary flex-shrink-0 ml-2">
                {50 - groupName.length}
              </span>
            </div>
            <p className="text-[11px] text-wa-secondary mt-1">
              Provide a group subject and optional group icon
            </p>
          </div>

          {/* Summary of members */}
          <div className="mt-6 flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-wa-secondary mb-2">
              Participants: {selectedUsers.length}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="rounded-full bg-wa-hover px-2.5 py-1 text-xs text-wa-primary border border-wa-border"
                >
                  {u.name}
                </span>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded bg-red-500/10 p-2 text-center text-xs text-red-500">
              {error}
            </div>
          )}

          {/* Floating Confirm Button */}
          <div className="mt-auto flex justify-center py-6">
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isSubmitting || !groupName.trim()}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-wa-green text-white shadow-xl hover:bg-wa-green-hover transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none cursor-pointer"
              title="Create group"
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Check className="h-7 w-7 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};