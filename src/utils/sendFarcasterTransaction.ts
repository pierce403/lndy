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

  const request = sanitizeRequest({
    from: fromAddress,
    to: toAddress,
    data: transaction.data,
    value: toHex(transaction.value),
    gas: toHex(transaction.gas),
    gasPrice: toHex(transaction.gasPrice),
    maxFeePerGas: toHex(transaction.maxFeePerGas),
    maxPriorityFeePerGas: toHex(transaction.maxPriorityFeePerGas),
    chainId: `0x${transaction.chain.id.toString(16)}`,
    nonce: toHex(transaction.nonce),
    accessList: transaction.accessList,
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
