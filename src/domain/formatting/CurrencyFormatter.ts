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
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", symbolPosition: "BEFORE", decimalPrecision: 2 },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "SG$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  MYR: { code: "MYR", name: "Malaysian Ringgit", symbol: "RM ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  NZD: { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  TRY: { code: "TRY", name: "Turkish Lira", symbol: "₺", symbolPosition: "BEFORE", decimalPrecision: 2 },
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", symbolPosition: "BEFORE", decimalPrecision: 2 },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", symbolPosition: "BEFORE", decimalPrecision: 2 },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", symbolPosition: "BEFORE", decimalPrecision: 2 },
  IDR: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp ", symbolPosition: "BEFORE", decimalPrecision: 0 },
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫", symbolPosition: "AFTER", decimalPrecision: 0 },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "MX$", symbolPosition: "BEFORE", decimalPrecision: 2 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD ", symbolPosition: "BEFORE", decimalPrecision: 3 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "QR ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "OMR ", symbolPosition: "BEFORE", decimalPrecision: 3 },
  BHD: { code: "BHD", name: "Bahraini Dinar", symbol: "BD ", symbolPosition: "BEFORE", decimalPrecision: 3 },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "E£ ", symbolPosition: "BEFORE", decimalPrecision: 2 },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", symbolPosition: "BEFORE", decimalPrecision: 2 },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh ", symbolPosition: "BEFORE", decimalPrecision: 2 },
};

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Pakistan
  PK: "PKR",
  PAK: "PKR",
  PAKISTAN: "PKR",
  // United States
  US: "USD",
  USA: "USD",
  "UNITED STATES": "USD",
  "UNITED STATES OF AMERICA": "USD",
  // United Kingdom
  GB: "GBP",
  GBR: "GBP",
  UK: "GBP",
  "UNITED KINGDOM": "GBP",
  ENGLAND: "GBP",
  SCOTLAND: "GBP",
  WALES: "GBP",
  // Canada
  CA: "CAD",
  CAN: "CAD",
  CANADA: "CAD",
  // Australia
  AU: "AUD",
  AUS: "AUD",
  AUSTRALIA: "AUD",
  // Eurozone
  DE: "EUR",
  DEU: "EUR",
  GERMANY: "EUR",
  FR: "EUR",
  FRA: "EUR",
  FRANCE: "EUR",
  IT: "EUR",
  ITA: "EUR",
  ITALY: "EUR",
  ES: "EUR",
  ESP: "EUR",
  SPAIN: "EUR",
  NL: "EUR",
  NLD: "EUR",
  NETHERLANDS: "EUR",
  BE: "EUR",
  BEL: "EUR",
  BELGIUM: "EUR",
  AT: "EUR",
  AUT: "EUR",
  AUSTRIA: "EUR",
  IE: "EUR",
  IRL: "EUR",
  IRELAND: "EUR",
  PT: "EUR",
  PRT: "EUR",
  PORTUGAL: "EUR",
  GR: "EUR",
  GRC: "EUR",
  GREECE: "EUR",
  FI: "EUR",
  FIN: "EUR",
  FINLAND: "EUR",
  // UAE
  AE: "AED",
  ARE: "AED",
  UAE: "AED",
  "UNITED ARAB EMIRATES": "AED",
  DUBAI: "AED",
  "ABU DHABI": "AED",
  // Saudi Arabia
  SA: "SAR",
  SAU: "SAR",
  KSA: "SAR",
  "SAUDI ARABIA": "SAR",
  // India
  IN: "INR",
  IND: "INR",
  INDIA: "INR",
  // Japan
  JP: "JPY",
  JPN: "JPY",
  JAPAN: "JPY",
  // China
  CN: "CNY",
  CHN: "CNY",
  CHINA: "CNY",
  // Singapore
  SG: "SGD",
  SGP: "SGD",
  SINGAPORE: "SGD",
  // Malaysia
  MY: "MYR",
  MYS: "MYR",
  MALAYSIA: "MYR",
  // New Zealand
  NZ: "NZD",
  NZL: "NZD",
  "NEW ZEALAND": "NZD",
  // Turkey
  TR: "TRY",
  TUR: "TRY",
  TURKEY: "TRY",
  TURKIYE: "TRY",
  // Brazil
  BR: "BRL",
  BRA: "BRL",
  BRAZIL: "BRL",
  // South Africa
  ZA: "ZAR",
  ZAF: "ZAR",
  "SOUTH AFRICA": "ZAR",
  // Philippines
  PH: "PHP",
  PHL: "PHP",
  PHILIPPINES: "PHP",
  // Bangladesh
  BD: "BDT",
  BGD: "BDT",
  BANGLADESH: "BDT",
  // Thailand
  TH: "THB",
  THA: "THB",
  THAILAND: "THB",
  // Indonesia
  ID: "IDR",
  IDN: "IDR",
  INDONESIA: "IDR",
  // Vietnam
  VN: "VND",
  VNM: "VND",
  VIETNAM: "VND",
  // Mexico
  MX: "MXN",
  MEX: "MXN",
  MEXICO: "MXN",
  // Switzerland
  CH: "CHF",
  CHE: "CHF",
  SWITZERLAND: "CHF",
  // Kuwait
  KW: "KWD",
  KWT: "KWD",
  KUWAIT: "KWD",
  // Qatar
  QA: "QAR",
  QAT: "QAR",
  QATAR: "QAR",
  // Oman
  OM: "OMR",
  OMN: "OMR",
  OMAN: "OMR",
  // Bahrain
  BH: "BHD",
  BHR: "BHD",
  BAHRAIN: "BHD",
  // Egypt
  EG: "EGP",
  EGY: "EGP",
  EGYPT: "EGP",
  // Nigeria
  NG: "NGN",
  NGA: "NGN",
  NIGERIA: "NGN",
  // Kenya
  KE: "KES",
  KEN: "KES",
  KENYA: "KES",
};

export interface SystemLocationDetection {
  country: string;
  countryCode: string;
  currency: CurrencyDetails;
  timeZone: string;
  locale: string;
  source: "TIMEZONE" | "LOCALE" | "EXPLICIT_COUNTRY" | "OFFSET" | "DEFAULT";
}

const TIMEZONE_TO_LOCATION_INFO: Record<string, { country: string; countryCode: string; currencyCode: string }> = {
  // Pakistan
  "Asia/Karachi": { country: "Pakistan", countryCode: "PK", currencyCode: "PKR" },
  // India
  "Asia/Kolkata": { country: "India", countryCode: "IN", currencyCode: "INR" },
  "Asia/Calcutta": { country: "India", countryCode: "IN", currencyCode: "INR" },
  // UAE
  "Asia/Dubai": { country: "United Arab Emirates", countryCode: "AE", currencyCode: "AED" },
  "Asia/Abu_Dhabi": { country: "United Arab Emirates", countryCode: "AE", currencyCode: "AED" },
  // Saudi Arabia
  "Asia/Riyadh": { country: "Saudi Arabia", countryCode: "SA", currencyCode: "SAR" },
  // UK
  "Europe/London": { country: "United Kingdom", countryCode: "GB", currencyCode: "GBP" },
  // Eurozone
  "Europe/Berlin": { country: "Germany", countryCode: "DE", currencyCode: "EUR" },
  "Europe/Paris": { country: "France", countryCode: "FR", currencyCode: "EUR" },
  "Europe/Rome": { country: "Italy", countryCode: "IT", currencyCode: "EUR" },
  "Europe/Madrid": { country: "Spain", countryCode: "ES", currencyCode: "EUR" },
  "Europe/Amsterdam": { country: "Netherlands", countryCode: "NL", currencyCode: "EUR" },
  "Europe/Vienna": { country: "Austria", countryCode: "AT", currencyCode: "EUR" },
  "Europe/Brussels": { country: "Belgium", countryCode: "BE", currencyCode: "EUR" },
  "Europe/Dublin": { country: "Ireland", countryCode: "IE", currencyCode: "EUR" },
  "Europe/Lisbon": { country: "Portugal", countryCode: "PT", currencyCode: "EUR" },
  "Europe/Athens": { country: "Greece", countryCode: "GR", currencyCode: "EUR" },
  "Europe/Helsinki": { country: "Finland", countryCode: "FI", currencyCode: "EUR" },
  // Japan
  "Asia/Tokyo": { country: "Japan", countryCode: "JP", currencyCode: "JPY" },
  // China & Hong Kong
  "Asia/Shanghai": { country: "China", countryCode: "CN", currencyCode: "CNY" },
  "Asia/Chongqing": { country: "China", countryCode: "CNY", currencyCode: "CNY" },
  "Asia/Hong_Kong": { country: "Hong Kong", countryCode: "HK", currencyCode: "CNY" },
  // Singapore & Malaysia
  "Asia/Singapore": { country: "Singapore", countryCode: "SG", currencyCode: "SGD" },
  "Asia/Kuala_Lumpur": { country: "Malaysia", countryCode: "MY", currencyCode: "MYR" },
  // South Asia & Southeast Asia
  "Asia/Dhaka": { country: "Bangladesh", countryCode: "BD", currencyCode: "BDT" },
  "Asia/Bangkok": { country: "Thailand", countryCode: "TH", currencyCode: "THB" },
  "Asia/Jakarta": { country: "Indonesia", countryCode: "ID", currencyCode: "IDR" },
  "Asia/Manila": { country: "Philippines", countryCode: "PH", currencyCode: "PHP" },
  // Australasia
  "Pacific/Auckland": { country: "New Zealand", countryCode: "NZ", currencyCode: "NZD" },
  "Australia/Sydney": { country: "Australia", countryCode: "AU", currencyCode: "AUD" },
  "Australia/Melbourne": { country: "Australia", countryCode: "AU", currencyCode: "AUD" },
  "Australia/Brisbane": { country: "Australia", countryCode: "AU", currencyCode: "AUD" },
  "Australia/Perth": { country: "Australia", countryCode: "AU", currencyCode: "AUD" },
  "Australia/Adelaide": { country: "Australia", countryCode: "AU", currencyCode: "AUD" },
  // Canada
  "America/Toronto": { country: "Canada", countryCode: "CA", currencyCode: "CAD" },
  "America/Vancouver": { country: "Canada", countryCode: "CA", currencyCode: "CAD" },
  "America/Montreal": { country: "Canada", countryCode: "CA", currencyCode: "CAD" },
  "America/Edmonton": { country: "Canada", countryCode: "CA", currencyCode: "CAD" },
  // USA
  "America/New_York": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Chicago": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Los_Angeles": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Denver": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Phoenix": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Detroit": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Indianapolis": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "America/Anchorage": { country: "United States", countryCode: "US", currencyCode: "USD" },
  "Pacific/Honolulu": { country: "United States", countryCode: "US", currencyCode: "USD" },
  // Turkey, Brazil, Mexico, South Africa, Middle East, Africa, etc.
  "Europe/Istanbul": { country: "Turkey", countryCode: "TR", currencyCode: "TRY" },
  "America/Sao_Paulo": { country: "Brazil", countryCode: "BR", currencyCode: "BRL" },
  "America/Mexico_City": { country: "Mexico", countryCode: "MX", currencyCode: "MXN" },
  "Africa/Johannesburg": { country: "South Africa", countryCode: "ZA", currencyCode: "ZAR" },
  "Asia/Kuwait": { country: "Kuwait", countryCode: "KW", currencyCode: "KWD" },
  "Asia/Qatar": { country: "Qatar", countryCode: "QA", currencyCode: "QAR" },
  "Asia/Muscat": { country: "Oman", countryCode: "OM", currencyCode: "OMR" },
  "Asia/Bahrain": { country: "Bahrain", countryCode: "BH", currencyCode: "BHD" },
  "Africa/Cairo": { country: "Egypt", countryCode: "EG", currencyCode: "EGP" },
  "Africa/Lagos": { country: "Nigeria", countryCode: "NG", currencyCode: "NGN" },
  "Africa/Nairobi": { country: "Kenya", countryCode: "KE", currencyCode: "KES" },
  "Europe/Zurich": { country: "Switzerland", countryCode: "CH", currencyCode: "CHF" },
};

/**
 * Detects the user's current environment location and corresponding currency.
 * Inspects system timezone, browser locale, and timezone offset.
 */
export function detectSystemLocationAndCurrency(): SystemLocationDetection {
  let timeZone = "UTC";
  let locale = "en-US";

  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_) {}
  }
  if (typeof navigator !== "undefined") {
    locale = navigator.language || (navigator.languages && navigator.languages[0]) || "en-US";
  }

  // 1. Direct Timezone match
  if (timeZone && TIMEZONE_TO_LOCATION_INFO[timeZone]) {
    const info = TIMEZONE_TO_LOCATION_INFO[timeZone];
    const currency = SUPPORTED_CURRENCIES[info.currencyCode] || SUPPORTED_CURRENCIES.USD;
    return {
      country: info.country,
      countryCode: info.countryCode,
      currency,
      timeZone,
      locale,
      source: "TIMEZONE",
    };
  }

  // 2. Partial Timezone name matching (e.g. contains 'Karachi', 'Dubai', 'London', etc.)
  if (timeZone) {
    const tzLower = timeZone.toLowerCase();
    for (const [key, info] of Object.entries(TIMEZONE_TO_LOCATION_INFO)) {
      if (tzLower.includes(key.toLowerCase()) || key.toLowerCase().includes(tzLower)) {
        const currency = SUPPORTED_CURRENCIES[info.currencyCode] || SUPPORTED_CURRENCIES.USD;
        return {
          country: info.country,
          countryCode: info.countryCode,
          currency,
          timeZone,
          locale,
          source: "TIMEZONE",
        };
      }
    }
  }

  // 3. Browser locale / language region detection (e.g. en-PK, ur-PK -> PK -> PKR)
  if (locale) {
    const parts = locale.split("-");
    if (parts.length > 1) {
      const region = parts[parts.length - 1].toUpperCase();
      const code = COUNTRY_TO_CURRENCY[region];
      if (code && SUPPORTED_CURRENCIES[code]) {
        let countryName = region;
        for (const [cntry, cur] of Object.entries(COUNTRY_TO_CURRENCY)) {
          if (cur === code && cntry.length > 3) {
            countryName = cntry;
            break;
          }
        }
        return {
          country: countryName,
          countryCode: region,
          currency: SUPPORTED_CURRENCIES[code],
          timeZone,
          locale,
          source: "LOCALE",
        };
      }
    }
  }

  // 4. Timezone offset heuristics
  try {
    const offsetMin = new Date().getTimezoneOffset(); // -300 for UTC+5
    if (offsetMin === -300) {
      // UTC+5 (PKT)
      return {
        country: "Pakistan",
        countryCode: "PK",
        currency: SUPPORTED_CURRENCIES.PKR,
        timeZone,
        locale,
        source: "OFFSET",
      };
    } else if (offsetMin === -330) {
      // UTC+5:30 (IST)
      return {
        country: "India",
        countryCode: "IN",
        currency: SUPPORTED_CURRENCIES.INR,
        timeZone,
        locale,
        source: "OFFSET",
      };
    } else if (offsetMin === -240) {
      // UTC+4 (GST)
      return {
        country: "United Arab Emirates",
        countryCode: "AE",
        currency: SUPPORTED_CURRENCIES.AED,
        timeZone,
        locale,
        source: "OFFSET",
      };
    } else if (offsetMin === -180) {
      // UTC+3 (AST)
      return {
        country: "Saudi Arabia",
        countryCode: "SA",
        currency: SUPPORTED_CURRENCIES.SAR,
        timeZone,
        locale,
        source: "OFFSET",
      };
    } else if (offsetMin === 0) {
      // UTC 0 (GMT)
      return {
        country: "United Kingdom",
        countryCode: "GB",
        currency: SUPPORTED_CURRENCIES.GBP,
        timeZone,
        locale,
        source: "OFFSET",
      };
    }
  } catch (_) {}

  // 5. Default fallback
  return {
    country: "United States",
    countryCode: "US",
    currency: SUPPORTED_CURRENCIES.USD,
    timeZone,
    locale,
    source: "DEFAULT",
  };
}

/**
 * Auto-detects local currency from available device metadata or explicit input:
 * If an explicit valid non-empty country is supplied (and isn't the generic fallback), it derives from that;
 * otherwise it executes full system timezone/locale auto-detection.
 */
export function autoDetectCurrency(countryOrLocale?: string): CurrencyDetails {
  // If explicitly passed a valid country string (e.g. "Pakistan", "United Kingdom", "PK", etc.)
  if (countryOrLocale && typeof countryOrLocale === "string" && countryOrLocale.trim()) {
    const normalized = countryOrLocale.trim().toUpperCase();
    const code = COUNTRY_TO_CURRENCY[normalized];
    if (code && SUPPORTED_CURRENCIES[code]) {
      return SUPPORTED_CURRENCIES[code];
    }
  }

  // Otherwise detect from actual system/device environment
  return detectSystemLocationAndCurrency().currency;
}

/**
 * Derives default currency from location or country name/code.
 */
export function deriveCurrencyFromCountry(countryStr?: string): CurrencyDetails {
  return autoDetectCurrency(countryStr);
}

/**
 * Returns detected location info for diagnostic display in UI
 */
export function getDetectedLocationInfo(): {
  countryGuess: string;
  countryCode: string;
  detectedCode: string;
  detectedSymbol: string;
  timeZone: string;
  locale: string;
  source: string;
} {
  const detected = detectSystemLocationAndCurrency();
  return {
    countryGuess: detected.country,
    countryCode: detected.countryCode,
    detectedCode: detected.currency.code,
    detectedSymbol: detected.currency.symbol,
    timeZone: detected.timeZone,
    locale: detected.locale,
    source: detected.source,
  };
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
