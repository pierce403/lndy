import { Loan } from "../types/types";

const REACT_ELEMENT_TYPE = Symbol.for("react.element");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const objectTagPattern = /^\[object\s.+\]$/;

const isReactElement = (value: unknown): boolean => {
  return (
    typeof value === "object" &&
    value !== null &&
    "$$typeof" in value &&
    (value as { $$typeof: unknown }).$$typeof === REACT_ELEMENT_TYPE
  );
};

const hasToString = (value: unknown): value is { toString: () => string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof (value as { toString: unknown }).toString === "function"
  );
};

export const sanitizeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null || isReactElement(value)) {
    return fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (hasToString(value)) {
    try {
      const coerced = value.toString();
      if (!coerced) {
        return fallback;
      }

      if (objectTagPattern.test(coerced)) {
        return fallback;
      }

      return coerced.trim();
    } catch {
      return fallback;
    }
  }

  try {
    const coerced = String(value);
    if (!coerced || objectTagPattern.test(coerced)) {
      return fallback;
    }
    return coerced.trim();
  } catch {
    return fallback;
  }
};

export const sanitizeOptionalString = (value: unknown): string | undefined => {
  const sanitized = sanitizeString(value, "");
  return sanitized ? sanitized : undefined;
};

const isBigNumberLike = (value: unknown): value is { _isBigNumber: true; toString: () => string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "_isBigNumber" in value &&
    (value as { _isBigNumber?: unknown })._isBigNumber === true &&
    "toString" in value &&
    typeof (value as { toString: unknown }).toString === "function"
  );
};

export const toBigIntSafe = (value: unknown, fallback: bigint = 0n): bigint => {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return BigInt(Math.trunc(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }
    try {
      return BigInt(trimmed);
    } catch {
      return fallback;
    }
  }

  if (isBigNumberLike(value)) {
    try {
      return BigInt(value.toString());
    } catch {
      return fallback;
    }
  }

  if (typeof value === "object" && value !== null && hasToString(value)) {
    try {
      return BigInt(value.toString());
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export const toNumberSafe = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (isBigNumberLike(value)) {
    try {
      const parsed = Number(value.toString());
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  if (typeof value === "object" && value !== null && hasToString(value)) {
    try {
      const parsed = Number(value.toString());
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export const toBooleanSafe = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "bigint") {
    return value !== 0n;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "yes" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "no" || normalized === "0") {
      return false;
    }
    return fallback;
  }

  return fallback;
};

export const sanitizeAddress = (value: unknown, fallback = ZERO_ADDRESS): string => {
  const potential = sanitizeString(value, "").toLowerCase();
  if (/^0x[a-f0-9]{40}$/.test(potential)) {
    return potential;
  }
  return fallback;
};

export type RawLoanDetails =
  | Loan
  | (readonly unknown[])
  | {
      [key: string]: unknown;
    };

const getValue = (source: RawLoanDetails, index: number, ...keys: string[]): unknown => {
  if (Array.isArray(source) && source.length > index) {
    return source[index];
  }

  if (typeof source === "object" && source !== null) {
    for (const key of keys) {
      if (key in source) {
        return (source as Record<string, unknown>)[key];
      }
    }
  }

  return undefined;
};

export const normalizeLoanDetails = (raw: RawLoanDetails, address: string): Loan => {
  const loanAmount = toBigIntSafe(getValue(raw, 0, "_loanAmount", "loanAmount"));
  const thankYouAmount = toNumberSafe(getValue(raw, 1, "_thankYouAmount", "thankYouAmount"));
  const targetRepaymentDate = toNumberSafe(
    getValue(raw, 2, "_targetRepaymentDate", "targetRepaymentDate"),
  );
  const fundingDeadline = toNumberSafe(
    getValue(raw, 3, "_fundingDeadline", "fundingDeadline"),
  );
  const title = sanitizeOptionalString(getValue(raw, 4, "_title", "title"));
  const description = sanitizeString(
    getValue(raw, 5, "_description", "description"),
    "No description provided.",
  );
  const imageURI = sanitizeString(getValue(raw, 6, "_baseImageURI", "baseImageURI"));
  const borrower = sanitizeAddress(getValue(raw, 7, "_borrower", "borrower"));
  const totalFunded = toBigIntSafe(getValue(raw, 8, "_totalFunded", "totalFunded"));
  const isActive = toBooleanSafe(getValue(raw, 11, "_isActive", "isActive"));
  const isRepaid = toBooleanSafe(getValue(raw, 12, "_isFullyRepaid", "isFullyRepaid"));

  const duration = Math.max(0, targetRepaymentDate - fundingDeadline);

  return {
    address,
    loanAmount,
    interestRate: thankYouAmount,
    duration,
    fundingDeadline,
    repaymentDate: targetRepaymentDate,
    title,
    description,
    imageURI,
    borrower,
    totalFunded,
    isActive,
    isRepaid,
  };
};
