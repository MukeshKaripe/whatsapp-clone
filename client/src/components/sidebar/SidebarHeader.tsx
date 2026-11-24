import { useState, useRef, useEffect } from 'react';
import {
  CircleDashed,
  MessageSquarePlus,
  MoreVertical,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { User } from '../../types/chat';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarHeaderProps {
  user: User;
  onNewChat?: () => void;
  onNewGroup?: () => void;
  onOpenStatus?: () => void;
  onOpenProfile?: () => void;
}

export const SidebarHeader = ({
  user,
  onNewChat,
  onNewGroup,
  onOpenStatus,
  onOpenProfile,
}: SidebarHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="flex h-[60px] items-center justify-between border-b border-wa-border bg-wa-panel px-4 py-2.5 transition-colors duration-150">
      {/* Current User Profile Avatar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative h-10 w-10 overflow-hidden rounded-full transition-opacity hover:opacity-85 focus:outline-none cursor-pointer"
          title={`View Profile (${user.name})`}
        >
          <img
            src={user.avatar || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user.name}
            className="h-full w-full object-cover"
          />
          {user.isOnline && (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-wa-panel bg-wa-green"
              title="Online"
            />
          )}
        </button>
        <span
          onClick={onOpenProfile}
          className="hidden lg:block truncate max-w-[130px] text-sm font-medium text-wa-primary cursor-pointer hover:underline"
          title="Click to view profile"
        >
          {user.name}
        </span>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-1 text-wa-secondary">
        {/* Theme Toggle Button (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-[#ffd279]" />
          ) : (
            <Moon className="h-5 w-5 text-wa-primary" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenStatus}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="Status"
          aria-label="Status"
        >
          <CircleDashed className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onNewChat}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
          title="New chat"
          aria-label="New chat"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>

        {/* Options Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wa-hover hover:text-wa-primary focus:outline-none"
            title="Menu"
            aria-label="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-wa-border bg-wa-dropdown py-1.5 shadow-wa-dropdown animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-wa-border/50 px-4 py-2">
                <p className="truncate text-xs font-semibold text-wa-primary">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-wa-secondary">
                  {user.email || 'Online'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenProfile?.();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs text-wa-primary hover:bg-wa-hover transition-colors"
              >
                <UserIcon className="h-4 w-4 text-wa-secondary" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNewGroup?.();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs text-wa-primary hover:bg-wa-hover transition-colors"
              >
                <Users className="h-4 w-4 text-wa-secondary" />
                <span>New group</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNewChat?.();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs text-wa-primary hover:bg-wa-hover transition-colors"
              >
                <MessageSquarePlus className="h-4 w-4 text-wa-secondary" />
                <span>New chat</span>
              </button>

              <div className="my-1 border-t border-wa-border/50" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs text-red-500 hover:bg-wa-hover transition-colors"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
