export type DateRangePreset = "today" | "yesterday" | "last7days" | "last30days" | "custom" | "all";

export interface DateBounds {
  startIso: string;
  endIso: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Authoritative date range resolver for management reporting and queries.
 * Eliminates timezone ambiguity by anchoring day boundaries to standard UTC ISO timestamps.
 */
export function getStoreDateBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): DateBounds {
  const now = new Date();

  let start = new Date(0); // 1970 Epoch
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (preset === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
    end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
  } else if (preset === "last7days") {
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 7);
    start = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 0, 0, 0, 0);
  } else if (preset === "last30days") {
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 30);
    start = new Date(d30.getFullYear(), d30.getMonth(), d30.getDate(), 0, 0, 0, 0);
  } else if (preset === "custom") {
    if (customStart) start = new Date(customStart);
    if (customEnd) end = new Date(customEnd);
  } else if (preset === "all") {
    start = new Date(0);
    end = new Date(9999, 11, 31, 23, 59, 59, 999);
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: start,
    endDate: end,
  };
}
