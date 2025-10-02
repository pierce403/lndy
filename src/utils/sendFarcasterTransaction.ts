import type { PreparedTransaction, WaitForReceiptOptions } from "thirdweb";
import type { EIP1193Provider, Hex } from "viem";

export const toHex = (
  value: bigint | number | Hex | undefined,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.startsWith("0x") || value.startsWith("0X")
      ? value.slice(2)
      : value;

    return `0x${normalized}`;
  }

  const bigIntValue = typeof value === "number" ? BigInt(value) : value;
  return `0x${bigIntValue.toString(16)}`;
};

const sanitizeRequest = (request: Record<string, unknown>) => {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

const resolvePromisedValue = async <T>(
  value: T | (() => Promise<T>) | Promise<T> | undefined,
): Promise<T | undefined> => {
  if (typeof value === "function") {
    return await (value as () => Promise<T>)();
  }

  if (
    value &&
    typeof value === "object" &&
    "then" in (value as Record<string, unknown>) &&
    typeof (value as { then?: unknown }).then === "function"
  ) {
    return await (value as Promise<T>);
  }

  return value as T | undefined;
};

export const sendFarcasterTransaction = async ({
  transaction,
  provider,
  fromAddress,
}: {
  transaction: PreparedTransaction;
  provider: EIP1193Provider;
  fromAddress: string;
}): Promise<WaitForReceiptOptions> => {
  const toAddress =
    transaction.to ||
    ((transaction as unknown as { __contract?: { address?: string } }).__contract?.address ?? undefined);

  if (!toAddress) {
    throw new Error("Missing contract address for Farcaster transaction");
  }

  const [data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, value, accessList] = await Promise.all([
    resolvePromisedValue(transaction.data),
    resolvePromisedValue(transaction.gas),
    resolvePromisedValue(transaction.gasPrice),
    resolvePromisedValue(transaction.maxFeePerGas),
    resolvePromisedValue(transaction.maxPriorityFeePerGas),
    resolvePromisedValue(transaction.nonce),
    resolvePromisedValue(transaction.value),
    resolvePromisedValue(transaction.accessList),
  ]);

  const request = sanitizeRequest({
    from: fromAddress,
    to: toAddress,

    data,
    value: toHex(value),
    gas: toHex(gas),
    gasPrice: toHex(gasPrice),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    chainId: `0x${transaction.chain.id.toString(16)}`,
    nonce: toHex(nonce),
    accessList,
  });

  const transactionHash = (await provider.request({
    method: "eth_sendTransaction",
    params: [request],
  })) as Hex;

  return {
    transactionHash,
    client: transaction.client,
    chain: transaction.chain,
  };
};
