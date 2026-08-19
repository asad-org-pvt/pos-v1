import { OrganizationSettings } from "../models/Settings";

export interface CurrencyDetails {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: "BEFORE" | "AFTER";
  decimalPrecision: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDetails> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "Rs. ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", symbolPosition: "BEFORE", decimalPrecision: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", symbolPosition: "BEFORE", decimalPrecision: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "AU$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "SAR ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", symbolPosition: "BEFORE", decimalPrecision: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", symbolPosition: "BEFORE", decimalPrecision: 0 },
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  USA: "USD",
  "UNITED STATES": "USD",
  PK: "PKR",
  PAKISTAN: "PKR",
  GB: "GBP",
  UK: "GBP",
  "UNITED KINGDOM": "GBP",
  CA: "CAD",
  CANADA: "CAD",
  AU: "AUD",
  AUSTRALIA: "AUD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  GERMANY: "EUR",
  FRANCE: "EUR",
  AE: "AED",
  UAE: "AED",
  "UNITED ARAB EMIRATES": "AED",
  SA: "SAR",
  "SAUDI ARABIA": "SAR",
  IN: "INR",
  INDIA: "INR",
  JP: "JPY",
  JAPAN: "JPY",
};

/**
 * Derives default currency from location or country name/code.
 */
export function deriveCurrencyFromCountry(countryStr: string): CurrencyDetails {
  if (!countryStr) return SUPPORTED_CURRENCIES.USD;
  const normalized = countryStr.trim().toUpperCase();
  const code = COUNTRY_TO_CURRENCY[normalized] || "USD";
  return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
}

/**
 * Pure, deterministic currency formatter based on active Organization Settings.
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  settings?: Partial<OrganizationSettings>
): string {
  const numericAmount = Number(amount) || 0;
  const precision =
    settings?.decimalPrecision !== undefined ? settings.decimalPrecision : 2;
  const symbol = settings?.currencySymbol || "$";
  const position = settings?.symbolPosition || "BEFORE";

  const formattedNum = numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  if (numericAmount < 0) {
    const positiveNum = Math.abs(numericAmount).toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
    if (position === "AFTER") {
      return `-${positiveNum} ${symbol}`;
    }
    return `-${symbol}${positiveNum}`;
  }

  if (position === "AFTER") {
    return `${formattedNum} ${symbol}`;
  }

  return `${symbol}${formattedNum}`;
}
