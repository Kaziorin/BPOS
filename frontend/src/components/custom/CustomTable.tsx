"use client";

import { ReactNode } from "react";
import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export interface CustomTableProps<T> {
  columns: CustomTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function CustomTable<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyIcon: EmptyIcon = Inbox,
  emptyMessage = "No records found",
  onRowClick,
}: CustomTableProps<T>) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
        <EmptyIcon size={28} />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-5 py-3", ALIGN_CLASSES[col.align ?? "left"], col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-gray-50 last:border-0",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-5 py-3", ALIGN_CLASSES[col.align ?? "left"], col.className)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
