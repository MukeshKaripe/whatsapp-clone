import { useState, useEffect } from 'react';
import { ArrowLeft, Search, X, Loader2, Users } from 'lucide-react';
import api from '../../services/api';
import { User } from '../../types/chat';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => Promise<void> | void;
  onOpenNewGroup?: () => void;
}

export const NewChatModal = ({
  isOpen,
  onClose,
  onSelectUser,
  onOpenNewGroup,
}: NewChatModalProps) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);

  const handleSelectContact = async (u: User) => {
    if (creatingUserId) return;
    setCreatingUserId(u.id);
    try {
      await onSelectUser(u);
    } finally {
      setCreatingUserId(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/users', {
          params: { search: search.trim() || undefined },
        });
        setUsers(
          res.data.users.map((u: any) => ({
            ...u,
            avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          }))
        );
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-wa-surface animate-in slide-in-from-left duration-200">
      {/* Top Header */}
      <header className="flex h-[108px] flex-col justify-end bg-wa-green dark:bg-wa-panel p-4 text-white dark:text-wa-primary shadow">
        <div className="flex items-center gap-6 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-medium">New chat</h2>
        </div>
      </header>

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

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {/* Action: New Group */}
        {!search && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              onClose();
              onOpenNewGroup?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onClose();
                onOpenNewGroup?.();
              }
            }}
            className="flex items-center gap-4 border-b border-wa-border/50 px-4 py-3 cursor-pointer hover:bg-wa-hover transition-colors"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-wa-green text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-wa-primary">
              New group
            </span>
          </div>
        )}

        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-wa-secondary">
          Contacts on WhatsApp
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-wa-secondary">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-xs">Loading contacts...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-xs text-wa-secondary">
            No contacts found matching "{search}"
          </div>
        ) : (
          users.map((u) => {
            const isSelecting = creatingUserId === u.id;
            return (
              <div
                key={u.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectContact(u)}
                onKeyDown={(e) => (e.key === 'Enter' ? handleSelectContact(u) : null)}
                className={`flex items-center gap-3 border-b border-wa-border/50 px-4 py-3 cursor-pointer transition-colors ${
                  isSelecting
                    ? 'bg-wa-active opacity-75 pointer-events-none'
                    : 'hover:bg-wa-hover'
                }`}
              >
                <div className="relative h-11 w-11 flex-shrink-0">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                  {u.isOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-wa-surface bg-wa-green" />
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
                {isSelecting && (
                  <Loader2 className="h-4 w-4 animate-spin text-wa-green flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
