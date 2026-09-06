export function money(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") {
    return "Tk 0.00";
  }
  const n = typeof value === "string" ? Number(value) : value;
  if (isNaN(n)) {
    return "Tk 0.00";
  }
  return `Tk ${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateTime(value?: string | Date | null): string {
  if (!value) return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}
