import { useState, useEffect } from "react";
import { useAddress, useContract } from "@thirdweb-dev/react";
import { Loan } from "../types/types";
import { sdk } from "../lib/client";

export const useInvestments = () => {
  const address = useAddress();
  const [investments, setInvestments] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;
  const { contract: launcherContract } = useContract(launcherAddress);

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const allLoanAddresses = await launcherContract?.call("getAllLoans");
        
        if (!allLoanAddresses || allLoanAddresses.length === 0) {
          setInvestments([]);
          setIsLoading(false);
          return;
        }

        const investmentPromises = allLoanAddresses.map(async (loanAddress: string) => {
          try {
            const loanContract = await sdk.getContract(loanAddress);
            
            const balance = await loanContract.call("balanceOf", [address, 1]);
            
            if (balance && balance > 0) {
              const loanDetails = await loanContract.call("getLoanDetails");
              
              return {
                address: loanAddress,
                loanAmount: loanDetails._loanAmount,
                interestRate: loanDetails._interestRate,
                duration: loanDetails._duration,
                fundingDeadline: loanDetails._fundingDeadline,
                repaymentDate: loanDetails._repaymentDate,
                description: loanDetails._description,
                borrower: loanDetails._borrower,
                totalFunded: loanDetails._totalFunded,
                isActive: loanDetails._isActive,
                isRepaid: loanDetails._isRepaid
              };
            }
            
            return null;
          } catch (err) {
            console.error(`Error checking investment for loan ${loanAddress}:`, err);
            return null;
          }
        });

        const userInvestments = await Promise.all(investmentPromises);
        setInvestments(userInvestments.filter(Boolean) as Loan[]);
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, [address, launcherContract]);

  return { investments, isLoading };
};
