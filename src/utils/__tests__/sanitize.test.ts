import { describe, expect, it } from "vitest";
import {
  normalizeLoanDetails,
  sanitizeAddress,
  sanitizeOptionalString,
  sanitizeString,
  toBigIntSafe,
  toBooleanSafe,
  toNumberSafe,
} from "../sanitize";

const reactElementMock = {
  $$typeof: Symbol.for("react.element"),
  type: "div",
  key: null,
  ref: null,
  props: { children: "Hello" },
};

describe("sanitize helpers", () => {
  it("sanitizes primitive values correctly", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
    expect(sanitizeString(42)).toBe("42");
    expect(sanitizeString(true)).toBe("true");
    expect(sanitizeString(10n)).toBe("10");
  });

  it("falls back for React elements and opaque objects", () => {
    expect(sanitizeString(reactElementMock, "fallback")).toBe("fallback");
    expect(sanitizeString({ toString: () => "[object Object]" }, "fallback")).toBe("fallback");
  });

  it("sanitizes optional string values", () => {
    expect(sanitizeOptionalString(" value ")).toBe("value");
    expect(sanitizeOptionalString("   ")).toBeUndefined();
    expect(sanitizeOptionalString(null)).toBeUndefined();
  });

  it("coerces numbers, bigints and strings safely", () => {
    expect(toNumberSafe("100")).toBe(100);
    expect(toNumberSafe(123n)).toBe(123);
    expect(toNumberSafe({ toString: () => "250" })).toBe(250);
    expect(toNumberSafe("not-a-number", 5)).toBe(5);

    expect(toBigIntSafe("900")).toBe(900n);
    expect(toBigIntSafe({ _isBigNumber: true, toString: () => "1200" })).toBe(1200n);
  });

  it("coerces booleans safely", () => {
    expect(toBooleanSafe(true)).toBe(true);
    expect(toBooleanSafe(1)).toBe(true);
    expect(toBooleanSafe(0)).toBe(false);
    expect(toBooleanSafe("yes")).toBe(true);
    expect(toBooleanSafe("no")).toBe(false);
    expect(toBooleanSafe("maybe", true)).toBe(true);
  });

  it("sanitizes addresses", () => {
    expect(sanitizeAddress("0xABCDEFabcdefABCDEFabcdefABCDEFabcdefabcd")).toBe(
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    );
    expect(sanitizeAddress("invalid")).toBe("0x0000000000000000000000000000000000000000");
  });
});

describe("normalizeLoanDetails", () => {
  const address = "0x1234567890abcdef1234567890abcdef12345678";

  it("normalizes tuple data and strips problematic metadata", () => {
    const raw = [
      1000n,
      { _isBigNumber: true, toString: () => "250" },
      "2000",
      "1500",
      reactElementMock,
      { toString: () => "[object Object]" },
      " ipfs://hash ",
      "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefabcd",
      500n,
      0n,
      0n,
      1,
      0,
    ] as const;

    const normalized = normalizeLoanDetails(raw, address);

    expect(normalized.address).toBe(address);
    expect(normalized.loanAmount).toBe(1000n);
    expect(normalized.interestRate).toBe(250);
    expect(normalized.duration).toBe(500);
    expect(normalized.fundingDeadline).toBe(1500);
    expect(normalized.repaymentDate).toBe(2000);
    expect(normalized.title).toBeUndefined();
    expect(normalized.description).toBe("No description provided.");
    expect(normalized.imageURI).toBe("ipfs://hash");
    expect(normalized.borrower).toBe("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    expect(normalized.totalFunded).toBe(500n);
    expect(normalized.isActive).toBe(true);
    expect(normalized.isRepaid).toBe(false);
  });

  it("applies fallbacks when metadata is missing", () => {
    const raw = {
      loanAmount: undefined,
      thankYouAmount: undefined,
      targetRepaymentDate: undefined,
      fundingDeadline: undefined,
      title: undefined,
      description: undefined,
      baseImageURI: undefined,
      borrower: "bad-address",
      totalFunded: undefined,
      isActive: undefined,
      isFullyRepaid: undefined,
    };

    const normalized = normalizeLoanDetails(raw, address);

    expect(normalized.loanAmount).toBe(0n);
    expect(normalized.interestRate).toBe(0);
    expect(normalized.duration).toBe(0);
    expect(normalized.description).toBe("No description provided.");
    expect(normalized.imageURI).toBe("");
    expect(normalized.borrower).toBe("0x0000000000000000000000000000000000000000");
    expect(normalized.totalFunded).toBe(0n);
    expect(normalized.isActive).toBe(false);
    expect(normalized.isRepaid).toBe(false);
  });
});
