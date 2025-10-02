import type { PreparedTransaction, WaitForReceiptOptions } from "thirdweb";
import { resolvePromisedValue } from "thirdweb/utils";
import type { EIP1193Provider, Hex } from "viem";

const toHex = (value: bigint | number | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
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
  const resolvedToCandidate =
    transaction.to ||
    ((transaction as unknown as { __contract?: { address?: string } }).__contract?.address ?? undefined);

  const [
    toAddress,
    data,
    value,
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    maxFeePerBlobGas,
    nonce,
    accessList,
  ] = await Promise.all([
    resolvePromisedValue(resolvedToCandidate),
    resolvePromisedValue(transaction.data),
    resolvePromisedValue(transaction.value),
    resolvePromisedValue(transaction.gas),
    resolvePromisedValue(transaction.gasPrice),
    resolvePromisedValue(transaction.maxFeePerGas),
    resolvePromisedValue(transaction.maxPriorityFeePerGas),
    resolvePromisedValue(transaction.maxFeePerBlobGas),
    resolvePromisedValue(transaction.nonce),
    resolvePromisedValue(transaction.accessList),
  ]);

  if (!toAddress) {
    throw new Error("Missing contract address for Farcaster transaction");
  }

  const request = sanitizeRequest({
    from: fromAddress,
    to: toAddress,
    data,
    value: toHex(value),
    gas: toHex(gas),
    gasPrice: toHex(gasPrice),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    maxFeePerBlobGas: toHex(maxFeePerBlobGas),
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
