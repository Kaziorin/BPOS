"use client";

import React, { ReactNode, useState, useMemo, isValidElement } from "react";
import { type LucideIcon, Inbox, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  width?: string | number;
  getSortValue?: (row: T) => any;
}

export interface CustomTableProps<T> {
  columns: CustomTableColumn<T>[];
  data: T[];
  rowKey?: ((row: T) => string) | keyof T | string;
  loading?: boolean;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  showPagination?: boolean;
  // Server-side API pagination props
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // Integrated Card Header Props
  title?: ReactNode;
  subtitle?: string;
  icon?: LucideIcon | ReactNode;
  badge?: ReactNode;
  toolbar?: ReactNode;
}

export function CustomTable<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyIcon: EmptyIcon = Inbox,
  emptyMessage = "No records found",
  onRowClick,
  pageSize: initialPageSize = 10,
  showPagination = true,
  totalItems: serverTotalItems,
  currentPage: serverCurrentPage,
  onPageChange,
  onPageSizeChange,
  title,
  subtitle,
  icon,
  badge,
  toolbar,
}: CustomTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === "function") return rowKey(row);
    if (typeof rowKey === "string" && row && typeof row === "object" && rowKey in row) {
      return String((row as any)[rowKey]);
    }
    if (row && typeof row === "object" && "id" in row && (row as any).id) {
      return String((row as any).id);
    }
    return String(index);
  };

  // Sort State
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Local Pagination State
  const [localPage, setLocalPage] = useState<number>(1);
  const [localPageSize, setLocalPageSize] = useState<number>(initialPageSize);

  const isServerPaginated = typeof serverTotalItems === "number" && !!onPageChange;
  const activePage = isServerPaginated ? (serverCurrentPage ?? 1) : localPage;
  const activePageSize = isServerPaginated ? initialPageSize : localPageSize;

  const rawRows: T[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  // Sorting logic
  const sortedRows = useMemo(() => {
    if (!sortKey) return rawRows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rawRows;

    return [...rawRows].sort((a, b) => {
      let valA = col.getSortValue ? col.getSortValue(a) : (a as any)[sortKey];
      let valB = col.getSortValue ? col.getSortValue(b) : (b as any)[sortKey];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      const result = valA < valB ? -1 : 1;
      return sortDirection === "asc" ? result : -result;
    });
  }, [rawRows, columns, sortKey, sortDirection]);

  // Total items for pagination
  const totalItems = isServerPaginated ? (serverTotalItems ?? 0) : sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / activePageSize));
  const validCurrentPage = Math.min(Math.max(1, activePage), totalPages);

  // Paginated Rows (Local mode only; server mode uses rows directly)
  const paginatedRows = useMemo(() => {
    if (isServerPaginated) return sortedRows;
    const start = (validCurrentPage - 1) * activePageSize;
    return sortedRows.slice(start, start + activePageSize);
  }, [isServerPaginated, sortedRows, validCurrentPage, activePageSize]);

  // Page handlers
  const handlePageSelect = (page: number) => {
    const p = Math.min(Math.max(1, page), totalPages);
    if (isServerPaginated) {
      onPageChange?.(p);
    } else {
      setLocalPage(p);
    }
  };

  const handleSizeChange = (newSize: number) => {
    if (isServerPaginated) {
      onPageSizeChange?.(newSize);
    } else {
      setLocalPageSize(newSize);
      setLocalPage(1);
    }
  };

  const handleHeaderClick = (col: CustomTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(col.key);
      setSortDirection("asc");
    }
  };

  const hasHeader = Boolean(title || toolbar || icon);

  if (loading && !hasHeader) {
    return (
      <div className="flex h-36 items-center justify-center p-4 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
          <span className="text-xs font-semibold text-slate-500">Loading records...</span>
        </div>
      </div>
    );
  }

  if (rawRows.length === 0 && !hasHeader) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-slate-400">
        <EmptyIcon size={28} className="text-slate-300" />
        <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  const startEntry = Math.min((validCurrentPage - 1) * activePageSize + 1, totalItems);
  const endEntry = Math.min(validCurrentPage * activePageSize, totalItems);

  // Generate compact page numbers for pagination
  const pageNumbers: number[] = [];
  const maxButtons = 5;
  let startP = Math.max(1, validCurrentPage - 2);
  let endP = Math.min(totalPages, startP + maxButtons - 1);
  if (endP - startP + 1 < maxButtons) {
    startP = Math.max(1, endP - maxButtons + 1);
  }
  for (let i = startP; i <= endP; i++) {
    pageNumbers.push(i);
  }

  const headerNode = hasHeader ? (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-light bg-brand-50/60 px-4 py-3 shrink-0">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-50 text-brand-primary border border-brand-border shrink-0">
            {isValidElement(icon)
              ? icon
              : typeof icon === "function" ||
                (typeof icon === "object" &&
                  icon !== null &&
                  ("$$typeof" in (icon as any) || "render" in (icon as any)))
              ? React.createElement(icon as React.ElementType, { size: 15 })
              : (icon as ReactNode)}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            {typeof title === "string" ? (
              <h3 className="text-xs sm:text-sm font-bold text-brand-dark">{title}</h3>
            ) : (
              title
            )}
            {badge}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {toolbar && <div className="flex items-center gap-2 shrink-0">{toolbar}</div>}
    </div>
  ) : null;

  const paginationNode = showPagination && totalItems > 0 ? (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium",
        "border-t border-brand-border bg-brand-50/40 px-5 py-3.5 shrink-0"
      )}
    >
      <div className="flex items-center gap-2">
        <span>Show:</span>
        <select
          value={activePageSize}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="rounded-sm border border-brand-border bg-white px-2 py-1 text-xs font-semibold text-slate-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none shadow-2xs cursor-pointer"
        >
          {[5, 10, 25, 50].map((s) => (
            <option key={s} value={s}>
              {s} per page
            </option>
          ))}
        </select>
        <span className="text-slate-600 font-medium ml-1">
          Showing <strong className="font-bold text-brand-primary">{startEntry}</strong>–
          <strong className="font-bold text-brand-primary">{endEntry}</strong> of{" "}
          <strong className="font-bold text-brand-primary">{totalItems}</strong>
        </span>
      </div>

      {/* Page Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={validCurrentPage <= 1}
          onClick={() => handlePageSelect(validCurrentPage - 1)}
          className="flex h-7 px-2.5 items-center justify-center rounded-sm border border-brand-border bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold text-xs shadow-2xs gap-1 cursor-pointer"
        >
          <ChevronLeft size={13} /> Prev
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePageSelect(p)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-sm text-xs font-semibold transition shadow-2xs cursor-pointer",
              p === validCurrentPage
                ? "bg-brand-gradient text-white border-transparent shadow-2xs font-bold"
                : "border border-brand-border bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-primary"
            )}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={validCurrentPage >= totalPages}
          onClick={() => handlePageSelect(validCurrentPage + 1)}
          className="flex h-7 px-2.5 items-center justify-center rounded-sm border border-brand-border bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold text-xs shadow-2xs gap-1 cursor-pointer"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  ) : null;

  const tableNode = (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-brand-light bg-brand-50/70 text-brand-dark font-bold capitalize tracking-wide select-none">
          {columns.map((col, idx) => {
            const isFirst = idx === 0;
            const alignMode = col.align || (isFirst ? "left" : "center");

            const alignCss =
              alignMode === "right"
                ? "text-right"
                : alignMode === "center"
                ? "text-center"
                : "text-left";

            const flexJustify =
              alignMode === "right"
                ? "justify-end"
                : alignMode === "center"
                ? "justify-center"
                : "justify-start";

            const isSorted = sortKey === col.key;

            return (
              <th
                key={col.key}
                onClick={() => handleHeaderClick(col)}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "px-4 py-3 text-[13px] font-bold text-brand-dark transition whitespace-nowrap",
                  alignCss,
                  col.sortable && "cursor-pointer hover:bg-brand-50 hover:text-brand-primary",
                  col.className
                )}
              >
                <div className={cn("inline-flex items-center gap-1.5 w-full", flexJustify)}>
                  <span>{col.header}</span>
                  {col.sortable && (
                    <span className="text-slate-400 shrink-0">
                      {isSorted ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={14} className="text-brand-primary font-bold" />
                        ) : (
                          <ArrowDown size={14} className="text-brand-primary font-bold" />
                        )
                      ) : (
                        <ArrowUpDown size={13} className="opacity-40 hover:opacity-100" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {paginatedRows.map((row, idx) => (
          <tr
            key={getRowKey(row, idx)}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "hover:bg-brand-50/30 transition",
              onRowClick && "cursor-pointer"
            )}
          >
            {columns.map((col, idx) => {
              const isFirst = idx === 0;
              const alignMode = col.align || (isFirst ? "left" : "center");
              const alignCss =
                alignMode === "right"
                  ? "text-right"
                  : alignMode === "center"
                  ? "text-center"
                  : "text-left";

              const flexJustify =
                alignMode === "right"
                  ? "justify-end"
                  : alignMode === "center"
                  ? "justify-center"
                  : "justify-start";

              return (
                <td
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-4 py-3 font-medium text-slate-700 text-sm whitespace-nowrap",
                    alignCss,
                    col.className
                  )}
                >
                  <div className={cn("flex items-center w-full", flexJustify)}>
                    {col.render(row)}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (hasHeader) {
    return (
      <div className="w-full rounded-sm border border-brand-border bg-white shadow-2xs overflow-hidden flex flex-col">
        {headerNode}
        {loading ? (
          <div className="flex h-36 items-center justify-center p-4 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
              <span className="text-xs font-semibold text-slate-500">Loading records...</span>
            </div>
          </div>
        ) : rawRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-slate-400">
            <EmptyIcon size={28} className="text-slate-300" />
            <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">{tableNode}</div>
        )}
        {paginationNode}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        {tableNode}
      </div>
      {paginationNode}
    </div>
  );
}
