import { useState } from 'react';
import { X, Users, Search } from 'lucide-react';
import { Chat, User } from '../../types/chat';

interface GroupInfoDrawerProps {
  chat: Chat;
  currentUserId: string;
  onClose: () => void;
}

export const GroupInfoDrawer = ({
  chat,
  currentUserId,
  onClose,
}: GroupInfoDrawerProps) => {
  const [memberSearch, setMemberSearch] = useState('');

  const participants: User[] = chat.participants || [];

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  return (
    <div className="absolute right-0 top-0 bottom-0 z-40 flex w-full flex-col border-l border-wa-border bg-wa-surface shadow-lg sm:w-[380px] md:w-[420px] animate-in slide-in-from-right duration-200 overflow-hidden">
      {/* Drawer Header */}
      <header className="flex h-[60px] items-center gap-6 border-b border-wa-border bg-wa-panel px-4 py-2.5 text-wa-primary select-none">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-wa-secondary transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="Close"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-medium">Group info</h2>
      </header>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Group Hero Card */}
        <div className="flex flex-col items-center border-b border-wa-border bg-wa-surface p-6 text-center">
          <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border-2 border-wa-border shadow-md">
            {chat.avatar ? (
              <img
                src={chat.avatar}
                alt={chat.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-wa-panel text-wa-secondary">
                <Users className="h-14 w-14" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-medium text-wa-primary break-words max-w-full">
            {chat.name}
          </h3>

          <p className="mt-1 text-xs text-wa-secondary">
            Group · {participants.length} participants
          </p>
        </div>

        {/* Group Description / Details Card */}
        <div className="border-b border-wa-border bg-wa-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-wa-green">
            Description
          </span>
          <p className="mt-1 text-sm text-wa-secondary leading-relaxed">
            Welcome to {chat.name}! Chat, share photos, and stay connected with everyone in this group.
          </p>
        </div>

        {/* Participants Header & Search */}
        <div className="bg-wa-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-wa-secondary">
              {participants.length} participants
            </span>
          </div>

          {/* Member Search Bar */}
          {participants.length > 4 && (
            <div className="mb-3 flex items-center rounded-lg bg-wa-input px-3 py-1.5 shadow-sm border border-wa-border/50">
              <Search className="mr-2 h-4 w-4 text-wa-secondary flex-shrink-0" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search participants"
                className="w-full bg-transparent text-xs text-wa-primary placeholder-wa-secondary focus:outline-none"
              />
              {memberSearch && (
                <button
                  type="button"
                  onClick={() => setMemberSearch('')}
                  className="text-wa-secondary hover:text-wa-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Participants List */}
          <div className="divide-y divide-wa-border/40">
            {filteredParticipants.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-3 hover:bg-wa-hover/50 px-2 rounded-lg transition-colors"
                >
                  {/* Member Avatar */}
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <img
                      src={
                        member.avatar ||
                        member.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      }
                      alt={member.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                    {member.isOnline && (
                      <span
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-wa-surface bg-wa-green"
                        title="Online"
                      />
                    )}
                  </div>

                  {/* Member Name & Status */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-wa-primary">
                        {member.name} {isCurrentUser && <span className="text-xs text-wa-secondary">(You)</span>}
                      </span>
                    </div>
                    <span className="truncate text-xs text-wa-secondary">
                      {member.about || member.email || 'Hey there! I am using WhatsApp.'}
                    </span>
                  </div>

                  {/* Online Badge */}
                  {member.isOnline ? (
                    <span className="text-[11px] font-medium text-wa-green flex-shrink-0">
                      online
                    </span>
                  ) : member.lastSeen ? (
                    <span className="text-[10px] text-wa-secondary flex-shrink-0">
                      last seen {String(member.lastSeen)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};