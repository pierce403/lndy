import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Sepolia } from "@thirdweb-dev/chains";

export const sdk = new ThirdwebSDK(Sepolia, {
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
});

export const getLauncherContract = async () => {
  const contractAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Launcher contract address not found in environment variables");
  }
  return await sdk.getContract(contractAddress);
};

export const getLoanContract = async (loanAddress: string) => {
  return await sdk.getContract(loanAddress);
};
