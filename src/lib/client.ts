import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
});

export const getLauncherContract = () => {
  const contractAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Launcher contract address not found in environment variables");
  }
  return getContract({
    client,
    chain: sepolia,
    address: contractAddress,
  });
};

export const getLoanContract = (loanAddress: string) => {
  return getContract({
    client,
    chain: sepolia,
    address: loanAddress,
  });
};
