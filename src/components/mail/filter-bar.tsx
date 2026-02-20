"use client";

import { useMailStore } from "@/hooks/use-mail-store";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useMailStore();
  const [keyword, setKeyword] = useState(filters.keyword || "");

  // Sync local keyword state when store filters change (e.g. from AI)
  useEffect(() => {
    setKeyword(filters.keyword || "");
  }, [filters.keyword]);

  const hasFilters =
    filters.keyword || filters.from || filters.dateFrom || filters.dateTo || filters.isRead !== undefined;

  const handleSearch = () => {
    setFilters({ ...filters, keyword });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-foreground/10 px-4 py-2">
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search emails..."
            className="w-48 rounded-lg border border-foreground/10 bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:border-foreground/30"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-lg bg-foreground/5 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/10"
        >
          Search
        </button>
      </div>

      <input
        type="text"
        value={filters.from || ""}
        onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
        placeholder="From..."
        className="w-36 rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/30"
      />

      <input
        type="date"
        value={filters.dateFrom || ""}
        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
        className="rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/30"
      />
      <span className="text-xs text-foreground/40">to</span>
      <input
        type="date"
        value={filters.dateTo || ""}
        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
        className="rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/30"
      />

      <select
        value={filters.isRead === true ? "read" : filters.isRead === false ? "unread" : "all"}
        onChange={(e) =>
          setFilters({
            ...filters,
            isRead:
              e.target.value === "read"
                ? true
                : e.target.value === "unread"
                  ? false
                  : undefined,
          })
        }
        className="rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/30"
      >
        <option value="all">All</option>
        <option value="read">Read</option>
        <option value="unread">Unread</option>
      </select>

      {hasFilters && (
        <button
          onClick={() => {
            resetFilters();
            setKeyword("");
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
