/**
 * RFC-4180 compliant CSV parser and serializer utility.
 * Handles quoted fields, escaped quotes (""), commas within quotes,
 * UTF-8 BOM, CRLF/LF newlines, and header normalization.
 */

export interface ParsedCsvResult {
  headers: string[];
  rawRows: Array<Record<string, string>>;
  errors: string[];
}

/**
 * Parses raw CSV string into headers and row objects.
 */
export function parseCsv(csvText: string): ParsedCsvResult {
  if (!csvText || typeof csvText !== "string") {
    return { headers: [], rawRows: [], errors: ["CSV file is empty"] };
  }

  // Strip UTF-8 Byte Order Mark (BOM) if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
        i++;
        continue;
      } else if (char === "\r" || char === "\n") {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((field) => field.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];

        // Skip \r\n pair
        if (char === "\r" && nextChar === "\n") {
          i += 2;
        } else {
          i++;
        }
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Final field flush
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rawRows: [], errors: ["CSV contains no data rows"] };
  }

  const headers = lines[0].map((h) => h.trim());
  const rawRows: Array<Record<string, string>> = [];
  const errors: string[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowValues = lines[r];
    const rowObj: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowObj[header] = index < rowValues.length ? rowValues[index] : "";
    });

    rawRows.push(rowObj);
  }

  return { headers, rawRows, errors };
}

/**
 * Generates sample product CSV template for download.
 */
export function generateSampleProductCsv(): string {
  const headers = [
    "Name",
    "SKU",
    "Barcode",
    "Category",
    "Supplier",
    "Selling Price",
    "Cost Price",
    "Units In Stock",
    "Min Threshold",
    "Description",
  ];

  const sampleRows = [
    [
      "Coca Cola 500ml",
      "BEV-COKE-500",
      "8901234567890",
      "Beverages",
      "Beverage Distributors Ltd",
      "1.50",
      "0.90",
      "48",
      "10",
      "500ml plastic bottle",
    ],
    [
      "Mineral Water 1L",
      "BEV-WATER-1L",
      "8901234567891",
      "Beverages",
      "Beverage Distributors Ltd",
      "1.00",
      "0.45",
      "60",
      "12",
      "Natural spring water",
    ],
    [
      "Organic Potato Chips 150g",
      "SNK-CHIPS-ORG",
      "8901234567892",
      "Snacks",
      "Snack Direct",
      "2.75",
      "1.40",
      "30",
      "5",
      "Sea salt flavoured chips",
    ],
  ];

  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const csvLines = [
    headers.map(escape).join(","),
    ...sampleRows.map((row) => row.map(escape).join(",")),
  ];

  return csvLines.join("\r\n");
}

/**
 * Generates error report CSV for rows that failed during validation or import execution.
 */
export function generateErrorCsv(
  failedRows: Array<{ rowNumber: number; data: Record<string, string>; errors: string[] }>
): string {
  if (!failedRows || failedRows.length === 0) return "";

  const allKeys = Object.keys(failedRows[0].data || {});
  const headers = ["Row #", ...allKeys, "Error Reasons"];

  const escape = (val: any) => `"${String(val || "").replace(/"/g, '""')}"`;

  const rows = failedRows.map((f) => {
    const values = allKeys.map((k) => f.data[k] || "");
    const errorText = f.errors.join("; ");
    return [escape(f.rowNumber), ...values.map(escape), escape(errorText)].join(",");
  });

  return [headers.map(escape).join(","), ...rows].join("\r\n");
}
