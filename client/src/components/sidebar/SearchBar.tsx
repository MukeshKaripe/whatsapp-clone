import { useState } from 'react';
import { Search, ArrowLeft, X, Filter } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterUnreadOnly: boolean;
  onToggleUnreadFilter: () => void;
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  filterUnreadOnly,
  onToggleUnreadFilter,
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="flex items-center gap-2 border-b border-wa-border bg-wa-surface px-3 py-2 transition-colors duration-150">
      {/* Search Input Box */}
      <div className="relative flex flex-1 items-center rounded-lg bg-wa-input px-3 py-1.5 transition-all shadow-sm">
        {/* Animated toggle between Search and ArrowLeft when focused */}
        <div className="mr-3 flex items-center text-wa-secondary">
          {isFocused ? (
            <button
              type="button"
              onClick={() => setIsFocused(false)}
              className="text-wa-green transition-transform duration-200"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search or start new chat"
          className="w-full bg-transparent text-sm text-wa-primary placeholder-wa-secondary focus:outline-none"
        />

        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-wa-secondary hover:text-wa-primary focus:outline-none"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter unread chats toggle button */}
      <button
        type="button"
        onClick={onToggleUnreadFilter}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none ${
          filterUnreadOnly
            ? 'bg-wa-green text-white font-semibold'
            : 'text-wa-secondary hover:bg-wa-hover hover:text-wa-primary'
        }`}
        title={filterUnreadOnly ? 'Show all chats' : 'Filter unread chats'}
      >
        <Filter className="h-4 w-4" />
      </button>
    </div>
  );
};
