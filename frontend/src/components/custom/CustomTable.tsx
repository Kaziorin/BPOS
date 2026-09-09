"use client";

import { ReactNode, useState, useMemo } from "react";
import { type LucideIcon, Inbox, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
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

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rawRows, sortKey, sortDirection, columns]);

  // Pagination bounds
  const totalItems = isServerPaginated ? serverTotalItems : sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / activePageSize));
  const validCurrentPage = Math.min(activePage, totalPages);

  const paginatedRows = useMemo(() => {
    if (isServerPaginated || !showPagination) return sortedRows;
    const start = (validCurrentPage - 1) * activePageSize;
    return sortedRows.slice(start, start + activePageSize);
  }, [sortedRows, validCurrentPage, activePageSize, showPagination, isServerPaginated]);

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

  const handlePageSelect = (p: number) => {
    if (p < 1 || p > totalPages) return;
    if (isServerPaginated && onPageChange) {
      onPageChange(p);
    } else {
      setLocalPage(p);
    }
  };

  const handleSizeChange = (newSize: number) => {
    if (isServerPaginated && onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      setLocalPageSize(newSize);
      setLocalPage(1);
    }
  };

  if (loading) {
    return (
      <div className="flex h-36 items-center justify-center p-4 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
          <span className="text-xs font-semibold text-slate-500">Loading records...</span>
        </div>
      </div>
    );
  }

  if (rawRows.length === 0) {
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

  return (
    <div className="w-full space-y-2.5">
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-gray-600 font-bold capitalize tracking-wide select-none">
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
                    className={cn(
                      "px-4 py-3 text-[13px] font-bold text-gray-600 transition whitespace-nowrap",
                      alignCss,
                      col.sortable && "cursor-pointer hover:bg-slate-100 hover:text-teal-600",
                      col.className
                    )}
                  >
                    <div className={cn("inline-flex items-center gap-1.5 w-full", flexJustify)}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400 shrink-0">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp size={14} className="text-teal-600 font-bold" />
                            ) : (
                              <ArrowDown size={14} className="text-teal-600 font-bold" />
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
                  "hover:bg-slate-50 transition",
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
                      className={cn(
                        "px-4 py-3 font-medium text-gray-600 text-sm whitespace-nowrap",
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
      </div>

      {/* Sleek Premium Pagination Footer */}
      {showPagination && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-1 py-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={activePageSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-teal-500 focus:outline-none shadow-2xs"
            >
              {[5, 10, 25, 50].map((s) => (
                <option key={s} value={s}>
                  {s} per page
                </option>
              ))}
            </select>
            <span className="text-slate-500 font-medium ml-1">
              Showing <strong className="text-slate-800">{startEntry}</strong>–
              <strong className="text-slate-800">{endEntry}</strong> of{" "}
              <strong className="text-slate-800">{totalItems}</strong>
            </span>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => handlePageSelect(validCurrentPage - 1)}
              className="flex h-7 px-2.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-xs shadow-2xs gap-1"
            >
              <ChevronLeft size={13} /> Prev
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePageSelect(p)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition shadow-2xs",
                  p === validCurrentPage
                    ? "bg-teal-600 text-white border border-teal-600 shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => handlePageSelect(validCurrentPage + 1)}
              className="flex h-7 px-2.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-xs shadow-2xs gap-1"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
