import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { Loan } from "../types/types";
import { getLauncherContract, getLoanContract } from "../lib/client";

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;

  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!launcherAddress) {
        setError("Launcher contract address not configured");
        setIsLoading(false);
        return;
      }

      try {
        const launcherContract = getLauncherContract();
        
        // Read loan addresses from the launcher contract
        const loanAddresses = await readContract({
          contract: launcherContract,
          method: "function getAllLoans() view returns (address[])",
          params: [],
        });

        if (!loanAddresses || loanAddresses.length === 0) {
          setIsLoading(false);
          return;
        }

        const loanDetailsPromises = loanAddresses.map(async (loanAddress: string) => {
          try {
            const loanContract = getLoanContract(loanAddress);
            
            const loanDetails = await readContract({
              contract: loanContract,
              method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _interestRate, uint256 _duration, uint256 _fundingDeadline, uint256 _repaymentDate, string _description, address _borrower, uint256 _totalFunded, bool _isActive, bool _isRepaid)",
              params: [],
            });
            
            return {
              address: loanAddress,
              loanAmount: loanDetails[0],
              interestRate: Number(loanDetails[1]),
              duration: Number(loanDetails[2]),
              fundingDeadline: Number(loanDetails[3]),
              repaymentDate: Number(loanDetails[4]),
              description: loanDetails[5],
              borrower: loanDetails[6],
              totalFunded: loanDetails[7],
              isActive: loanDetails[8],
              isRepaid: loanDetails[9]
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
        setError("Failed to fetch loans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanDetails();
  }, [launcherAddress]);

  return { loans, isLoading, error };
};
