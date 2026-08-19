import { SystemSettings, DateFormat, TimeFormat } from "../models/Settings";

export interface DateTimeFormatOptions {
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
}

export function parseDateInput(input: string | number | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(
  input: string | number | Date | null | undefined,
  settings?: DateTimeFormatOptions
): string {
  const d = parseDateInput(input);
  if (!d) return "---";

  const format = settings?.dateFormat || "MM/DD/YYYY";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
}

export function formatTime(
  input: string | number | Date | null | undefined,
  settings?: DateTimeFormatOptions
): string {
  const d = parseDateInput(input);
  if (!d) return "---";

  const format = settings?.timeFormat || "12H";
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");

  if (format === "24H") {
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const strHours = String(hours).padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
}

export function formatDateTime(
  input: string | number | Date | null | undefined,
  settings?: DateTimeFormatOptions
): string {
  const d = parseDateInput(input);
  if (!d) return "---";

  return `${formatDate(d, settings)} ${formatTime(d, settings)}`;
}
