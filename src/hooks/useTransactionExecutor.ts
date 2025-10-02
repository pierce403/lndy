import { useCallback, useMemo, useState } from "react";
import { useSendTransaction } from "thirdweb/react";
import type { PreparedTransaction, WaitForReceiptOptions } from "thirdweb";
import { useWallet } from "./useWallet";
import { sendFarcasterTransaction } from "../utils/sendFarcasterTransaction";

export type TransactionCallbacks = {
  onSuccess?: (result: WaitForReceiptOptions) => void;
  onError?: (error: Error) => void;
};

export const useTransactionExecutor = () => {
  const { mutate: sendTransaction, isPending: isThirdwebPending } = useSendTransaction();
  const { walletType, address, farcasterProvider } = useWallet();
  const [isFarcasterPending, setIsFarcasterPending] = useState(false);

  const isUsingFarcaster = useMemo(
    () => walletType === "farcaster" && !!farcasterProvider && !!address,
    [walletType, farcasterProvider, address],
  );

  const executeTransaction = useCallback(
    (transaction: PreparedTransaction, callbacks?: TransactionCallbacks) => {
      if (walletType === "farcaster") {
        if (!address) {
          callbacks?.onError?.(new Error("Farcaster wallet address unavailable"));
          return;
        }

        if (!farcasterProvider) {
          callbacks?.onError?.(new Error("Farcaster provider unavailable. Please reconnect your Farcaster wallet."));
          return;
        }

        setIsFarcasterPending(true);
        sendFarcasterTransaction({
          transaction,
          provider: farcasterProvider,
          fromAddress: address,
        })
          .then((result) => {
            callbacks?.onSuccess?.(result);
          })
          .catch((error) => {
            const normalizedError =
              error instanceof Error ? error : new Error(typeof error === "string" ? error : "Transaction failed");
            callbacks?.onError?.(normalizedError);
          })
          .finally(() => {
            setIsFarcasterPending(false);
          });
        return;
      }

      sendTransaction(transaction, {
        onSuccess: callbacks?.onSuccess,
        onError: callbacks?.onError,
      });
    },
    [walletType, address, farcasterProvider, sendTransaction],
  );

  return {
    executeTransaction,
    isPending: isThirdwebPending || isFarcasterPending,
    isUsingFarcaster,
  };
};
