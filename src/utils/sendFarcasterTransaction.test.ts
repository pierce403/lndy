import { describe, expect, it } from "vitest";
import type { Hex } from "viem";

import { toHex } from "./sendFarcasterTransaction";

describe("toHex", () => {
  it("returns the provided hex string normalized", () => {
    expect(toHex("0x5208" as Hex)).toBe("0x5208");
  });

  it("converts bigint to lowercase hex", () => {
    expect(toHex(21000n)).toBe("0x5208");
  });

  it("returns undefined for undefined input", () => {
    expect(toHex(undefined)).toBeUndefined();
  });
});
