import { createContext } from "react";
import type { FarcasterWalletContextValue } from "../hooks/useFarcasterWallet";

export const FarcasterWalletContext = createContext<FarcasterWalletContextValue | null>(null);

