import { useState, useEffect } from "react";
import { useContract, useContractRead } from "@thirdweb-dev/react";
import { Loan } from "../types/types";
import { sdk } from "../lib/client";

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;
  const { contract: launcherContract } = useContract(launcherAddress);
  
  const { data: loanAddresses, isLoading: isLoadingLoans } = useContractRead(
    launcherContract,
    "getAllLoans"
  );

  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!loanAddresses || (Array.isArray(loanAddresses) && loanAddresses.length === 0)) {
        setIsLoading(false);
        return;
      }

      try {
        const addresses = Array.isArray(loanAddresses) ? loanAddresses : [];
        
        const loanDetailsPromises = addresses.map(async (loanAddress: string) => {
          try {
            const loanContract = await sdk.getContract(loanAddress);
            
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
          } catch (err) {
            console.error(`Error fetching details for loan ${loanAddress}:`, err);
            return null;
          }
        });

        const loanDetails = await Promise.all(loanDetailsPromises);
        setLoans(loanDetails.filter(Boolean) as Loan[]);
      } catch (error) {
        console.error("Error fetching loan details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingLoans && loanAddresses) {
      fetchLoanDetails();
    }
  }, [loanAddresses, isLoadingLoans]);

  return { loans, isLoading };
};
