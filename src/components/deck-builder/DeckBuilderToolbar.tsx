"use client";

import { ViewMode, CategoryMode, SortMode } from "./types";

interface DeckBuilderToolbarProps {
  viewMode: ViewMode;
  categoryMode: CategoryMode;
  sortMode: SortMode;
  searchQuery: string;
  onViewModeChange: (mode: ViewMode) => void;
  onCategoryModeChange: (mode: CategoryMode) => void;
  onSortModeChange: (mode: SortMode) => void;
  onSearchChange: (query: string) => void;
}

/**
 * Toolbar for the deck builder with view toggle, categorization, search, and sort controls.
 */
export function DeckBuilderToolbar({
  viewMode,
  categoryMode,
  sortMode,
  searchQuery,
  onViewModeChange,
  onCategoryModeChange,
  onSortModeChange,
  onSearchChange,
}: DeckBuilderToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl mb-6">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--foreground-muted)]">View:</span>
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            onClick={() => onViewModeChange("stacks")}
            className={`px-3 py-1.5 text-sm transition-colors ${
              viewMode === "stacks"
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
            title="Stack view (like Archidekt)"
          >
            <StackIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("text")}
            className={`px-3 py-1.5 text-sm transition-colors ${
              viewMode === "text"
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
            title="Text view (like Moxfield)"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Mode Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--foreground-muted)]">Group by:</span>
        <select
          value={categoryMode}
          onChange={(e) => onCategoryModeChange(e.target.value as CategoryMode)}
          className="px-3 py-1.5 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="mana-value">Mana Value</option>
          <option value="card-type">Card Type</option>
          {/* <option value="categories">Categories</option> */}
        </select>
      </div>

      {/* Sort Mode Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--foreground-muted)]">Sort:</span>
        <select
          value={sortMode}
          onChange={(e) => onSortModeChange(e.target.value as SortMode)}
          className="px-3 py-1.5 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="mana-value">Mana Value</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Search Box */}
      <div className="flex-grow min-w-[200px]">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
